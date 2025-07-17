import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { db } from '../../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './NewsAndEventsSection.css';

/**
 * NewsAndEventsSection Component
 * Displays horizontally scrollable carousels for events and news items
 * Features join functionality for events with language parameter support
 */
const NewsAndEventsSection = () => {
  const { t, i18n } = useTranslation();
  const [events, setEvents] = useState([]);
  const [newsItems, setNewsItems] = useState([]);

  const carouselRef = useRef(null); // Events carousel reference
  const newsRef = useRef(null);     // News carousel reference
  const navigate = useNavigate();

  /**
   * Handle join event button click with language parameter
   * @param {string} eventType - Type of event (course/tournament)
   * @param {string} eventTitle - Title of the event
   */
  const handleJoinEventClick = (eventType, eventTitle) => {
    const currentLanguage = i18n.language;
    const joinUrl = `/join?applicantType=${eventType}&eventName=${encodeURIComponent(eventTitle)}&lang=${currentLanguage}`;
    window.open(joinUrl, '_blank', 'noopener,noreferrer');
  };

  /**
   * Fetch events and news data from Firestore
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const eventsSnapshot = await getDocs(collection(db, 'events'));
        const allEvents = eventsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        const filteredEvents = allEvents.filter((event) =>
          event.type === 'course' || event.type === 'tournament'
        );
        setEvents(filteredEvents);

        const newsSnapshot = await getDocs(collection(db, 'news'));
        const newsData = newsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        setNewsItems(newsData);
      } catch (error) {
        // Error handling without console logging
      }
    };

    fetchData();
  }, []);

  /**
   * Scroll events carousel to the left
   */
  const scrollLeft = () => {
    carouselRef.current.scrollBy({ left: -300, behavior: 'smooth' });
  };

  /**
   * Scroll events carousel to the right
   */
  const scrollRight = () => {
    carouselRef.current.scrollBy({ left: 300, behavior: 'smooth' });
  };

  /**
   * Scroll news carousel to the left
   */
  const scrollNewsLeft = () => {
    newsRef.current.scrollBy({ left: -300, behavior: 'smooth' });
  };

  /**
   * Scroll news carousel to the right
   */
  const scrollNewsRight = () => {
    newsRef.current.scrollBy({ left: 300, behavior: 'smooth' });
  };

  return (
    <section className="events-section" id="news">
      {/* Section header */}
      <div className="events-header">
        <p className="section-label">{t('newsEvents.sectionLabel')}</p>
        <h2 className="events-title">{t('newsEvents.title')}</h2>
      </div>

      {/* Events/Programs section */}
      <section className="events-subsection">
        <h3 className="subsection-title">{t('newsEvents.programsCompetitions')}</h3>
        <div className="events-carousel-wrapper" style={{ position: 'relative', padding: '0 60px' }}>
          <button 
            className="arrow left" 
            onClick={scrollLeft}
            style={{ left: '10px' }}
          >
            ‹
          </button>
          <div 
            className="events-carousel" 
            ref={carouselRef}
          >
            {events.map((event, index) => (
              <div className="event-card-horizontal" key={index}>
                <div className="event-img-wrapper">
                  {event.imageURL && (
                    <img src={event.imageURL} alt={event.title} className="event-img" />
                  )}
                  {event.type && (
                    <div className={`event-type-badge ${event.type}`}>
                      {event.type.toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="event-info">
                  <p className="event-date">
                    📅 {new Date(event.date.seconds * 1000).toLocaleDateString('en-GB')}
                  </p>
                  <h3 className="event-title">{event.title}</h3>
                  <p className="event-location">📍 {event.location}</p>
                  <p className="event-description">{event.description}</p>
                  <a
                    className="event-join-btn"
                    href={`/join?applicantType=${event.type}&eventName=${encodeURIComponent(event.title)}`}
                    onClick={(e) => {
                      e.preventDefault();
                      handleJoinEventClick(event.type, event.title);
                    }}
                    rel="noopener noreferrer"
                  >
                    {t('newsEvents.joinNow')}
                  </a>
                </div>
              </div>
            ))}
          </div>
          <button 
            className="arrow right" 
            onClick={scrollRight}
            style={{ right: '10px' }}
          >
            ›
          </button>
        </div>
      </section>

      {/* News section */}
      <section className="events-subsection">
        <h3 className="subsection-title">{t('newsEvents.newsAnnouncements')}</h3>
        <div className="events-carousel-wrapper" style={{ position: 'relative', padding: '0 60px' }}>
          <button 
            className="arrow left" 
            onClick={scrollNewsLeft}
            style={{ left: '10px' }}
          >
            ‹
          </button>
          <div 
            className="news-carousel" 
            ref={newsRef}
          >
            {newsItems.map((news, idx) => (
              <div className="news-card" key={idx}>
                {news.imageUrl && (
                  <img src={news.imageUrl} alt={news.title} className="news-img" />
                )}
                <div className="news-info">
                  <h4 className="news-title">{news.title}</h4>
                  <p className="news-description">{news.description}</p>
                </div>
              </div>
            ))}
          </div>
          <button 
            className="arrow right" 
            onClick={scrollNewsRight}
            style={{ right: '10px' }}
          >
            ›
          </button>
        </div>
      </section>
    </section>
  );
};

export default NewsAndEventsSection;