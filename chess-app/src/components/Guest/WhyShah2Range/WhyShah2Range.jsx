import React from 'react';
import { useTranslation } from 'react-i18next';
import './WhyShah2Range.css';
import { FaAward, FaChalkboardTeacher, FaUsers } from 'react-icons/fa';

/**
 * WhyShah2Range Component
 * Displays three feature cards highlighting the key benefits and features
 * Features RTL text handling for Arabic content and responsive design
 */
const WhyShah2Range = () => {
  const { t, i18n } = useTranslation();
  
  // Check if current language is Arabic for RTL layout
  const isRTL = i18n.language === 'ar';

  /**
   * Fix Arabic text mixed with HTML entities for proper RTL display
   * @param {string} text - Text to fix
   * @returns {string} Fixed text with proper RTL markers
   */
  const fixArabicTextWithHTML = (text) => {
    if (!isRTL) return text;
    
    return text
      .replace(/(\([A-Z]+\))/g, '&rlm;$1&rlm;') // RLM HTML entities for parentheses
      .replace(/([A-Z]{2,})/g, '&rlm;$1&rlm;'); // Fix for English words like FIDE
  };

  return (
    <section className={`why-cards-section ${isRTL ? 'rtl' : 'ltr'}`} id="why-shah2range">
      <div className="why-cards-container">
        {/* FIDE Coaches card */}
        <div className="why-card dark">
          <FaAward className="why-icon" />
          <h3>{t('whyShah2Range.items.fideCoaches.title')}</h3>
          <p 
            dir={isRTL ? 'rtl' : 'ltr'} 
            style={{textAlign: 'center', direction: isRTL ? 'rtl' : 'ltr'}}
            dangerouslySetInnerHTML={{
              __html: fixArabicTextWithHTML(t('whyShah2Range.items.fideCoaches.description'))
            }}
          />
        </div>

        {/* Vision & Growth card */}
        <div className="why-card light">
          <FaChalkboardTeacher className="why-icon" />
          <h3>{t('whyShah2Range.items.visionGrowth.title')}</h3>
          <p 
            dir={isRTL ? 'rtl' : 'ltr'} 
            style={{textAlign: 'center', direction: isRTL ? 'rtl' : 'ltr'}}
            dangerouslySetInnerHTML={{
              __html: fixArabicTextWithHTML(t('whyShah2Range.items.visionGrowth.description'))
            }}
          />
        </div>

        {/* Beginner to Advanced card */}
        <div className="why-card dark">
          <FaUsers className="why-icon" />
          <h3>{t('whyShah2Range.items.beginnerToAdvanced.title')}</h3>
          <p 
            dir={isRTL ? 'rtl' : 'ltr'} 
            style={{textAlign: 'center', direction: isRTL ? 'rtl' : 'ltr'}}
            dangerouslySetInnerHTML={{
              __html: fixArabicTextWithHTML(t('whyShah2Range.items.beginnerToAdvanced.description'))
            }}
          />
        </div>
      </div>
    </section>
  );
};

export default WhyShah2Range;