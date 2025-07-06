import React from 'react';
import { useTranslation } from 'react-i18next'; // הוספת useTranslation
import './WhyShah2Range.css';
import { FaAward, FaChalkboardTeacher, FaUsers } from 'react-icons/fa';

const WhyShah2Range = () => {
  const { t } = useTranslation(); // הוספת hook לתרגום

  return (
    <section className="why-cards-section" id="why-shah2range">
      <div className="why-cards-container">
        <div className="why-card dark">
          <FaAward className="why-icon" />
          <h3>{t('whyShah2Range.items.fideCoaches.title')}</h3>
          <p>{t('whyShah2Range.items.fideCoaches.description')}</p>
        </div>

        <div className="why-card light">
          <FaChalkboardTeacher className="why-icon" />
          <h3>{t('whyShah2Range.items.visionGrowth.title')}</h3>
          <p>{t('whyShah2Range.items.visionGrowth.description')}</p>
        </div>

        <div className="why-card dark">
          <FaUsers className="why-icon" />
          <h3>{t('whyShah2Range.items.beginnerToAdvanced.title')}</h3>
          <p>{t('whyShah2Range.items.beginnerToAdvanced.description')}</p>
        </div>
      </div>
    </section>
  );
};

export default WhyShah2Range;