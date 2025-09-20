import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import Logo from "../../../Assets/Images/Final logo.png";
import drop from "../../../Assets/Icons/dropdown.svg";
import coinIcon from "../../../Assets/Icons/coins.svg";
import menu from "../../../Assets/Icons/menu.svg";
import ThemeToggle from "../../themeToggle/ThemeToggle";
import { useAuth } from "../../../Context/AuthContext";
import useDropdown from "../../../Hooks/navBar/useDropdown";
import useUserData from "../../../Hooks/navBar/useUserData";
import NotificationBell from "../../notifications/NotificationBell";
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

  const closeMobile = () => setIsMobileMenuOpen(false);

  return (
    <nav className="Navbar">
      <div className="Navbar-logo">
        <a href="/"><img src={Logo} alt="Logo" className="logo-size" /></a>
        <div className="title">
          <h2 className="dreamNest">
            <NavLink to="/" className="dreamNest-link">DreamNest</NavLink>
          </h2>
        </div>
      </div>

      {isAuthenticated && (
        <>
          {/* Desktop links */}
          <div className="navbar-links desktop-links">
            <NavLink to="/userGoals" className="btn nav-btn">Your Goals</NavLink>

            <div className="dropdown-managment">
              <button className="btn nav-btn community-btn" type="button">
                Community <img src={drop} alt="drop" className="drop-icon" />
              </button>
              <div className="dropdown-content styled-dropdown">
                <NavLink to="/posts">Posts</NavLink>
                <NavLink to="/myposts">My Posts</NavLink>
              </div>
            </div>

            <div className="dropdown-managment">
              <button className="btn nav-btn community-btn" type="button">
                Connections <img src={drop} alt="drop" className="drop-icon" />
              </button>
              <div className="dropdown-content styled-dropdown">
                <NavLink to="/chats">Chats</NavLink>
                <NavLink to="/connections">Requests</NavLink>
              </div>
            </div>

            <NavLink to="/dashboard" className="btn nav-btn">My Dashboard</NavLink>
          </div>

          {/* Mobile menu button */}
          <button
            className="mobile-menu-btn"
            type="button"
            onClick={() => setIsMobileMenuOpen(v => !v)}
          >
            <img src={menu} alt="Coin" className="coin-icon" />
          </button>

          {/* Mobile menu */}
          {isMobileMenuOpen && (
            <div id="mobile-menu" className="mobile-menu">
              <NavLink to="/userGoals" onClick={closeMobile}>Your Goals</NavLink>

              <div className="mobile-submenu">
                <span>Community ▾</span>
                <div className="submenu-links">
                  <NavLink to="/posts" onClick={closeMobile}>Posts</NavLink>
                  <NavLink to="/myposts" onClick={closeMobile}>My Posts</NavLink>
                </div>
              </div>

              <div className="mobile-submenu">
                <span>Connections ▾</span>
                <div className="submenu-links">
                  <NavLink to="/chats" onClick={closeMobile}>Chats</NavLink>
                  <NavLink to="/connections" onClick={closeMobile}>Friend Requests</NavLink>
                </div>
              </div>

              <NavLink to="/dashboard" onClick={closeMobile}>Dashboard</NavLink>
            </div>
          )}
        </>
      )}

      <div className="left">
        <ThemeToggle />
        {!isAuthenticated ? (
          <>
            <NavLink to="/login" className="btn nav-btn login-btn">Login</NavLink>
            <NavLink to="/register" className="btn nav-btn register-btn">Register</NavLink>
          </>
        ) : (
          <>
            <NotificationBell />

            <div className="coin-badge">
              <img src={coinIcon} alt="Coin" className="coin-icon" />
              <span className="coin-text">{coins}</span>
            </div>

            <div
              className="Navbar-profile"
              ref={dropdownRef}
              onClick={toggleProfileDropdown}
              role="button"
              tabIndex={0}
            >
              <img src={profilePicUrl || "/default-profile.png"} alt="Profile" className="pro-pic" />
              {profileDropdownOpen && (
                <ul className="dropdown">
                  <li>
                    <button type="button" onClick={handleLogout} className="dropdown-btn">
                      Logout
                    </button>
                  </li>
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
