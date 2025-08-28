import React from "react";
import homeImg from "../../../Assets/Images/homeimage1.png";
import homeImg2 from "../../../Assets/Images/homeimage2.png";
import "./homeHeader.css";

const HomeHeader = () => {
  return (
    <>
    <section className="welcome-section">
      <div className="left-section">
        <h1 className="welcome-title">
          Your goals are more than just dreams<br />
          They’re waiting to be unlocked
        </h1>

        <p className="welcome-description">
          Inside DreamNest, you’ll discover the path, the people, 
          and the power to make them real
        </p>
      </div>

      <div className="right-section ">
        <img src={homeImg} alt="Welcome" />
      </div>

    </section>
     <section className="welcome-section">
      <div className="left-section">
        <img src={homeImg2} alt="Welcome" />
      </div>

      

      <div className="right-section2">
         <h1 className="welcome-title2">
          Why DreamNest?
        </h1>

        <p className="welcome-description2">
          Goals can be overwhelming, but your journey doesn’t have to be
          DreamNest guides you, connects you with the right people, and turns progress into a rewarding experience.
        </p>
        
      </div>
    </section>
    </>
  );
  
};

export default HomeHeader;
