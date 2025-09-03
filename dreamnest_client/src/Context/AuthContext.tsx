import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { refreshSocketsAfterAuthChange } from "../Services/socket/socket";


type AuthContextType = {
  token: string | null;
  user: any | null;
  isAuthenticated: boolean;
  login: (accessToken: string, user: any, refreshToken?: string) => void;
  logout: () => void;
  refresh: () => Promise<string | null>; 
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);


function getJwtExp(token?: string | null): number | null {
  if (!token) return null;
  try {
    const [, payload] = token.split(".");
    const json = JSON.parse(atob(payload));
    return typeof json?.exp === "number" ? json.exp : null;
  } catch {
    return null;
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );
  const [user, setUser] = useState<any | null>(
    localStorage.getItem("user")
      ? JSON.parse(localStorage.getItem("user") as string)
      : null
  );
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!token);


  const refreshTimerRef = useRef<number | null>(null);


  const login = (accessToken: string, newUser: any, refreshToken?: string) => {
    localStorage.setItem("token", accessToken);
    localStorage.setItem("access_token", accessToken);
    if (refreshToken) localStorage.setItem("refreshToken", refreshToken);

    localStorage.setItem("user", JSON.stringify(newUser));
    if (newUser?.id) localStorage.setItem("userId", String(newUser.id));

    setToken(accessToken);
    setUser(newUser);
    setIsAuthenticated(true);
    refreshSocketsAfterAuthChange();
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("access_token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    localStorage.removeItem("userId");
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    refreshSocketsAfterAuthChange();

    if (refreshTimerRef.current) {
      window.clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  };


  const refresh = async (): Promise<string | null> => {
    const rt = localStorage.getItem("refreshToken");
    if (!rt) {
      logout();
      return null;
    }

    try {

      const base =
        (import.meta as any)?.env?.VITE_API_URL ||
        (process as any)?.env?.REACT_APP_API_URL ||
        `${window.location.protocol}//${window.location.hostname}:3000`;

      const res = await fetch(`${base}/auth/refresh`, {
        method: "POST",
        headers: { Authorization: `Bearer ${rt}` },
      });
      if (!res.ok) throw new Error("refresh failed");

      const data = await res.json();
      const newAccess =
        data?.accessToken ||
        data?.access_token ||
        data?.token ||
        data?.data?.accessToken;
      const newRefresh = data?.refreshToken || data?.refresh_token;

      if (!newAccess) throw new Error("no access token in payload");

      localStorage.setItem("token", newAccess);
      localStorage.setItem("access_token", newAccess);
      if (newRefresh) localStorage.setItem("refreshToken", newRefresh);

      setToken(newAccess);
      setIsAuthenticated(true);
      refreshSocketsAfterAuthChange();
      return newAccess;
    } catch {

      logout();
      return null;
    }
  };

  useEffect(() => {

    if (refreshTimerRef.current) {
      window.clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    const exp = getJwtExp(token); 
    if (!exp) return;

    const nowSec = Math.floor(Date.now() / 1000);
    const secondsUntilExp = exp - nowSec;


    const leadSeconds = 30;
    const delayMs = Math.max((secondsUntilExp - leadSeconds) * 1000, 0);

    refreshTimerRef.current = window.setTimeout(() => {

      void refresh();
    }, delayMs);

    return () => {
      if (refreshTimerRef.current) {
        window.clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [token]); 

  return (
    <AuthContext.Provider
      value={{ token, user, isAuthenticated, login, logout, refresh }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside an AuthProvider");
  return context;
};
