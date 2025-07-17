import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { db } from '../../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import './GallerySection.css';

/**
 * GallerySection Component
 * Displays a responsive image gallery loaded from Firestore
 * Features parallax scrolling effect, modal image viewer, and loading states
 */
const GallerySection = () => {
  const { t } = useTranslation();
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Fetch gallery images from Firestore collection
   */
  useEffect(() => {
    const fetchGalleryImages = async () => {
      try {
        setLoading(true);
        const snapshot = await getDocs(collection(db, 'gallery'));
        const galleryData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Sort by upload date (newest first)
        const sortedImages = galleryData.sort((a, b) => {
          const dateA = a.uploadedAt?.toDate ? a.uploadedAt.toDate() : new Date(a.uploadedAt);
          const dateB = b.uploadedAt?.toDate ? b.uploadedAt.toDate() : new Date(b.uploadedAt);
          return dateB - dateA;
        });

        setImages(sortedImages);
      } catch (error) {
        // Error handling without console logging
      } finally {
        setLoading(false);
      }
    };

    fetchGalleryImages();
  }, []);

  /**
   * Parallax scroll effect for gallery rows
   */
  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const rows = document.querySelectorAll('.gallery-row');

      rows.forEach((row) => {
        const direction = row.getAttribute('data-direction');
        const parent = row.parentElement;
        const rect = parent.getBoundingClientRect();
        const scrollAmount = (windowHeight - rect.top) * 0.15 * direction - 50 * direction;

        if (rect.top < windowHeight && rect.bottom > 0) {
          row.style.transform = `translateX(${scrollAmount}px)`;
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /**
   * Split array into chunks for gallery rows
   * @param {Array} arr - Array to chunk
   * @param {number} size - Size of each chunk
   * @returns {Array} Array of chunks (limited to 3 rows)
   */
  const chunkArray = (arr, size) => {
    const result = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result.slice(0, 3);
  };

  const chunkedImages = chunkArray(images, 6);

  // Loading state
  if (loading) {
    return (
      <section className="gallery-section" id="gallery">
        <div className="gallery-header">
          <p className="section-label">{t('gallery.sectionLabel')}</p>
          <h2 className="gallery-title">{t('gallery.title')}</h2>
        </div>
        <div className="gallery-loading">
          <p>{t('common.loading')}...</p>
        </div>
      </section>
    );
  }

  // Empty state
  if (images.length === 0) {
    return (
      <section className="gallery-section" id="gallery">
        <div className="gallery-header">
          <p className="section-label">{t('gallery.sectionLabel')}</p>
          <h2 className="gallery-title">{t('gallery.title')}</h2>
        </div>
        <div className="gallery-empty">
          <p>{t('gallery.noImages')}</p>
        </div>
      </section>
    );
  }

  return (
    <>
      {/* Image modal for enlarged view */}
      {selectedImage && (
        <div className="image-modal" onClick={() => setSelectedImage(null)}>
          <span className="close-btn" onClick={() => setSelectedImage(null)}>&times;</span>
          <img src={selectedImage.imageUrl} alt={selectedImage.title} className="modal-image" />
          <div className="modal-title">{selectedImage.title}</div>
        </div>
      )}

      {/* Main gallery section */}
      <section className="gallery-section" id="gallery">
        <div className="gallery-header">
          <p className="section-label">{t('gallery.sectionLabel')}</p>
          <h2 className="gallery-title">{t('gallery.title')}</h2>
        </div>

        {/* Gallery grid with parallax rows */}
        <div className="gallery-grid-container">
          {chunkedImages.map((row, rowIndex) => (
            <div className="gallery-row-wrapper" key={rowIndex}>
              <div className="gallery-row" data-direction={rowIndex % 2 === 0 ? 1 : -1}>
                {row.map((imageData, index) => (
                  <div className="gallery-item" key={imageData.id || index}>
                    <img
                      src={imageData.imageUrl}
                      alt={imageData.title}
                      onClick={() => setSelectedImage(imageData)}
                      style={{ cursor: 'pointer' }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
};

export default GallerySection;