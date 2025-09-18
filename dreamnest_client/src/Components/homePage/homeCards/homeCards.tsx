import React from "react";
import FeaturesCard from "./HomeCard";
import calender from "../../../Assets/Images/calender.png";
import connection from "../../../Assets/Images/connection.png";
import dashboard from "../../../Assets/Images/dashboared.png";
import image from "../../../Assets/Icons/message.svg";
import steps from "../../../Assets/Images/steps.png";
import coinsreward from "../../../Assets/Icons/coinsreward.svg";

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
          title="Dream Connections & Chat"
          description="Find like-minded dreamers and stay connected through real-time chat, voice, and image sharing. Collaboration made simple"
        />
        <FeaturesCard
          image={connection}
          title="Community Hub"
          description="Share your journey with everyone—post updates, celebrate wins, and get inspired by others’ stories"
        />
        <FeaturesCard
          image={coinsreward}
          title="Coins Tracker"
          description="Earn 15 coins for every plan you complete. Miss a day without progress? 10 coins will be deducted. Stay consistent and keep your balance growing!"
        />
        <FeaturesCard
          image={dashboard}
          title="Progress Tracking"
          description="Track your milestones, complete tasks, and see your achievements grow"
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
