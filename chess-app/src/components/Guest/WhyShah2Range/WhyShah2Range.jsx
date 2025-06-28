import React from 'react';
import './WhyShah2Range.css';
import { FaAward, FaChalkboardTeacher, FaUsers } from 'react-icons/fa';

const WhyShah2Range = () => {
  return (
    <section className="why-cards-section">
      <div className="why-cards-container">
        <div className="why-card dark">
          <FaAward className="why-icon" />
          <h3>FIDE Certified Coaches</h3>
          <p>Learn chess from top-tier coaches officially certified by the International Chess Federation (FIDE). Our instructors combine expertise with a passion for teaching.</p>
        </div>

        <div className="why-card light">
          <FaChalkboardTeacher className="why-icon" />
          <h3>Vision of Growth</h3>
          <p>We strive to be a leading community where chess fuels intellectual development, resilience, and lifelong learning for all ages and skill levels.</p>
        </div>

        <div className="why-card dark">
          <FaUsers className="why-icon" />
          <h3>From Beginner to Advanced</h3>
          <p>Our structured programs serve players at every stage — from first moves to advanced strategies — with personalized training and competitive growth.</p>
        </div>
      </div>
    </section>
  );
};

export default WhyShah2Range;
