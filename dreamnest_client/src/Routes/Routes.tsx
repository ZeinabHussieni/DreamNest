import React from "react";
import { Routes, Route } from "react-router-dom";
import RegisterForm from "../Pages/register/Register";
import LoginForm from "../Pages/login/Login";
import AppLayout from "../Components/shared/layout/AppLayout";
import HomePage from "../Pages/homePage/HomePage";
import UserGoals from "../Pages/userGoals/UserGoals";

const AppRoutes: React.FC = () => {
  return (
    <Routes>

      <Route path="/register" element={<RegisterForm />} />
      <Route path="/login" element={<LoginForm />} />

  
      <Route element={<AppLayout />}>
      <Route path="/" element={<HomePage />} />
      <Route path="/userGoals" element={<UserGoals />} />

  
      </Route>
    </Routes>
  );
};

export default AppRoutes;
