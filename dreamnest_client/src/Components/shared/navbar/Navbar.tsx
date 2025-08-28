import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom"; 
import Logo from "../../../Assets/Images/Final logo.png";
import Notification from "../../../Assets/Icons/notification.svg";
import coinIcon from "../../../Assets/Icons/coins.svg";
import ThemeToggle from "../../themeToggle/ThemeToggle"; 
import { useAuth } from "../../../Context/AuthContext";
import useDropdown from "../../../Hooks/navBar/useDropdown.js"; 
import useUserData from "../../../Hooks/navBar/useUserData";
import "./navbar.css";

const Navbar: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const { isOpen: profileDropdownOpen, toggleDropdown: toggleProfileDropdown, dropdownRef } = useDropdown();
  const { coins, profilePicUrl } = useUserData(isAuthenticated);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="Navbar">
      <div className="Navbar-logo">
        <img src={Logo} alt="Logo" className="logo-size" />
        <div className="title">
          <h2 className="dreamNest">
            <Link to="/homePage" className="dreamNest-link">DreamNest</Link>
          </h2>
        </div>
      </div>
      
      {isAuthenticated && (
        <>
          <div className="navbar-links desktop-links">
            <a href="/goals" className="btn nav-btn">Your Goals</a>
            <div className="dropdown-managment">
              <button className="btn nav-btn">Community</button>
              <div className="dropdown-content styled-dropdown">
                <a href="/posts">Posts</a>
                <a href="/myposts">My Posts</a>
              </div>
            </div>
            <a href="/chats" className="btn nav-btn">Chats</a>
            <a href="/dashboard" className="btn nav-btn">My Dashboard</a>
          </div>

          <div className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            ☰
          </div>

          {isMobileMenuOpen && (
            <div className="mobile-menu">
              <a href="/goals">Your Goals</a>
              <div className="mobile-submenu">
                <span>Community ▾</span>
                <div className="submenu-links">
                  <a href="/posts">Posts</a>
                  <a href="/myposts">My Posts</a>
                </div>
              </div>
              <a href="/chats">Chats</a>
              <a href="/dashboard">My Dashboard</a>
            </div>
          )}
        </>
      )}

      <div className="left">
        <ThemeToggle />
        {!isAuthenticated ? (
          <>
            <a href="/login" className="btn nav-btn login-btn">Login</a>
            <a href="/register" className="btn nav-btn register-btn">Register</a>
          </>
        ) : (
          <>
            <a className="icon-btn">
              <img src={Notification} alt="Notifications" />
            </a>
            <div className="coin-badge">
              <img src={coinIcon} alt="Coin" className="coin-icon" />
              <span className="coin-text">{coins}</span>
            </div>
            <div className="Navbar-profile" ref={dropdownRef} onClick={toggleProfileDropdown}>
              <img src={profilePicUrl || "/default-profile.png"} alt="Profile" className="pro-pic" />
              {profileDropdownOpen && (
                <ul className="dropdown">
                  <li><a onClick={handleLogout}>Logout</a></li>
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
