import React from "react";
import { Routes, Route } from "react-router-dom";
import App from "../App";
import RegisterForm from "../Pages/register/Register";
import LoginForm from "../Pages/login/Login";
import Navbar from "../Components/shared/navbar/Navbar";

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/register" element={<RegisterForm />} />
      <Route path="/login" element={<LoginForm />} />
      <Route path="/navbar" element={<Navbar />} />

    </Routes>
  );
};

export default AppRoutes;
