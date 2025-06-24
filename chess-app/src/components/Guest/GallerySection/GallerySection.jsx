import React, { useEffect, useState } from 'react';
import './GallerySection.css';
import { getStorage, ref, listAll, getDownloadURL } from 'firebase/storage';

const GallerySection = () => {
  const [images, setImages] = useState([]);
  const storage = getStorage();
  const galleryRef = ref(storage, 'gallery/');

  useEffect(() => {
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

  return (
    <section className="gallery-section" id="gallery">
      <h2>Gallery</h2>
      <div className="gallery-grid">
        {images.map((url, index) => (
          <div className="gallery-item" key={index}>
            <img src={url} alt={`Gallery ${index + 1}`} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default GallerySection;
