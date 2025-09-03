import { createContext, useContext, useState, ReactNode } from "react";
import { refreshSocketsAfterAuthChange } from "../Services/socket/socket";

type AuthContextType = {
  token: string | null;
  user: any | null;
  isAuthenticated: boolean;
  login: (accessToken: string, user: any, refreshToken?: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [user, setUser] = useState<any | null>(
    localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")!) : null
  );

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!token);

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
  };

  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside an AuthProvider");
  return context;
};
