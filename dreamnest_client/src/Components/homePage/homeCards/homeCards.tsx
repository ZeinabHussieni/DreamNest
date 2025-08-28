import React from "react";
import FeaturesCard from "./HomeCard";
import calender from "../../../Assets/Images/calender.png";
import connection from "../../../Assets/Images/connection.png";
import dashboard from "../../../Assets/Images/dashboared.png";
import image from "../../../Assets/Images/image.png";
import steps from "../../../Assets/Images/steps.png";

import "./homeCards.css";

const HomeCards: React.FC = () => {
  return (
    <div className="features-container">
      <h2 className="section-title">What We Offer?</h2>
      <div className="features-section">
        <FeaturesCard
          image={calender}
          title="Goal Planning"
          description="AI generates step-by-step plans to help you reach your goals efficiently"
        />
        <FeaturesCard
          image={image}
          title="Visual Motivation"
          description="Personalized motivational visuals keep your goals alive and inspiring"
        />
        <FeaturesCard
          image={connection}
          title="Dream Connections"
          description="Connect with others who share similar goals or can help you succeed"
        />
        <FeaturesCard
          image={dashboard}
          title="Progress Tracking"
          description="Track your milestones, complete tasks, and see your achievements grow."
        />
      </div>

      <h2 className="section-title">How DreamNest Works</h2>
      <div className="image-steps">
        <img src={steps} alt="steps" />
      </div>
    </div>
  );
};

export default HomeCards;
