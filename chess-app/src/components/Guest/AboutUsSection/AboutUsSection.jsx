import React from 'react';
import { useTranslation } from 'react-i18next';
import './AboutUsSection.css';
import teamPhoto from '../../../assets/aboutAs-photos/output.jpg';

const AboutUsSection = () => {
  const { t, i18n } = useTranslation(); // הוספת i18n
  
  // בדיקה אם השפה הנוכחית היא ערבית
  const isRTL = i18n.language === 'ar';

  return (
    <section 
      id="about" 
      className={`about-section ${isRTL ? 'rtl' : 'ltr'}`}
    >
      {/* Header Row */}
      <div className="about-header">
        <p className="about-section-label">{t('about.sectionLabel')}</p>
        <h2 className="about-title">{t('about.title')}</h2>
      </div>

      {/* Content Row */}
      <div className="about-content-row">
        <div className="about-image-side">
          <img src={teamPhoto} alt="Shah2Range Team" />
        </div>

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