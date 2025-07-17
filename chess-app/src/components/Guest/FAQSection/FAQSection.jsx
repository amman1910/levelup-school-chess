import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './FAQSection.css';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';

const FAQSection = () => {
  const { t, i18n } = useTranslation(); // הוספת i18n
  const [activeIndex, setActiveIndex] = useState(null);
  
  // בדיקה אם השפה הנוכחית היא ערבית
  const isRTL = i18n.language === 'ar';

  // נטען את השאלות והתשובות מהתרגום
  const faqData = [
    {
      question: t('faq.items.whoAreWe.question'),
      answer: t('faq.items.whoAreWe.answer')
    },
    {
      question: t('faq.items.whoCanJoin.question'),
      answer: t('faq.items.whoCanJoin.answer')
    },
    {
      question: t('faq.items.isCertified.question'),
      answer: t('faq.items.isCertified.answer')
    },
    {
      question: t('faq.items.courseTypes.question'),
      answer: t('faq.items.courseTypes.answer')
    },
    {
      question: t('faq.items.tournaments.question'),
      answer: t('faq.items.tournaments.answer')
    },
    {
      question: t('faq.items.howToRegister.question'),
      answer: t('faq.items.howToRegister.answer')
    },
    {
      question: t('faq.items.onlinePlatform.question'),
      answer: t('faq.items.onlinePlatform.answer')
    },
    {
      question: t('faq.items.canPlayOnline.question'),
      answer: t('faq.items.canPlayOnline.answer')
    },
    {
      question: t('faq.items.howToContact.question'),
      answer: t('faq.items.howToContact.answer')
    },
    {
      question: t('faq.items.collaboration.question'),
      answer: t('faq.items.collaboration.answer')
    }
  ];

  const toggleAnswer = (index) => {
    setActiveIndex(index === activeIndex ? null : index);
  };

  return (
    <div className={`faq-section ${isRTL ? 'rtl' : 'ltr'}`}>
      <h2 className="faq-title">{t('faq.title')}</h2>
      <div className="faq-list">
        {faqData.map((item, index) => (
          <div 
            className={`faq-item ${activeIndex === index ? 'open' : ''}`} 
            key={index}
          >
            <div className="faq-question" onClick={() => toggleAnswer(index)}>
              <span>{item.question}</span>
              <span className="faq-icon">
                {activeIndex === index ? <FaChevronUp /> : <FaChevronDown />}
              </span>
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