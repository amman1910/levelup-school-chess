import React from 'react';
import './ProgramsSection.css';

import trainingImg from '../../../assets/program-section/in-school-training.jpg';
import eveningImg from '../../../assets/program-section/evening-courses.jpg';
import tournamentsImg from '../../../assets/program-section/chess-tournaments.jpg';
import communityImg from '../../../assets/program-section/community-hub.jpg';

const programs = [
  {
    title: 'In-School Training',
    desc: 'Structured chess programs delivered in schools — following an official curriculum and a clear development plan.',
    img: trainingImg,
    badge: 'School Program',
  },
  {
    title: 'Evening Courses',
    desc: 'Group sessions for students and adults held outside school hours — designed for extra learning and fun.',
    img: eveningImg,
    badge: 'Evening Courses',
  },
  {
    title: 'Chess Tournaments',
    desc: 'Two competitive series: Jerusalem Open (7 events so far) and Jerusalem School Championships (3 events yearly).',
    img: tournamentsImg,
    badge: 'Championships Series',
  },
  {
    title: 'Community Hub',
    desc: 'A space for casual players and advanced enthusiasts to meet, play, and grow — open to everyone.',
    img: communityImg,
    badge: 'Chess Community',
  },
];

const ProgramsSection = () => {
  return (
    <section id="programs" className="programs-section">
      <div className="programs-header">
  <p className="programs-label">Services & Activities	</p>
  <h2 className="programs-title">Learn. Improve.<br />Master the Game.</h2>
</div>
      <div className="programs-grid">
        {programs.map((program, index) => (
          <div className="program-card" key={index}>
            <div className="program-card-img-wrapper">
              <span className="program-badge">{program.badge}</span>
              <img src={program.img} alt={program.title} />
            </div>
            <div className="program-card-text">
              <h3>{program.title}</h3>
              <p>{program.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ProgramsSection;



