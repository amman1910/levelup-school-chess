import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Navbar.css';
import { FaGlobe } from 'react-icons/fa';


import logo from '../../../assets/logos/shahtranj_logo_gold.png';

const Navbar = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">

        
        <div className="navbar-left">
          <img src={logo} alt="Shah2Range Logo" className="navbar-logo" />
        </div>

        
        <ul className="nav-links">
          <li><a href="#about">About</a></li>
          <li><a href="#gallery">Gallery</a></li>
          <li><a href="#join">Join Us</a></li>
        </ul>

        
        <div className="navbar-right">
          <button className="login-button" onClick={() => navigate('/login')}>
            Login
          </button>
          <button className="language-switch" title="Change Language">
  <FaGlobe />
</button>

        </div>

      </div>
    </nav>
  );
};

export default Navbar;

