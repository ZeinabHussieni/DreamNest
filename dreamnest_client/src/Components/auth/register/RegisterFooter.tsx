import React from "react";
import { Link } from "react-router-dom";


const RegisterFooter = () => {
  return (
        <div className="back">
        <p>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
  );
};

export default RegisterFooter;
