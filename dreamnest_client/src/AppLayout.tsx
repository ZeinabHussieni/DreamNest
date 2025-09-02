import React from "react";

type Props = {
  children: React.ReactNode;
};

const AppLayout: React.FC<Props> = ({ children }) => {
  return (
    <div className="app-shell">
      <main>{children}</main>
    </div>
  );
};

export default AppLayout;
