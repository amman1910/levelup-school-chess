import React from 'react';
import './AboutUsSection.css';
import teamPhoto from '../../../assets/aboutAs-photos/output.jpg';

const AboutUsSection = () => {
  return (
    <section id="about" className="about-section">
      {/* Header Row */}
      <div className="about-header">
        <p className="about-section-label">About Us</p>
        <h2 className="about-title">Champions Behind the Boards</h2>
      </div>

      {/* Content Row */}
      <div className="about-content-row">
        <div className="about-image-side">
          <img src={teamPhoto} alt="Shah2Range Team" />
        </div>

        <div className="about-text-side">
          <div className="about-paragraph">
            <h3>Expert Coaches</h3>
            <p>
              Our coaches are the backbone of Shah2Range. With years of experience in both
              teaching and competition, they guide every player with care and passion.
            </p>
          </div>
          <div className="about-paragraph">
            <h3>Vision of Growth</h3>
            <p>
              We strive to create an inclusive space where chess nurtures intellect, resilience,
              and lifelong learning for all ages and skill levels.
            </p>
          </div>
          <div className="about-paragraph">
            <h3>Team of Puzzle Solvers</h3>
            <p>
              Behind every move is a team of dedicated organizers, arbiters, and volunteers
              working together to deliver a seamless chess experience.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutUsSection;








