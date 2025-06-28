import React from 'react';
import './ProgramsSection.css';
import { FaSchool, FaMoon, FaTrophy, FaUsers } from 'react-icons/fa';

const programs = [
  {
    icon: <FaSchool />,
    title: 'School Trainings',
    description:
      'Certified chess curriculum integrated within schools. Structured plans, expert trainers, and in-school delivery.',
  },
  {
    icon: <FaMoon />,
    title: 'Evening Courses',
    description:
      'After-school programs for students and adults. Flexible learning to sharpen tactical and strategic skills.',
  },
  {
    icon: <FaTrophy />,
    title: 'Championships',
    description:
      'Open and school-based chess tournaments. Featuring the Jerusalem Open Series and annual School Cups.',
  },
  {
    icon: <FaUsers />,
    title: 'Community',
    description:
      'A vibrant space for hobbyists and pros to connect, play, and exchange ideas. Open for all chess lovers.',
  },
];

const ProgramsSection = () => {
  return (
    <section className="programs-section" id="programs">
      <div className="programs-header">
        <h2>Programs & Events</h2>
        <p>Explore the diverse activities that make Shah2Range a thriving chess community.</p>
      </div>
      <div className="programs-grid">
        {programs.map((program, index) => (
          <div className="program-card" key={index} data-aos="fade-up" data-aos-delay={index * 100}>
            <div className="program-icon">{program.icon}</div>
            <h3>{program.title}</h3>
            <p>{program.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ProgramsSection;
