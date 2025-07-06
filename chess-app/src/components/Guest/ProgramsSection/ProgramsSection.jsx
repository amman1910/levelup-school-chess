import React from 'react';
import { useTranslation } from 'react-i18next'; // הוספת useTranslation
import './ProgramsSection.css';

import trainingImg from '../../../assets/program-section/in-school-training.jpg';
import eveningImg from '../../../assets/program-section/evening-courses.jpg';
import tournamentsImg from '../../../assets/program-section/chess-tournaments.jpg';
import communityImg from '../../../assets/program-section/community-hub.jpg';

const ProgramsSection = () => {
  const { t } = useTranslation(); // הוספת hook לתרגום

  // העברת ה-programs array לתוך הקומפוננטה כדי שיהיה גישה ל-t()
  const programs = [
    {
      title: t('programs.items.inSchool.title'),
      desc: t('programs.items.inSchool.description'),
      img: trainingImg,
      badge: t('programs.items.inSchool.badge'),
    },
    {
      title: t('programs.items.evening.title'),
      desc: t('programs.items.evening.description'),
      img: eveningImg,
      badge: t('programs.items.evening.badge'),
    },
    {
      title: t('programs.items.tournaments.title'),
      desc: t('programs.items.tournaments.description'),
      img: tournamentsImg,
      badge: t('programs.items.tournaments.badge'),
    },
    {
      title: t('programs.items.community.title'),
      desc: t('programs.items.community.description'),
      img: communityImg,
      badge: t('programs.items.community.badge'),
    },
  ];

  return (
    <section id="programs" className="programs-section">
      <div className="programs-header">
        <p className="programs-label">{t('programs.sectionLabel')}</p>
        <h2 className="programs-title">
          {t('programs.titleLine1')}<br />{t('programs.titleLine2')}
        </h2>
      </div>
      <div className="programs-grid">
        {programs.map((program, index) => (
          <div className="program-card" key={index}>
            <div className="program-card-img-wrapper">
              <span className="program-badge">{program.badge}</span>
              <img src={program.img} alt={program.title} />
            </div>
            <div className="program-card-text">
              <h3>{program.title}</h3>
              <p>{program.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ProgramsSection;