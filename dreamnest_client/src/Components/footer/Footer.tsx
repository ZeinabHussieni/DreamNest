import React from "react";
import { FaFacebookF, FaInstagram } from "react-icons/fa";
import { SiTiktok } from "react-icons/si";
import logo from "../../Assets/Images/Final logo.png";
import "./footer.css";

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        
        <div className="footer-left">
          <div className="footer-logo">
            <img src={logo} alt="DreamNest Logo" className="footer-logo-img" />
            <h2>DreamNest</h2>
          </div>
          <p className="footer-desc">
            DreamNest is a platform that turns your goals into clear steps,
            connects you with people who can support you, and keeps you
            motivated with smart reminders and progress tracking.
          </p>
          <div className="footer-socials">
            <a href="#"><FaFacebookF /></a>
            <a href="#"><FaInstagram /></a>
            <a href="#"><SiTiktok /></a>
          </div>
        </div>
\
        <div className="footer-middle">
          <h3>Other Pages</h3>
          <ul>
            <li><a href="#">Home</a></li>
            <li><a href="#">Services</a></li>
            <li><a href="#">About Us</a></li>
            <li><a href="#">Contact</a></li>
          </ul>
        </div>

  
        <div className="footer-right">
          <h3>Contact Us</h3>
          <p>(+961) 76 188 420</p>
          <p><a href="mailto:dreamnest@gmail.com">dreamnest@gmail.com</a></p>
          <p>Beirut, Lebanon</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
