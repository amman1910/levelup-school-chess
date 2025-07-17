import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../LanguageSwitcher';
import './Navbar.css';
import logo from '../../../assets/logos/shahtranj_logo_gold.png';

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  console.log("🔧 Navbar component is running");

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      console.log('🔥 window.scrollY =', scrollTop);
      setIsScrolled(scrollTop > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // פונקציה לפתיחה/סגירה של תפריט מובייל
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // פונקציה לסגירת התפריט כשלוחצים על קישור
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // פונקציה לטיפול בקישור JOIN US עם העברת השפה
  const handleJoinUsClick = (e) => {
    e.preventDefault();
    const currentLanguage = i18n.language;
    const joinUrl = `/join?lang=${currentLanguage}`;
    window.open(joinUrl, '_blank', 'noopener,noreferrer');
    closeMobileMenu(); // סגור תפריט מובייל
  };

  // פונקציה לטיפול בקישור Login עם העברת השפה
  const handleLoginClick = (e) => {
    e.preventDefault();
    const currentLanguage = i18n.language;
    const loginUrl = `/login?lang=${currentLanguage}`;
    window.open(loginUrl, '_blank', 'noopener,noreferrer');
    closeMobileMenu(); // סגור תפריט מובייל
  };

  // פונקציה לטיפול בקישורי ניווט רגילים במובייל
  const handleMobileNavClick = (e, href) => {
    closeMobileMenu();
    // אם זה anchor link, תן לדפדפן לטפל בזה
    if (href.startsWith('#')) {
      return;
    }
    e.preventDefault();
    navigate(href);
  };

  return (
    <>
      <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}> 
        <div className="navbar-container">
          <div className="navbar-left">
            <a href="#top">
              <img src={logo} alt="Shah2Range Logo" className="navbar-logo" />
            </a>
          </div>

          {/* תפריט רגיל - בדיוק כמו קודם */}
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
            {/* דסקטופ - כפתורים רגילים */}
            <button 
              className="admin-access-btn desktop-only" 
              onClick={handleLoginClick}
            >
              {t('navbar.trainerAdminLogin')}
            </button>

            <div className="desktop-only">
              <LanguageSwitcher />
            </div>

            {/* מובייל - רק כפתור המבורגר */}
            <button 
              className="mobile-menu-btn mobile-only"
              onClick={toggleMobileMenu}
              aria-label="תפריט ניווט"
            >
              <div className={`hamburger ${isMobileMenuOpen ? 'active' : ''}`}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </button>
          </div>
        </div>

        {/* תפריט מובייל */}
        <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
          <ul className="mobile-nav-links">
            <li>
              <a 
                href="#about" 
                onClick={(e) => handleMobileNavClick(e, '#about')}
              >
                {t('navbar.about')}
              </a>
            </li>
            <li>
              <a 
                href="#testimonials" 
                onClick={(e) => handleMobileNavClick(e, '#testimonials')}
              >
                {t('navbar.testimonials')}
              </a>
            </li>
            <li>
              <a 
                href="#news" 
                onClick={(e) => handleMobileNavClick(e, '#news')}
              >
                {t('navbar.programs')}
              </a>
            </li>
            <li>
              <a
                href="/join"
                onClick={handleJoinUsClick}
                rel="noopener noreferrer"
              >
                {t('navbar.joinUs')}
              </a>
            </li>
            
            {/* תת-תפריט "עוד" */}
            <li className="mobile-submenu">
              <div className="mobile-submenu-title">{t('navbar.more')}</div>
              <ul className="mobile-submenu-items">
                <li>
                  <a 
                    href="#success-stories" 
                    onClick={(e) => handleMobileNavClick(e, '#success-stories')}
                  >
                    {t('navbar.successStories')}
                  </a>
                </li>
                <li>
                  <a 
                    href="#gallery" 
                    onClick={(e) => handleMobileNavClick(e, '#gallery')}
                  >
                    {t('navbar.gallery')}
                  </a>
                </li>
                <li>
                  <a 
                    href="#news" 
                    onClick={(e) => handleMobileNavClick(e, '#news')}
                  >
                    {t('navbar.newsEvents')}
                  </a>
                </li>
              </ul>
            </li>

            {/* פרידה */}
            <li className="mobile-separator"></li>

            {/* כפתור כניסת מנהל במובייל */}
            <li>
              <button 
                className="mobile-admin-btn" 
                onClick={handleLoginClick}
              >
                {t('navbar.trainerAdminLogin')}
              </button>
            </li>

            {/* החלפת שפה במובייל */}
            <li className="mobile-language">
              <div className="mobile-language-wrapper">
                <LanguageSwitcher />
              </div>
            </li>
          </ul>
        </div>
      </nav>

      {/* Overlay לסגירת התפריט */}
      {isMobileMenuOpen && (
        <div 
          className="mobile-menu-overlay" 
          onClick={closeMobileMenu}
        ></div>
      )}
    </>
  );
};

export default Navbar;