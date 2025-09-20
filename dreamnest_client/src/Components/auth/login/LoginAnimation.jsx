import React from "react";
import Lottie from "lottie-react";
import Animation from "../../../Assets/Animations/login.json";


const LoginAnimation = () => {
  return (
    <div className="Animation">
      <Lottie 
         animationData={Animation} 
         loop={true}
       />
    </div>
  );
};

export default LoginAnimation;
