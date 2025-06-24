import React from 'react';
import './SuccessStoriesSection.css';

import jameelImg from '../../../assets/success-stories/success_jameel.jpg';
import hossamImg from '../../../assets/success-stories/success_hossam.jpg';
import noamanImg from '../../../assets/success-stories/success_noaman.png';

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

const SuccessStoriesSection = () => {
  return (
    <section className="success-stories-section" id="success-stories">
      <h2>Success Stories</h2>
      <div className="stories-container">
        {stories.map((s, i) => (
          <div className="story-card" key={i}>
            <img src={s.img} alt={s.name} />
            <h3>{s.name}</h3>
            <p className="story-title">{s.title}</p>
            <p className="story-quote">“{s.quote}”</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default SuccessStoriesSection;
