import React from "react";
import "./authInput.css";

type InputProps = {
  type?: string;
  name: string;
  hint: string;
  placeholder?: string;
  required?: boolean;
  error?: string; 
};

const Input: React.FC<InputProps> = ({
  type = "text",
  name,
  hint,
  placeholder,
  required,
  error,
}) => {
  return (
    <div className={`input-group-auth ${error ? "has-error" : ""}`}>
      <label className="auth-label authLabel" htmlFor={name}>
        {hint}
      </label>

      <input
        id={name}
        type={type}
        name={name}
        placeholder={placeholder}
        required={required}
        className={`primary-input-auth ${error ? "input-error" : ""}`}
      />

  
      {error && <small className="input-error-text">{error}</small>}
    </div>
  );
};

export default Input;
