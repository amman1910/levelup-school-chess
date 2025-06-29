import React from 'react';
import './HeroSection.css';

import bishop from '../../../assets/hero-pieces/bishop.png';
import king from '../../../assets/hero-pieces/king.png';
import pawn from '../../../assets/hero-pieces/pawn.png';
import queen from '../../../assets/hero-pieces/queen.png';
import rock from '../../../assets/hero-pieces/rock.png';

const HeroSection = () => {
  return (
    <section className="hero-section" id="top">
      {/* مجموعة يمين فوق */}
      <div className="group top-right">
        <img src={king} alt="king" className="piece king" />
        <img src={bishop} alt="bishop" className="piece bishop" />
      </div>

      {/* مجموعة يسار تحت */}
      <div className="group bottom-left">
        <img src={rock} alt="rock" className="piece rock" />
                <img src={queen} alt="queen" className="piece queen" />

        <img src={pawn} alt="pawn" className="piece pawn" />
      </div>

      {/* النص والأزرار */}
      <div className="hero-content">
        
        <h1>Welcome to <span className="gold-text">Shah2Range</span></h1>


        <p>
           where passionate chess players and enthusiasts of all levels come together
          to grow, compete, and develop their strategic thinking. Whether you're a beginner or a seasoned pro, we offer a welcoming community for everyone!
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

          <a href="#why-shah2range" className="explore-btn">Learn more</a>

        </div>
      </div>
    </section>
  );
};

export default HeroSection;












