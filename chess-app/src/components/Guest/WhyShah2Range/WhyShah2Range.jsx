import React from 'react';
import './WhyShah2Range.css';

import cognitiveImg from '../../../assets/why-section/cognitive-growth.jpg';
import supportiveImg from '../../../assets/why-section/supportive-community.jpg';
import skillsImg from '../../../assets/why-section/empowering-skills.jpg';


const WhyShah2Range = () => {
  const features = [
    {
      title: 'Cognitive Growth',
      desc: 'Sharpen focus, strategy, and critical thinking through every match.',
      img: cognitiveImg,
    },
    {
      title: 'Supportive Community',
      desc: 'We welcome all levels — from beginners to future masters.',
      img: supportiveImg,
    },
    {
      title: 'Empowering Life Skills',
      desc: 'Confidence, discipline, and resilience — built one move at a time.',
      img: skillsImg,
    },
  ];

  return (
    <section className="why-shah2range-section" id="why-shah2range">
      <h2>More Than a Chess Club</h2>
      <div className="features-container">
        {features.map((f, index) => (
          <div className="feature-card" key={index}>
            <img src={f.img} alt={f.title} />
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>

      <div className="cta-container">
        <p className="cta-text">🟣 Ready to take your first step?</p>
        <button
          className="cta-button"
          onClick={() => {
            document.getElementById("join-form")?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          Join Shah2Range Now
        </button>
      </div>
    </section>
  );
};

export default WhyShah2Range;
