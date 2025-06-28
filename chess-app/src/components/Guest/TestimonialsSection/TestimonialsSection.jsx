import React from 'react';
import './TestimonialsSection.css';

import hadeelImg from '../../../assets/Hall-of-fame/hall_hadeel.png';
import motazImg from '../../../assets/Hall-of-fame/hall_motaz.png';
import emanImg from '../../../assets/Hall-of-fame/hall_eman.png';


import bgImage from '../../../assets/Hall-of-fame/photo.jpg'; 
import jameelImg from '../../../assets/success-stories/success_jameel.jpg';
import hossamImg from '../../../assets/success-stories/success_hossam.jpg';
import noamanImg from '../../../assets/success-stories/success_noaman.png';


const testimonials = [
  {
    name: "Hadeel A.",
    title: "Senior Trainer",
    quote: "I've witnessed amazing transformations in our students. Chess is more than a game here – it's a tool for growth.",
    img: hadeelImg,
  },
  {
    name: "Motaz M.",
    title: "Head Coach",
    quote: "Our training focuses on discipline, focus, and strategic thinking. Proud to be part of this journey.",
    img: motazImg,
  },
  {
    name: "Eman K.",
    title: "Trainer & Mentor",
    quote: "I love guiding kids through their first moves and seeing their confidence grow each week.",
    img: emanImg,
  },
];

const stories = [
  {
    name: 'Jameel Naser',
    title: 'Youngest Chess Player in Jerusalem',
    quote: 'At just 4 years old, Jameel trains both on-site and online. He can beat you in 4 moves!',
    img: jameelImg,
  },
  {
    name: 'Daniel Hossam Bannoura',
    title: 'International Champion (U12)',
    quote: 'Champion of Cyprus U12 – defeating players from 25 countries. A rising star of Jerusalem!',
    img: hossamImg,
  },
  {
    name: 'Noaman Sharabati',
    title: 'From Passion to Purpose',
    quote: 'I aimed to make my students love chess — their excitement and progress proved I succeeded.',
    img: noamanImg,
  },
];


const TestimonialsSection = () => {
  return (
    <section id="testimonials"
      className="testimonials-section"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="testimonials-overlay" />
      <div className="testimonials-content">
        <div className="testimonials-header">
  <p className="testimonials-title">Testimonials</p>
  <h2 className="testimonials-subtitle">
  Stories behind<br />the moves.
</h2>

</div>

  <div className="testimonials-container">
  {testimonials.map((item, index) => (
    <div className="testimonial-card" key={index}>
      <p className="quote-icon">“</p>
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
    <p className="success-section-label">SUCCESS STORIES</p>
    <h2 className="success-title">Stories of Impact</h2>
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




