import React from 'react';
import { useTranslation } from 'react-i18next'; // הוספת useTranslation
import './HeroSection.css';

import bishop from '../../../assets/hero-pieces/bishop.png';
import king from '../../../assets/hero-pieces/king.png';
import pawn from '../../../assets/hero-pieces/pawn.png';
import queen from '../../../assets/hero-pieces/queen.png';
import rock from '../../../assets/hero-pieces/rock.png';

const HeroSection = () => {
  const { t, i18n } = useTranslation(); // הוספת i18n לבדיקת השפה הנוכחית

  // בדיקת השפה הנוכחית
  const currentLanguage = i18n.language;
  const isArabic = currentLanguage === 'ar';

  // פונקציה לטיפול בקישור JOIN NOW
  const handleJoinClick = (e) => {
    e.preventDefault();
    const joinUrl = `/join?lang=${currentLanguage}`;
    window.open(joinUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="hero-section" id="top">
      
      <div className="group top-right">
        <img src={king} alt="king" className="piece king" />
        <img src={bishop} alt="bishop" className="piece bishop" />
      </div>

      <div className="group bottom-left">
        <img src={rock} alt="rock" className="piece rock" />
        <img src={queen} alt="queen" className="piece queen" />
        <img src={pawn} alt="pawn" className="piece pawn" />
      </div>

      <div className="hero-content">
        {/* שינוי סדר האלמנטים בהתאם לשפה */}
        <h1 className={isArabic ? 'rtl-text' : ''}>
          {isArabic ? (
            <>
              {t('hero.welcomeTo')} <span className="gold-text">{t('hero.shah2range')}</span>
            </>
          ) : (
            <>
              {t('hero.welcomeTo')} <span className="gold-text">{t('hero.shah2range')}</span>
            </>
          )}
        </h1>

        <p>
          {t('hero.description')}
        </p>
        <div className="hero-buttons">
          <a
            className="join-btn"
            href="/join"
            onClick={handleJoinClick}
            rel="noopener noreferrer"
          >
            {t('hero.joinNow')}
          </a>

          <a href="#why-shah2range" className="explore-btn">{t('hero.learnMore')}</a>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;