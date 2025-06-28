import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Navbar.css';
import { FaGlobe } from 'react-icons/fa';
import logo from '../../../assets/logos/shahtranj_logo_gold.png';

const Navbar = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  console.log("🔧 Navbar component is running");


useEffect(() => {
  const handleScroll = () => {
    const scrollTop = window.scrollY; // ✅ هذا الآمن والمضمون
    console.log('🔥 window.scrollY =', scrollTop);
    setIsScrolled(scrollTop > 10);
  };

  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, []);




  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}> {/* تفعيل كلاس عند السكروول */}
      <div className="navbar-container">
        <div className="navbar-left">
          <img src={logo} alt="Shah2Range Logo" className="navbar-logo" />
        </div>

    <ul className="nav-links">
      <li><a href="#about">About</a></li>
      <li><a href="#testimonials">Testimonials</a></li>
  <li><a href="#news">Programs</a></li>
  
  
  <li>
  <a
    href="/join"
    target="_blank"
    rel="noopener noreferrer"
  >
    Join Us
  </a>
</li>


  <li className="dropdown">
    <span className="dropdown-toggle">More ▾</span>
    <ul className="dropdown-menu">
      <li><a href="#success-stories">Success Stories</a></li>
      <li><a href="#gallery">Gallery</a></li>
      <li><a href="#news">News & Events</a></li>
    </ul>
  </li>
</ul>



        <div className="navbar-right">
          <button className="login-button" onClick={() => navigate('/login')}>Login</button>
          <button className="language-switch" title="Change Language">
            <FaGlobe />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;


