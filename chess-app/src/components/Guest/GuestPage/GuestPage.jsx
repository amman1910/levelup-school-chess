import React from 'react';
import { useTranslation } from 'react-i18next';
import Navbar from '../Navbar/Navbar';
import HeroSection from '../HeroSection/HeroSection';
import WhyShah2Range from '../WhyShah2Range/WhyShah2Range';
import ProgramsSection from '../ProgramsSection/ProgramsSection';
import TestimonialsSection from '../TestimonialsSection/TestimonialsSection';
import GallerySection from '../GallerySection/GallerySection';
import AboutUsSection from '../AboutUsSection/AboutUsSection';
import NewsAndEventsSection from '../NewsAndEventsSection/NewsAndEventsSection';
import InquiryForm from '../InquiryForm/InquiryForm';
import Footer from '../FooterSection/Footer';
import FAQSection from '../FAQSection/FAQSection';

import './GuestPage.css';

/**
 * GuestPage Component
 * Main landing page that renders all sections in proper order
 * Features internationalization support and responsive design
 */
const GuestPage = () => {
  const { t } = useTranslation();

  return (
    <>
      <div className="guest-font">
        <Navbar />
        <HeroSection />
        <WhyShah2Range />
        <AboutUsSection />
        <ProgramsSection />
        <TestimonialsSection />
        <NewsAndEventsSection />
        <GallerySection />
        <FAQSection />
        <Footer />
      </div>
    </>
  );
};

export default GuestPage;