import React from 'react';
import { useTranslation } from 'react-i18next';
import './AboutUsSection.css';
import teamPhoto from '../../../assets/aboutAs-photos/output.jpg';

/**
 * AboutUsSection Component
 * Displays information about the team/company with support for RTL/LTR languages
 * Features responsive design and internationalization
 */
const AboutUsSection = () => {
  const { t, i18n } = useTranslation();
  
  // Check if current language is Arabic for RTL layout
  const isRTL = i18n.language === 'ar';

  return (
    <section 
      id="about" 
      className={`about-section ${isRTL ? 'rtl' : 'ltr'}`}
    >
      {/* Header section with title and label */}
      <div className="about-header">
        <p className="about-section-label">{t('about.sectionLabel')}</p>
        <h2 className="about-title">{t('about.title')}</h2>
      </div>

      {/* Main content with image and text sections */}
      <div className="about-content-row">
        {/* Team photo section */}
        <div className="about-image-side">
          <img src={teamPhoto} alt="Shah2Range Team" />
        </div>

        {/* Text content with three main sections */}
        <div className="about-text-side">
          <div className="about-paragraph">
            <h3>{t('about.expertCoaches.title')}</h3>
            <p>
              {t('about.expertCoaches.description')}
            </p>
          </div>
          <div className="about-paragraph">
            <h3>{t('about.visionOfGrowth.title')}</h3>
            <p>
              {t('about.visionOfGrowth.description')}
            </p>
          </div>
          <div className="about-paragraph">
            <h3>{t('about.teamOfSolvers.title')}</h3>
            <p>
              {t('about.teamOfSolvers.description')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutUsSection;