import React from "react";
import { Routes, Route } from "react-router-dom";
import App from "../App";
import RegisterForm from "../Pages/register/Register";

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/register" element={<RegisterForm />} />
    </Routes>
  );
};

export default AppRoutes;
