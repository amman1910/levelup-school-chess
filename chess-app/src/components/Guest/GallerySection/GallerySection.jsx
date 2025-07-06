import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next'; // הוספת useTranslation
import './GallerySection.css';
import { getStorage, ref, listAll, getDownloadURL } from 'firebase/storage';

const GallerySection = () => {
  const { t } = useTranslation(); // הוספת hook לתרגום
  const [images, setImages] = useState([]);
  const storage = getStorage();
  const [selectedImage, setSelectedImage] = useState(null);

  // تحميل الصور من Firebase
  useEffect(() => {
    const galleryRef = ref(storage, 'gallery/');
    listAll(galleryRef)
      .then((res) => {
        const urlPromises = res.items.map((itemRef) => getDownloadURL(itemRef));
        return Promise.all(urlPromises);
      })
      .then((urls) => {
        setImages(urls);
      })
      .catch((error) => {
        console.error('Error loading gallery images:', error);
      });
  }, []);

  // تحريك الصفوف مع السكرول بطريقة ذكية مثل موقع Pitch
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

  // تقسيم الصور إلى صفوف من 6
  const chunkArray = (arr, size) => {
    const result = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result.slice(0, 3);
  };

  const chunkedImages = chunkArray(images, 6);

  return (
    <>
      {selectedImage && (
        <div className="image-modal" onClick={() => setSelectedImage(null)}>
          <span className="close-btn" onClick={() => setSelectedImage(null)}>&times;</span>
          <img src={selectedImage} alt={t('gallery.fullView')} className="modal-image" />
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
                {row.map((url, index) => (
                  <div className="gallery-item" key={index}>
                    <img
                      src={url}
                      alt={t('gallery.imageAlt', { number: index + 1 })}
                      onClick={() => setSelectedImage(url)}
                      style={{ cursor: 'pointer' }}
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