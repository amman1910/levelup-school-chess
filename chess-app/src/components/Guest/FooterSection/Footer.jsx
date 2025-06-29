import React from 'react';
import './Footer.css';
import { FaPhone, FaFacebookF, FaInstagram, FaYoutube, FaWhatsapp } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="custom-footer">
      <div className="footer-container">
        <div className="footer-column about">
  <div className="logo-box">
    <img
      src="/src/assets/logos/shahtranj_logo_gold.png"
      alt="Shah2Range Logo"
      className="footer-logo"
    />
    <h2 className="logo-text">SHAH2RANGE</h2>
  </div>

  <ul className="contact-info">
    <li><FaPhone /> 058-713-0219</li>
    <li>Email: contact@shah2range.com</li>
    <li>Jerusalem</li>
  </ul>
</div>



        <div className="footer-column">
          <h4>Quick Links</h4>
          <ul>
<li>            <a href="#top">Home</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#programs">Programs</a></li>
            <li><a href="#gallery">Gallery</a></li>
          </ul>
        </div>

        <div className="footer-column">
          <h4>Follow Us</h4>
          <div className="social-icons">
  <a href="https://wa.me/972587130219" target="_blank" rel="noopener noreferrer"><FaWhatsapp /></a>
  <a href="https://www.facebook.com/Shah2Range/" target="_blank" rel="noopener noreferrer"><FaFacebookF /></a>
  <a href="https://www.instagram.com/shah2range/" target="_blank" rel="noopener noreferrer"><FaInstagram /></a>
  <a href="https://www.youtube.com/channel/UCNywSWs67G8ML-8goaYUy0A/about" target="_blank" rel="noopener noreferrer"><FaYoutube /></a>
</div>

        </div>

        <div className="footer-column">
  <h4>Join a Program</h4>
  <p>Want to join a course, tournament, or school program?</p>
  <p>Fill out our registration form and we’ll get back to you soon.</p>
 <a
  href="/join"
  target="_blank"
  rel="noopener noreferrer"
  className="footer-btn"
>
  Register Now →
</a>

</div>

      </div>
      <div className="footer-bottom">
        <p>© 2025 Shah2Range. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;

