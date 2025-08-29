import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../navbar/Navbar";
import "./appLayout.css"; 



const AppLayout = () => {
  return (
    <div>
      <Navbar />
        <div className="main-content">
          <div className="container">
          <Outlet />
          </div>
        </div>
    </div>
  );
};

export default AppLayout;
