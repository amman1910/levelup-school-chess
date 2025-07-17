import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaGlobe } from 'react-icons/fa';

import './LanguageSwitcher.css';

const LanguageSwitcher = ({ className = '' }) => {
  const { i18n, t } = useTranslation();

  const toggleLanguage = () => {
    // Toggle between English and Arabic
    const newLanguage = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLanguage);

    // Update HTML document direction and language attribute
    document.documentElement.lang = newLanguage;
    document.documentElement.dir = newLanguage === 'ar' ? 'rtl' : 'ltr';

    // Store selected language in localStorage
    localStorage.setItem('language', newLanguage);
  };

  useEffect(() => {
    // Apply correct direction and language attributes when the component mounts
    const currentLang = i18n.language;
    document.documentElement.lang = currentLang;
    document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  const getLanguageDisplay = () => {
    // Return the label for the currently selected language
    return i18n.language === 'en' ? 'EN | English' : 'AR | العربية';
  };

  return (
    <div className={`language-switcher ${className}`}>
      <button className="language-button" onClick={toggleLanguage}>
        <FaGlobe style={{ color: 'white', marginRight: 6 }} />
        {getLanguageDisplay()}
      </button>
    </div>
  );
};

export default LanguageSwitcher;
