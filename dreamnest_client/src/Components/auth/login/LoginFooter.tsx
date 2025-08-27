import React from "react";
import { Link } from "react-router-dom";


const LoginFooter = () => {
  return (
        <div className="back">
        <p>
          Don't have an account? <Link to="/register">Sign up</Link>
        </p>
      </div>
  );
};

export default LoginFooter;
