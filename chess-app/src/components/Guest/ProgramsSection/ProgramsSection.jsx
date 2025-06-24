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
  },
  {
    title: 'Evening Courses',
    desc: 'Group sessions for students and adults held outside school hours — designed for extra learning and fun.',
    img: eveningImg,
  },
  {
    title: 'Chess Tournaments',
    desc: 'Two competitive series: Jerusalem Open (7 events so far) and Jerusalem School Championships (3 events yearly).',
    img: tournamentsImg,
  },
  {
    title: 'Community Hub',
    desc: 'A space for casual players and advanced enthusiasts to meet, play, and grow — open to everyone.',
    img: communityImg,
  },
];

const ProgramsSection = () => {
  return (
    <section className="programs-section" id="programs">
      <h2>Programs & Activities</h2>
      <div className="programs-container">
        {programs.map((p, i) => (
          <div className="program-card" key={i}>
            <img src={p.img} alt={p.title} />
            <h3>{p.title}</h3>
            <p>{p.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ProgramsSection;

