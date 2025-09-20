import React from "react";

import "./register.css";
import RegisterForm from "../../Components/auth/register/RegisterForm";
import RegisterAnimation from "../../Components/auth/register/RegsiterAnimation";
import AuthShape from "../../Components/shared/authShape/AuthShape";
import RegisterFooter from "../../Components/auth/register/RegisterFooter";

const Register = () => {
  return (
    <div className="register-container-wrapper">
     
      <div className="register-container">
        <RegisterAnimation />
        <RegisterForm />
        <AuthShape/>
      </div>

       <RegisterFooter/>
    </div>
  );
};

export default Register;
