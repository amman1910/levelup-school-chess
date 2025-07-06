import React from 'react';
import { useTranslation } from 'react-i18next'; // הוספת useTranslation
import './TestimonialsSection.css';

import hadeelImg from '../../../assets/Hall-of-fame/hall_hadeel.png';
import motazImg from '../../../assets/Hall-of-fame/hall_motaz.png';
import emanImg from '../../../assets/Hall-of-fame/hall_eman.png';

import bgImage from '../../../assets/Hall-of-fame/photo.jpg'; 
import jameelImg from '../../../assets/success-stories/success_jameel.jpg';
import hossamImg from '../../../assets/success-stories/success_hossam.jpg';
import noamanImg from '../../../assets/success-stories/success_noaman.png';

const TestimonialsSection = () => {
  const { t } = useTranslation(); // הוספת hook לתרגום

  const testimonials = [
    {
      name: t('testimonials.items.hadeel.name'),
      title: t('testimonials.items.hadeel.title'),
      quote: t('testimonials.items.hadeel.quote'),
      img: hadeelImg,
    },
    {
      name: t('testimonials.items.motaz.name'),
      title: t('testimonials.items.motaz.title'),
      quote: t('testimonials.items.motaz.quote'),
      img: motazImg,
    },
    {
      name: t('testimonials.items.eman.name'),
      title: t('testimonials.items.eman.title'),
      quote: t('testimonials.items.eman.quote'),
      img: emanImg,
    },
  ];

  const stories = [
    {
      name: t('successStories.items.jameel.name'),
      title: t('successStories.items.jameel.title'),
      quote: t('successStories.items.jameel.quote'),
      img: jameelImg,
    },
    {
      name: t('successStories.items.hossam.name'),
      title: t('successStories.items.hossam.title'),
      quote: t('successStories.items.hossam.quote'),
      img: hossamImg,
    },
    {
      name: t('successStories.items.noaman.name'),
      title: t('successStories.items.noaman.title'),
      quote: t('successStories.items.noaman.quote'),
      img: noamanImg,
    },
  ];

  return (
    <section id="testimonials"
      className="testimonials-section"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="testimonials-overlay" />
      <div className="testimonials-content">
        <div className="testimonials-header">
          <p className="testimonials-title">{t('testimonials.sectionLabel')}</p>
          <h2 className="testimonials-subtitle">
            {t('testimonials.titleLine1')}<br />{t('testimonials.titleLine2')}
          </h2>
        </div>

        <div className="testimonials-container">
          {testimonials.map((item, index) => (
            <div className="testimonial-card" key={index}>
              <p className="quote-icon">"</p>
              <p className="testimonial-quote">{item.quote}</p>

              <div className="testimonial-footer">
                <div className="testimonial-info">
                  <p className="testimonial-name">{item.name}</p>
                  <p className="testimonial-role">{item.title}</p>
                </div>
                <img className="testimonial-img" src={item.img} alt={item.name} />
              </div>
            </div>
          ))}
        </div>

        <div id="success-stories" className="success-stories">
          <div className="success-header">
            <p className="success-section-label">{t('successStories.sectionLabel')}</p>
            <h2 className="success-title">{t('successStories.title')}</h2>
          </div>

          <div className="success-cards-container">
            {stories.map((story, index) => (
              <div className="success-card" key={index}>
                <img src={story.img} alt={story.name} className="success-img" />
                <p className="success-name">{story.name}</p>
                <p className="success-role">{story.title}</p>
                <p className="success-quote">{story.quote}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;