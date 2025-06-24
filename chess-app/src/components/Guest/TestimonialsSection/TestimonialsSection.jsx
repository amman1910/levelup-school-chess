import React from 'react';
import './TestimonialsSection.css';

import emanImg from '../../../assets/Hall-of-fame/hall_eman.png';
import motazImg from '../../../assets/Hall-of-fame/hall_motaz.png';
import hadeelImg from '../../../assets/Hall-of-fame/hall_hadeel.png';

const testimonials = [
  {
    name: 'Iman Harbawi',
    role: 'Chess Trainer',
    quote: 'Working with this team in the school chess program is something I’m proud of. The sense of responsibility and the students’ energy keep me motivated.',
    img: emanImg,
  },
  {
    name: 'Motaz Darwish',
    role: 'Chess Coach',
    quote: 'Every moment I teach a student is a memory that stays with me. Together, we aim to elevate Jerusalem through chess.',
    img: motazImg,
  },
  {
    name: 'Hadeel Ghazawi',
    role: 'Chess Trainer',
    quote: 'Seeing my students win top places in their very first tournaments is unforgettable. Their passion and growth are why I keep going.',
    img: hadeelImg,
  },
];

const TestimonialsSection = () => {
  return (
    <section className="testimonials-section" id="testimonials">
      <h2>Trainer Testimonials</h2>
      <div className="testimonials-container">
        {testimonials.map((t, i) => (
          <div className="testimonial-card" key={i}>
            <img src={t.img} alt={t.name} />
            <h3>{t.name}</h3>
            <p className="role">{t.role}</p>
            <p className="quote">“{t.quote}”</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TestimonialsSection;
