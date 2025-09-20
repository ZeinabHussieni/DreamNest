import React from "react";
import homeImg from "../../../Assets/Images/homeimage1.png";
import homeImg2 from "../../../Assets/Images/homeimage2.png";
import "./homeHeader.css";

const HomeHeader = () => {
  return (
    <>
   
      <section className="section section-text-left">
        <div className="text-container">
          <h1 className="title">Your goals are more than just dreams<br />They’re waiting to be unlocked</h1>
          <p className="description">
            Inside DreamNest, you’ll discover the path, the people, 
            and the power to make them real
          </p>
        </div>
        <div className="image-container image-right-gap">
          <img src={homeImg} alt="Welcome" />
        </div>
      </section>

   
      <section className="section section-text-right">
        <div className="image-container image-left-big">
          <img src={homeImg2} alt="Welcome" />
        </div>
        <div className="text-container text-fullwidth">
          <h1 className="title">Why DreamNest?</h1>
          <p className="description">
            Goals can be overwhelming, but your journey doesn’t have to be. 
            DreamNest guides you, connects you with the right people, 
            and turns progress into a rewarding experience.
          </p>
        </div>
      </section>
    </>
  );
};

export default HomeHeader;
