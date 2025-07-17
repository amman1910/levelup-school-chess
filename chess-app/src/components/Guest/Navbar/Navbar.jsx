import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../LanguageSwitcher';
import './Navbar.css';
import logo from '../../../assets/logos/shahtranj_logo_gold.png';

/**
 * Navbar Component
 * Responsive navigation bar with mobile hamburger menu, language switching,
 * and scroll-based background changes. Supports both desktop and mobile layouts.
 */
const Navbar = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  /**
   * Handle scroll events to change navbar background
   */
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /**
   * Toggle mobile menu visibility
   */
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  /**
   * Close mobile menu
   */
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  /**
   * Handle join us link click with language parameter
   * @param {Event} e - Click event
   */
  const handleJoinUsClick = (e) => {
    e.preventDefault();
    const currentLanguage = i18n.language;
    const joinUrl = `/join?lang=${currentLanguage}`;
    window.open(joinUrl, '_blank', 'noopener,noreferrer');
    closeMobileMenu();
  };

  /**
   * Handle login link click with language parameter
   * @param {Event} e - Click event
   */
  const handleLoginClick = (e) => {
    e.preventDefault();
    const currentLanguage = i18n.language;
    const loginUrl = `/login?lang=${currentLanguage}`;
    window.open(loginUrl, '_blank', 'noopener,noreferrer');
    closeMobileMenu();
  };

  /**
   * Handle mobile navigation link clicks
   * @param {Event} e - Click event
   * @param {string} href - Target URL/anchor
   */
  const handleMobileNavClick = (e, href) => {
    closeMobileMenu();
    // Let browser handle anchor links
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
          {/* Logo section */}
          <div className="navbar-left">
            <a href="#top">
              <img src={logo} alt="Shah2Range Logo" className="navbar-logo" />
            </a>
          </div>

          {/* Desktop navigation menu */}
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

            {/* Dropdown menu for additional links */}
            <li className="dropdown">
              <span className="dropdown-toggle">{t('navbar.more')} ▾</span>
              <ul className="dropdown-menu">
                <li><a href="#success-stories">{t('navbar.successStories')}</a></li>
                <li><a href="#gallery">{t('navbar.gallery')}</a></li>
                <li><a href="#news">{t('navbar.newsEvents')}</a></li>
              </ul>
            </li>
          </ul>

          {/* Right side controls */}
          <div className="navbar-right">
            {/* Desktop login button */}
            <button 
              className="admin-access-btn desktop-only" 
              onClick={handleLoginClick}
            >
              {t('navbar.trainerAdminLogin')}
            </button>

            {/* Desktop language switcher */}
            <div className="desktop-only">
              <LanguageSwitcher />
            </div>

            {/* Mobile hamburger menu button */}
            <button 
              className="mobile-menu-btn mobile-only"
              onClick={toggleMobileMenu}
              aria-label="Navigation menu"
            >
              <div className={`hamburger ${isMobileMenuOpen ? 'active' : ''}`}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile navigation menu */}
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
            
            {/* Mobile submenu for additional links */}
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

            {/* Separator line */}
            <li className="mobile-separator"></li>

            {/* Mobile admin login button */}
            <li>
              <button 
                className="mobile-admin-btn" 
                onClick={handleLoginClick}
              >
                {t('navbar.trainerAdminLogin')}
              </button>
            </li>

            {/* Mobile language switcher */}
            <li className="mobile-language">
              <div className="mobile-language-wrapper">
                <LanguageSwitcher />
              </div>
            </li>
          </ul>
        </div>
      </nav>

      {/* Overlay for closing mobile menu */}
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