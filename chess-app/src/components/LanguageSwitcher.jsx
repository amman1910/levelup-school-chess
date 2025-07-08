import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css';

const LanguageSwitcher = ({ className = '' }) => {
  const { i18n, t } = useTranslation();

  const changeLanguage = (language) => {
    i18n.changeLanguage(language);
    
    // Update document direction and language
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    
    // Save to localStorage
    localStorage.setItem('language', language);
  };

  // Set initial direction and language on component mount
  useEffect(() => {
    const currentLang = i18n.language;
    document.documentElement.lang = currentLang;
    document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  return (
    <div className={`language-dropdown ${className}`}>
      <button className="language-button">
  <FaGlobe style={{ color: 'white', marginRight: 6 }} />
  {i18n.language.toUpperCase()}
</button>
    <ul className="language-menu"      >
        <li onClick={() => changeLanguage('en')}>English</li>
        <li onClick={() => changeLanguage('ar')}>العربية</li>
      </ul>
    </div>
  );
};

export default LanguageSwitcher;