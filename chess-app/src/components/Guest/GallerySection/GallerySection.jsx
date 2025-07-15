import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { db } from '../../../firebase'; // עדכן את הנתיב לפי המבנה שלך
import { collection, getDocs } from 'firebase/firestore';
import './GallerySection.css';

const GallerySection = () => {
  const { t } = useTranslation();
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(true);

  // טעינת תמונות מ-Firestore במקום מ-Storage
  useEffect(() => {
    const fetchGalleryImages = async () => {
      try {
        setLoading(true);
        const snapshot = await getDocs(collection(db, 'gallery'));
        const galleryData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // מיון לפי תאריך העלאה (החדשים ראשון)
        const sortedImages = galleryData.sort((a, b) => {
          const dateA = a.uploadedAt?.toDate ? a.uploadedAt.toDate() : new Date(a.uploadedAt);
          const dateB = b.uploadedAt?.toDate ? b.uploadedAt.toDate() : new Date(b.uploadedAt);
          return dateB - dateA;
        });

        setImages(sortedImages);
      } catch (error) {
        console.error('Error loading gallery images:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGalleryImages();
  }, []);

  // תחריך הגלילה
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

  // חלוקת תמונות לשורות
  const chunkArray = (arr, size) => {
    const result = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result.slice(0, 3);
  };

  const chunkedImages = chunkArray(images, 6);

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
      {selectedImage && (
        <div className="image-modal" onClick={() => setSelectedImage(null)}>
          <span className="close-btn" onClick={() => setSelectedImage(null)}>&times;</span>
          <img src={selectedImage.imageUrl} alt={selectedImage.title} className="modal-image" />
          <div className="modal-title">{selectedImage.title}</div>
        </div>
      )}

      <section className="gallery-section" id="gallery">
        <div className="gallery-header">
          <p className="section-label">{t('gallery.sectionLabel')}</p>
          <h2 className="gallery-title">{t('gallery.title')}</h2>
        </div>

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
                        console.error('Error loading image:', imageData.imageUrl);
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