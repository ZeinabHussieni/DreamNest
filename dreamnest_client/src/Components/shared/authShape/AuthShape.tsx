import React from "react";
import left from "../../../Assets/Images/leftauth.jpg";
import right from "../../../Assets/Images/rightauth.jpg";
import "./authShape.css";

const AuthShape: React.FC = () => {
  return (
    <div className="auth-shape-container">
      <img src={left} alt="Left Auth" className="auth-shape-left" />
      <img src={right} alt="Right Auth" className="auth-shape-right" />
    </div>
  );
};

export default AuthShape;
