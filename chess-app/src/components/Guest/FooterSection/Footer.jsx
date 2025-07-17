import React from 'react';
import { useTranslation } from 'react-i18next';
import './Footer.css';
import { FaPhone, FaFacebookF, FaInstagram, FaYoutube, FaWhatsapp } from 'react-icons/fa';
import shahtranjLogo from '../../../assets/logos/shahtranj_logo_gold.png';

/**
 * Footer Component
 * Main footer section containing company information, contact details, 
 * social media links, and registration call-to-action
 * Features internationalization support
 */
const Footer = () => {
  const { t, i18n } = useTranslation();

  /**
   * Handle register button click - opens registration page in new tab
   * @param {Event} e - Click event
   */
  const handleRegisterClick = (e) => {
    e.preventDefault();
    const currentLanguage = i18n.language;
    const joinUrl = `/join?lang=${currentLanguage}`;
    window.open(joinUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <footer className="custom-footer">
      <div className="footer-container">
        {/* About section with logo and contact info */}
        <div className="footer-column about">
          <div className="logo-box">
            <a href="#top">
              <img
                src={shahtranjLogo}
                alt="Shah2Range Logo"
                className="footer-logo"
                style={{ cursor: 'pointer' }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </a>
            <h2 className="logo-text">SHAH2RANGE</h2>
          </div>

          <ul className="contact-info">
            <li>
              {t('footer.email')}: <a href="mailto:contact@shah2range.com">contact@shah2range.com</a>
            </li>
            <li>
              <a href="tel:0587130219">📞 058-713-0219</a>
            </li>
            <li>{t('footer.location')}</li>
          </ul>
        </div>

        {/* Quick navigation links */}
        <div className="footer-column">
          <h4>{t('footer.quickLinks')}</h4>
          <ul>
            <li><a href="#top">{t('footer.links.home')}</a></li>
            <li><a href="#about">{t('footer.links.about')}</a></li>
            <li><a href="#programs">{t('footer.links.programs')}</a></li>
            <li><a href="#gallery">{t('footer.links.gallery')}</a></li>
          </ul>
        </div>

        {/* Social media links */}
        <div className="footer-column">
          <h4>{t('footer.followUs')}</h4>
          <div className="social-icons">
            <a href="https://wa.me/972587130219" target="_blank" rel="noopener noreferrer"><FaWhatsapp /></a>
            <a href="https://www.facebook.com/Shah2Range/" target="_blank" rel="noopener noreferrer"><FaFacebookF /></a>
            <a href="https://www.instagram.com/shah2range/" target="_blank" rel="noopener noreferrer"><FaInstagram /></a>
            <a href="https://www.youtube.com/channel/UCNywSWs67G8ML-8goaYUy0A/about" target="_blank" rel="noopener noreferrer"><FaYoutube /></a>
          </div>
        </div>

        {/* Registration call-to-action */}
        <div className="footer-column">
          <h4>{t('footer.joinProgram.title')}</h4>
          <p>{t('footer.joinProgram.description')}</p>
          <p>{t('footer.joinProgram.instructions')}</p>
          <a
            href="/join"
            onClick={handleRegisterClick}
            rel="noopener noreferrer"
            className="footer-btn"
          >
            {t('footer.joinProgram.registerBtn')} →
          </a>
        </div>
      </div>

      {/* Copyright section */}
      <div className="footer-bottom">
        <p>{t('footer.copyright')}</p>
      </div>
    </footer>
  );
};

export default Footer;