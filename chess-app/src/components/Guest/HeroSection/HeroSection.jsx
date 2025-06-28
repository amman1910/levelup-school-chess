import React from 'react';
import './HeroSection.css';

const HeroSection = () => {
  return (
    <section className="hero-section">
      <div className="hero-content">
        <h1>Welcome to Shah2Range</h1>
        <p>
          Where passionate chess minds connect, grow, and master the game of kings.
          Whether you're a curious beginner or a seasoned pro, we offer a welcoming community for everyone!
        </p>
        <div className="hero-buttons">
          <a
  className="join-btn"
  href="/join"
  target="_blank"
  rel="noopener noreferrer"
>
  Join Now
</a>

          <button className="explore-btn">Learn more</button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;




