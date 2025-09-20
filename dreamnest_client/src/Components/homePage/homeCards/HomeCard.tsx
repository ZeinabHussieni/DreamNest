import React from "react";
import "./homeCards.css";

interface FeaturesCardProps {
  image: string;
  title: string;
  description: string;
}

const FeaturesCard: React.FC<FeaturesCardProps> = ({ image, title, description }) => {
  return (
    <div className="feature-card">
      <img src={image} alt={title} className="feature-image" />
      <h3 className="feature-title">{title}</h3>
      <p className="feature-description">{description}</p>
    </div>
  );
};

export default FeaturesCard;
