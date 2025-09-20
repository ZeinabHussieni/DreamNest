import React from "react";

import "./login.css";
import LoginForm from "../../Components/auth/login/LoginForm";
import LoginAnimation from "../../Components/auth/login/LoginAnimation";
import AuthShape from "../../Components/shared/authShape/AuthShape";
import LoginFooter from "../../Components/auth/login/LoginFooter";

const Login = () => {
  return (
    <div className="register-container-wrapper">
     
      <div className="register-container">
        <LoginAnimation />
        <LoginForm />
        <AuthShape/>
      </div>

       <LoginFooter/>
    </div>
  );
};

export default Login;
