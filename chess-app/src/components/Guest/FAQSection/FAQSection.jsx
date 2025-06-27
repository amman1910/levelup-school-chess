import React, { useState } from 'react';
import './FAQSection.css';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';

const faqData = [
  {
    question: "Who are we?",
    answer: `"Shatranj Al-Quds" is an educational community-based program aiming to enhance cognitive and life skills for all ages through interactive, certified chess education in Arabic. We operate in schools, centers, and digital platforms.`
  },
  {
    question: "Who can join the program?",
    answer: "Our programs are open to students from age 3 and above, including beginners, advanced players, professionals, and educators interested in teaching chess."
  },
  {
    question: "Is the program officially certified?",
    answer: "Yes. The program is accredited by the Ministry of Education under license no. 18863 and operates under a certified educational framework. We are also partnered with international organizations such as FIDE (World Chess Federation)."
  },
  {
    question: "What types of courses are offered?",
    answer: "We offer beginner and advanced courses, FIDE-certified instructor training, specialized workshops, and interactive digital content."
  },
  {
    question: "Do you organize chess tournaments?",
    answer: "Yes. We organize school and local tournaments throughout the year, with motivational prizes and official participation certificates."
  },
  {
    question: "How can I register for a course or tournament?",
    answer: "You can register via our website through the designated registration form."
  },
  {
    question: "Do you offer an online learning platform?",
    answer: "Yes. We provide a digital platform with educational content, practice exercises, and competitions to support skill development."
  },
  {
    question: "Can I play online?",
    answer: "Yes. The platform offers safe, supervised training matches against AI or other students."
  },
  {
    question: "How can I contact you?",
    answer: `You can reach us via the "Contact Us" page or by email at: Contact@shah2range.com`
  },
  {
    question: "Can we invite your team to collaborate with our organization?",
    answer: "Absolutely. Educational institutions can submit a request through the website and we’ll be in touch to schedule a visit or an introductory meeting."
  }
];

const FAQSection = () => {
  const [activeIndex, setActiveIndex] = useState(null);

  const toggleAnswer = (index) => {
    setActiveIndex(index === activeIndex ? null : index);
  };

  return (
    <div className="faq-section">
      <h2 className="faq-title">Frequently Asked Questions</h2>
      <div className="faq-list">
        {faqData.map((item, index) => (
          <div className="faq-item" key={index}>
            <div className="faq-question" onClick={() => toggleAnswer(index)}>
              <span>{item.question}</span>
              {activeIndex === index ? <FaChevronUp /> : <FaChevronDown />}
            </div>
            {activeIndex === index && (
              <div className="faq-answer">{item.answer}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQSection;

