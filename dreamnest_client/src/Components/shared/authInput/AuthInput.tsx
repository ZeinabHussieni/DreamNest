import React, { ChangeEvent } from "react";
import "./authInput.css";

type InputProps = {
  type?: string;
  name: string;
  hint: string;
  placeholder?: string;
  required?: boolean;
};

const Input: React.FC<InputProps> = ({
  type = "text",
  name,
  hint,
  placeholder,
  required,
 }) => {
  return (
    <div className="input-group-auth">
      <label className="auth-label authLabel" htmlFor={name}>
        {hint}
      </label>

      <input
        id={name}
        type={type}
        name={name}
        placeholder={placeholder}
        required={required}
        className="primary-input-auth"
      />
    </div>
  );
};

export default Input;
