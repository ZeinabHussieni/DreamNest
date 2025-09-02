import React, { createContext, useContext } from "react";
import useNotifications from "../Hooks/notifications/useNotifications";

type Ctx = ReturnType<typeof useNotifications> | null;

const NotificationCtx = createContext<Ctx>(null);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const value = useNotifications();
  return <NotificationCtx.Provider value={value}>{children}</NotificationCtx.Provider>;
};

export function useNotificationCenter() {
  const ctx = useContext(NotificationCtx);
  if (!ctx) throw new Error("useNotificationCenter must be used within NotificationProvider");
  return ctx;
}
