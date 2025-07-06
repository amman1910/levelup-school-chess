import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // הוספת useTranslation
import LanguageSwitcher from '../../LanguageSwitcher'; // החלפת הכפתור בLanguageSwitcher
import './Navbar.css';
import logo from '../../../assets/logos/shahtranj_logo_gold.png';

const Navbar = () => {
  const { t, i18n } = useTranslation(); // הוספת i18n לקבלת השפה הנוכחית
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  console.log("🔧 Navbar component is running");

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY; // ✅ הזה הבטוח והמובטח
      console.log('🔥 window.scrollY =', scrollTop);
      setIsScrolled(scrollTop > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // פונקציה לטיפול בקישור JOIN US עם העברת השפה
  const handleJoinUsClick = (e) => {
    e.preventDefault();
    const currentLanguage = i18n.language;
    const joinUrl = `/join?lang=${currentLanguage}`;
    window.open(joinUrl, '_blank', 'noopener,noreferrer');
  };

  // פונקציה לטיפול בקישור Login עם העברת השפה
  const handleLoginClick = (e) => {
    e.preventDefault();
    const currentLanguage = i18n.language;
    const loginUrl = `/login?lang=${currentLanguage}`;
    window.open(loginUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}> 
      <div className="navbar-container">
        <div className="navbar-left">
          <a href="#top">
            <img src={logo} alt="Shah2Range Logo" className="navbar-logo" />
          </a>
        </div>

        <ul className="nav-links">
          <li><a href="#about">{t('navbar.about')}</a></li>
          <li><a href="#testimonials">{t('navbar.testimonials')}</a></li>
          <li><a href="#news">{t('navbar.programs')}</a></li>
          
          <li>
            <a
              href="/join"
              onClick={handleJoinUsClick}
              rel="noopener noreferrer"
            >
              {t('navbar.joinUs')}
            </a>
          </li>

          <li className="dropdown">
            <span className="dropdown-toggle">{t('navbar.more')} ▾</span>
            <ul className="dropdown-menu">
              <li><a href="#success-stories">{t('navbar.successStories')}</a></li>
              <li><a href="#gallery">{t('navbar.gallery')}</a></li>
              <li><a href="#news">{t('navbar.newsEvents')}</a></li>
            </ul>
          </li>
        </ul>

        <div className="navbar-right">
          <button 
            className="admin-access-btn" 
            onClick={handleLoginClick}
          >
            {t('navbar.trainerAdminLogin')}
          </button>

          {/* החלפת הכפתור הישן ב-LanguageSwitcher */}
          <LanguageSwitcher />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;