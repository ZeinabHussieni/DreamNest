import React, { createContext, useContext, useState, ReactNode } from "react";
import { refreshSocketsAfterAuthChange } from "../Services/socket/socket";

type User = {
  id: number;
  userName?: string;
  email?: string;
  profilePicture?: string | null;
  [k: string]: unknown;
};

type AuthContextType = {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (accessToken: string, user: User) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "token";
const USER_KEY = "user";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem(USER_KEY);
    try {
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  });

  const isAuthenticated = !!token;

  const login = (accessToken: string, newUser: User) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setToken(accessToken);
    setUser(newUser);
    refreshSocketsAfterAuthChange();
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    refreshSocketsAfterAuthChange();
  };

  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside an AuthProvider");
  return ctx;
};
