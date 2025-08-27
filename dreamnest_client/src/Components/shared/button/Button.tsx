import React, { MouseEventHandler } from "react";
import "./button.css";

type ButtonProps = {
  text: string;
  onClick?: MouseEventHandler<HTMLButtonElement>; 
  className?: string; 
};

const Button: React.FC<ButtonProps> = ({ text, onClick, className }) => {
  const btnClass = className ? className : "primary-button";

  return (
    <button className={btnClass} onClick={onClick}>
      {text}
    </button>
  );
};

export default Button;
