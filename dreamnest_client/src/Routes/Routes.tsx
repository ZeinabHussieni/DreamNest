import React from "react";
import { Routes, Route } from "react-router-dom";
import RegisterForm from "../Pages/register/Register";
import LoginForm from "../Pages/login/Login";
import AppLayout from "../Components/shared/layout/AppLayout";


const AppRoutes: React.FC = () => {
  return (
    <Routes>

      <Route path="/register" element={<RegisterForm />} />
      <Route path="/login" element={<LoginForm />} />

  
      <Route element={<AppLayout />}>
 
      </Route>
    </Routes>
  );
};

export default AppRoutes;
