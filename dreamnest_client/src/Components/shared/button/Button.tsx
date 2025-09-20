import React, { MouseEventHandler } from "react";
import "./button.css";

type ButtonProps = {
  text: string;
  onClick?: MouseEventHandler<HTMLButtonElement>; 
  className?: string; 
  disabled?: boolean;
  loading?: boolean;
};

const Button: React.FC<ButtonProps> = ({ text, onClick, className, disabled, loading }) => {
  const btnClass = className ? className : "primary-button";

  return (
    <button 
      className={btnClass} 
      onClick={onClick} 
      disabled={disabled || loading} 
    >
      {loading ? "Loading..." : text}
    </button>
  );
};

export default Button;
