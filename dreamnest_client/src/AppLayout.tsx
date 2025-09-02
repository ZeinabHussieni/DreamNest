import React from "react";
// import { NotificationsProvider } from "./Context/NotificationsContext";
import { useAuth } from "./Context/AuthContext";

type Props = { children: React.ReactNode };

export default function AppLayout({ children }: Props) {
  const { user } = useAuth() as any;
  const userId = user?.id ? Number(user.id) : null;

  const getToken = () => localStorage.getItem("accessToken") || "";

  return (
    // <NotificationsProvider getToken={getToken} userId={userId}>
    //   {children}
    // </NotificationsProvider>
    <></>
  );
}
