import React from "react";
import "./input.css"


type Props = {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
};

const FormInput: React.FC<Props> = ({
  name,
  label,
  type = "text",
  placeholder,
  required,
  className,
}) => {
  return (
    <div className={`form-input-group ${className ?? ""}`}>
      <label className="form-label" htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="form-control"
      />
    </div>
  );
};

export default FormInput;
