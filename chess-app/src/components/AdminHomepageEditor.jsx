import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next'; // הוספת useTranslation
import { db, storage } from '../firebase';
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import './AdminHomepageEditor.css';

const AdminHomepageEditor = ({ loading, setLoading, error, success }) => {
  const { t } = useTranslation(); // הוספת hook לתרגום
  // State for all collections
  const [newsList, setNewsList] = useState([]);
  const [eventsList, setEventsList] = useState([]);
  const [galleryList, setGalleryList] = useState([]);
  
  // Active section state
  const [activeSection, setActiveSection] = useState('news');
  
  // Form states
  const [newsForm, setNewsForm] = useState({ title: '', description: '' });
  const [eventsForm, setEventsForm] = useState({ title: '', description: '', date: '', location: '',  type: '' });
  const [galleryForm, setGalleryForm] = useState({ title: '' });
  
  // Image states
  const [selectedImages, setSelectedImages] = useState({
    news: null,
    events: null,
    gallery: null
  });
  const [imagePreviews, setImagePreviews] = useState({
    news: null,
    events: null,
    gallery: null
  });
  
  // Edit states
  const [editingItems, setEditingItems] = useState({
    news: null,
    events: null,
    gallery: null
  });
  const [editData, setEditData] = useState({
    news: { title: '', description: '' },
    events: { title: '', description: '', date: '', location: '' },
    gallery: { title: '' }
  });

  // Search and sort
  const [searchQueries, setSearchQueries] = useState({
    news: '',
    events: '',
    gallery: ''
  });
  const [sortOptions, setSortOptions] = useState({
    news: 'newest',
    events: 'newest',
    gallery: 'newest'
  });

  // Image viewer modal
  const [viewingImage, setViewingImage] = useState(null);

  // פונקציה לרישום פעולות ב-adminLogs
  const logAdminAction = async (actionType, description, targetType, targetId = null) => {
    try {
      // קבלת פרטי המשתמש הנוכחי
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const adminName = `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.email || 'Unknown Admin';

      const logEntry = {
        actionType,
        adminName,
        description,
        targetType,
        timestamp: new Date(),
        targetId: targetId || null,
        adminId: currentUser.uid || currentUser.id || null
      };

      await addDoc(collection(db, 'adminLogs'), logEntry);
      console.log('Admin action logged:', logEntry);
    } catch (err) {
      console.error('Error logging admin action:', err);
      // אל תעצור את הפעולה אם הלוג נכשל
    }
  };

  // Fetch functions
  const fetchNews = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'news'));
      const news = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setNewsList(news);
    } catch (err) {
      console.error('Failed to fetch news:', err);
      error(t('adminHomepage.failedToLoadNews'));
    }
  };

  const fetchEvents = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'events'));
      const events = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEventsList(events);
    } catch (err) {
      console.error('Failed to fetch events:', err);
      error(t('adminHomepage.failedToLoadEvents'));
    }
  };

  const fetchGallery = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'gallery'));
      const gallery = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setGalleryList(gallery);
    } catch (err) {
      console.error('Failed to fetch gallery:', err);
      error(t('adminHomepage.failedToLoadGallery'));
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchNews(), fetchEvents(), fetchGallery()]);
    } catch (err) {
      error(t('adminHomepage.failedToLoadData'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Image handling
  const handleImageChange = (section, file) => {
    if (file) {
      if (!file.type.startsWith('image/')) {
        error(t('adminHomepage.selectValidImage'));
        return;
      }
      setSelectedImages(prev => ({ ...prev, [section]: file }));
      setImagePreviews(prev => ({ ...prev, [section]: URL.createObjectURL(file) }));
    }
  };

  // Upload image to storage
  const uploadImage = async (file, path) => {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  };

  // News functions
  const handleNewsSubmit = async (e) => {
    e.preventDefault();
    if (!newsForm.title.trim() || !newsForm.description.trim()) {
      error(t('adminHomepage.fillTitleDescription'));
      return;
    }

    setLoading(true);
    try {
      let imageUrl = null;
      
      // Upload image only if one is selected
      if (selectedImages.news) {
        imageUrl = await uploadImage(selectedImages.news, `news/${Date.now()}_${selectedImages.news.name}`);
      }
      
      const docRef = await addDoc(collection(db, 'news'), {
        title: newsForm.title.trim(),
        description: newsForm.description.trim(),
        imageUrl,
        uploadedAt: new Date(),
      });

      // רישום פעולה ב-adminLogs
      await logAdminAction(
        'add-news',
        `Added a new news item with the title "${newsForm.title.trim()}"`,
        'news',
        docRef.id
      );

      const newItem = {
        id: docRef.id,
        title: newsForm.title.trim(),
        description: newsForm.description.trim(),
        imageUrl,
        uploadedAt: new Date()
      };

      setNewsList(prev => [...prev, newItem]);
      setNewsForm({ title: '', description: '' });
      setSelectedImages(prev => ({ ...prev, news: null }));
      setImagePreviews(prev => ({ ...prev, news: null }));
      
      success(t('adminHomepage.newsItemAdded'));
    } catch (err) {
      console.error('Error adding news:', err);
      error(t('adminHomepage.failedToAddNews'));
    } finally {
      setLoading(false);
    }
  };

  // Events functions
  const handleEventsSubmit = async (e) => {
    e.preventDefault();
    if (!eventsForm.title.trim() || !eventsForm.description.trim() || !eventsForm.date || !eventsForm.location.trim()) {
      error(t('adminHomepage.fillAllRequiredFields'));
      return;
    }

    setLoading(true);
    try {
      let imageUrl = null;
      
      // Upload image only if one is selected
      if (selectedImages.events) {
        imageUrl = await uploadImage(selectedImages.events, `events/${Date.now()}_${selectedImages.events.name}`);
      }
      
            const docRef = await addDoc(collection(db, 'events'), {
        title: eventsForm.title.trim(),
        description: eventsForm.description.trim(),
        date: new Date(eventsForm.date),
        location: eventsForm.location.trim(),
          type: eventsForm.type,
        imageURL: imageUrl, // ✅ صِرنا نخزّن بالرسمية imageURL
        uploadedAt: new Date(),
      });


      // רישום פעולה ב-adminLogs
      await logAdminAction(
        'add-event',
        `Added a new event with the title "${eventsForm.title.trim()}" scheduled for ${new Date(eventsForm.date).toLocaleDateString()}`,
        'event',
        docRef.id
      );

      const newItem = {
        id: docRef.id,
        title: eventsForm.title.trim(),
        description: eventsForm.description.trim(),
        date: new Date(eventsForm.date),
        location: eventsForm.location.trim(),
        imageUrl,
        uploadedAt: new Date()
      };

      setEventsList(prev => [...prev, newItem]);
      setEventsForm({ title: '', description: '', date: '', location: '',type: '' });
      setSelectedImages(prev => ({ ...prev, events: null }));
      setImagePreviews(prev => ({ ...prev, events: null }));
      
      success(t('adminHomepage.eventAdded'));
    } catch (err) {
      console.error('Error adding event:', err);
      error(t('adminHomepage.failedToAddEvent'));
    } finally {
      setLoading(false);
    }
  };

  // Gallery functions (image still required for gallery)
  const handleGallerySubmit = async (e) => {
    e.preventDefault();
    if (!selectedImages.gallery || !galleryForm.title.trim()) {
      error(t('adminHomepage.fillTitleSelectImage'));
      return;
    }

    setLoading(true);
    try {
      const imageUrl = await uploadImage(selectedImages.gallery, `gallery/${Date.now()}_${selectedImages.gallery.name}`);
      
      const docRef = await addDoc(collection(db, 'gallery'), {
        title: galleryForm.title.trim(),
        imageUrl,
        uploadedAt: new Date(),
      });

      // רישום פעולה ב-adminLogs
      await logAdminAction(
        'add-gallery',
        `Added a new gallery image with the title "${galleryForm.title.trim()}"`,
        'gallery',
        docRef.id
      );

      const newItem = {
        id: docRef.id,
        title: galleryForm.title.trim(),
        imageUrl,
        uploadedAt: new Date()
      };

      setGalleryList(prev => [...prev, newItem]);
      setGalleryForm({ title: '' });
      setSelectedImages(prev => ({ ...prev, gallery: null }));
      setImagePreviews(prev => ({ ...prev, gallery: null }));
      
      success(t('adminHomepage.galleryImageAdded'));
    } catch (err) {
      console.error('Error adding gallery image:', err);
      error(t('adminHomepage.failedToAddGallery'));
    } finally {
      setLoading(false);
    }
  };

  // Delete functions
  const handleDelete = async (section, id, imageUrl) => {
    // קבלת פרטי הפריט לפני המחיקה
    let itemToDelete = null;
    if (section === 'news') {
      itemToDelete = newsList.find(item => item.id === id);
    } else if (section === 'events') {
      itemToDelete = eventsList.find(item => item.id === id);
    } else if (section === 'gallery') {
      itemToDelete = galleryList.find(item => item.id === id);
    }

    if (!itemToDelete) {
      error(`${section.charAt(0).toUpperCase() + section.slice(1)} ${t('adminHomepage.itemNotFound')}`);
      return;
    }

    if (!window.confirm(t('adminHomepage.confirmDelete', { section, title: itemToDelete.title }))) return;

    setLoading(true);
    try {
      await deleteDoc(doc(db, section, id));
      
      // Try to delete image from storage
      if (imageUrl) {
        try {
          const imageRef = ref(storage, imageUrl);
          await deleteObject(imageRef);
        } catch (storageErr) {
          console.warn('Could not delete image from storage:', storageErr);
        }
      }

      // רישום פעולה ב-adminLogs
      const actionType = `delete-${section === 'events' ? 'event' : section}`;
      const targetType = section === 'events' ? 'event' : section;
      await logAdminAction(
        actionType,
        `Deleted ${section === 'events' ? 'event' : section} "${itemToDelete.title}"`,
        targetType,
        id
      );

      if (section === 'news') {
        setNewsList(prev => prev.filter(item => item.id !== id));
      } else if (section === 'events') {
        setEventsList(prev => prev.filter(item => item.id !== id));
      } else if (section === 'gallery') {
        setGalleryList(prev => prev.filter(item => item.id !== id));
      }
      
      success(t('adminHomepage.itemDeleted', { section: section.charAt(0).toUpperCase() + section.slice(1) }));
    } catch (err) {
      console.error(`Error deleting ${section}:`, err);
      error(t('adminHomepage.failedToDelete', { section }));
    } finally {
      setLoading(false);
    }
  };

  // Edit functions
  const startEditing = (section, item) => {
    setEditingItems(prev => ({ ...prev, [section]: item.id }));
    if (section === 'news') {
      setEditData(prev => ({ ...prev, news: { title: item.title, description: item.description } }));
    } else if (section === 'events') {
      const dateStr = item.date?.toDate ? item.date.toDate().toISOString().split('T')[0] : '';
      setEditData(prev => ({ 
        ...prev, 
        events: { 
          title: item.title, 
          description: item.description, 
          date: dateStr, 
          location: item.location 
        } 
      }));
    } else if (section === 'gallery') {
      setEditData(prev => ({ ...prev, gallery: { title: item.title } }));
    }
  };

  const handleEditSave = async (section, id) => {
    const data = editData[section];
    if (!data.title.trim()) {
      error(t('adminHomepage.fillRequiredFields'));
      return;
    }

    // קבלת פרטי הפריט לפני העדכון
    let itemToEdit = null;
    if (section === 'news') {
      itemToEdit = newsList.find(item => item.id === id);
    } else if (section === 'events') {
      itemToEdit = eventsList.find(item => item.id === id);
    } else if (section === 'gallery') {
      itemToEdit = galleryList.find(item => item.id === id);
    }

    if (!itemToEdit) {
      error(`${section.charAt(0).toUpperCase() + section.slice(1)} ${t('adminHomepage.itemNotFound')}`);
      return;
    }

    setLoading(true);
    try {
      let updateData = { title: data.title.trim() };
      
      if (section === 'news') {
        if (!data.description.trim()) {
          error(t('adminHomepage.fillAllFields'));
          return;
        }
        updateData.description = data.description.trim();
      } else if (section === 'events') {
        if (!data.description.trim() || !data.date || !data.location.trim()) {
          error(t('adminHomepage.fillAllFields'));
          return;
        }
        updateData.description = data.description.trim();
        updateData.date = new Date(data.date);
        updateData.location = data.location.trim();
      }

      await updateDoc(doc(db, section, id), updateData);

      // רישום פעולה ב-adminLogs
      const actionType = `edit-${section === 'events' ? 'event' : section}`;
      const targetType = section === 'events' ? 'event' : section;
      await logAdminAction(
        actionType,
        `Updated ${section === 'events' ? 'event' : section} "${itemToEdit.title}" to "${data.title.trim()}"`,
        targetType,
        id
      );

      // Update local state
      if (section === 'news') {
        setNewsList(prev => prev.map(item => 
          item.id === id ? { ...item, ...updateData } : item
        ));
      } else if (section === 'events') {
        setEventsList(prev => prev.map(item => 
          item.id === id ? { ...item, ...updateData } : item
        ));
      } else if (section === 'gallery') {
        setGalleryList(prev => prev.map(item => 
          item.id === id ? { ...item, ...updateData } : item
        ));
      }

      setEditingItems(prev => ({ ...prev, [section]: null }));
      success(t('adminHomepage.itemUpdated', { section: section.charAt(0).toUpperCase() + section.slice(1) }));
    } catch (err) {
      console.error(`Error updating ${section}:`, err);
      error(t('adminHomepage.failedToUpdate', { section }));
    } finally {
      setLoading(false);
    }
  };

  // Sort and filter functions
  const getSortedItems = (items, sortOption) => {
    return [...items].sort((a, b) => {
      if (sortOption === 'alphabetical') {
        return a.title.localeCompare(b.title);
      } else if (sortOption === 'reverse-alphabetical') {
        return b.title.localeCompare(a.title);
      } else if (sortOption === 'newest') {
        const dateA = a.uploadedAt?.toDate ? a.uploadedAt.toDate() : new Date(a.uploadedAt);
        const dateB = b.uploadedAt?.toDate ? b.uploadedAt.toDate() : new Date(b.uploadedAt);
        return dateB - dateA;
      } else if (sortOption === 'oldest') {
        const dateA = a.uploadedAt?.toDate ? a.uploadedAt.toDate() : new Date(a.uploadedAt);
        const dateB = b.uploadedAt?.toDate ? b.uploadedAt.toDate() : new Date(b.uploadedAt);
        return dateA - dateB;
      }
      return 0;
    });
  };

  const getFilteredItems = (items, searchQuery) => {
    if (!searchQuery.trim()) return items;
    return items.filter(item =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.location && item.location.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };

  const formatDate = (date) => {
    if (!date) return '';
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Image viewer functions
  const openImageViewer = (image) => {
    setViewingImage(image);
  };

  const closeImageViewer = () => {
    setViewingImage(null);
  };

  const renderNewsSection = () => (
    <>
      <div className="content-section">
        <h3>{t('adminHomepage.addNewNewsItem')}</h3>
        <form onSubmit={handleNewsSubmit} className="content-form">
          <div className="form-row">
            <div className="input-group">
              <label>{t('adminHomepage.titleRequired')}:</label>
              <input
                type="text"
                value={newsForm.title}
                onChange={(e) => setNewsForm({...newsForm, title: e.target.value})}
                placeholder={t('adminHomepage.enterNewsTitle')}
                className="form-input"
                required
              />
            </div>
            <div className="input-group">
              <label>{t('adminHomepage.imageOptional')}:</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageChange('news', e.target.files[0])}
                className="form-file-input"
              />
            </div>
          </div>

          <div className="input-group">
            <label>{t('adminHomepage.descriptionRequired')}:</label>
            <textarea
              value={newsForm.description}
              onChange={(e) => setNewsForm({...newsForm, description: e.target.value})}
              placeholder={t('adminHomepage.enterNewsDescription')}
              className="form-textarea"
              rows="3"
              required
            />
          </div>

          {imagePreviews.news && (
            <div className="image-preview">
              <h4>{t('adminHomepage.imagePreview')}:</h4>
              <img src={imagePreviews.news} alt="Preview" className="preview-image" />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="submit-btn"
          >
            {loading ? t('adminHomepage.adding') + '...' : t('adminHomepage.addNewsItem')}
          </button>
        </form>
      </div>

      <div className="content-list-section">
        <div className="section-header">
          <h3>{t('adminHomepage.newsItems')} ({newsList.length})</h3>
          <div className="header-controls">
            <input
              type="text"
              placeholder={t('adminHomepage.searchNews')}
              value={searchQueries.news}
              onChange={(e) => setSearchQueries(prev => ({...prev, news: e.target.value}))}
              className="search-input"
            />
            <select 
              value={sortOptions.news} 
              onChange={(e) => setSortOptions(prev => ({...prev, news: e.target.value}))}
              className="sort-select"
            >
              <option value="newest">{t('adminHomepage.newestFirst')}</option>
              <option value="oldest">{t('adminHomepage.oldestFirst')}</option>
              <option value="alphabetical">{t('adminHomepage.alphabetical')}</option>
              <option value="reverse-alphabetical">{t('adminHomepage.reverseAlphabetical')}</option>
            </select>
          </div>
        </div>

        <div className="content-grid">
          {getSortedItems(getFilteredItems(newsList, searchQueries.news), sortOptions.news).length === 0 ? (
            <div className="empty-state">
              <h4>{t('adminHomepage.noNewsItemsFound')}</h4>
              <p>{searchQueries.news ? t('adminHomepage.noNewsMatchSearch') : t('adminHomepage.noNewsAdded')}</p>
            </div>
          ) : (
            getSortedItems(getFilteredItems(newsList, searchQueries.news), sortOptions.news).map(item => (
              <div key={item.id} className={`content-card ${editingItems.news === item.id ? 'editing' : ''}`}>
                {item.imageUrl && (
                  <div className="content-image">
                    <img src={item.imageUrl} alt={item.title} className="content-thumbnail" />
                  </div>
                )}
                <div className="content-info">
                  {editingItems.news === item.id ? (
                    <div className="edit-form">
                      <input
                        type="text"
                        value={editData.news.title}
                        onChange={(e) => setEditData(prev => ({ 
                          ...prev, 
                          news: { ...prev.news, title: e.target.value } 
                        }))}
                        className="edit-input"
                        placeholder={t('adminHomepage.editTitle')}
                      />
                      <textarea
                        value={editData.news.description}
                        onChange={(e) => setEditData(prev => ({ 
                          ...prev, 
                          news: { ...prev.news, description: e.target.value } 
                        }))}
                        className="edit-textarea"
                        rows="2"
                        placeholder={t('adminHomepage.editDescription')}
                      />
                      <div className="edit-actions">
                        <button 
                          onClick={() => handleEditSave('news', item.id)}
                          className="save-btn"
                          disabled={loading}
                        >
                          {t('common.save')}
                        </button>
                        <button 
                          onClick={() => setEditingItems(prev => ({ ...prev, news: null }))}
                          className="cancel-btn"
                        >
                          {t('common.cancel')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h4 className="content-title">{item.title}</h4>
                      <div className="upload-date">📅 {formatDate(item.uploadedAt)}</div>
                      <p className="content-description">{item.description}</p>
                      <div className="content-actions">
                        <button 
                          className="edit-btn" 
                          onClick={() => startEditing('news', item)}
                        >
                          {t('common.edit')}
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => handleDelete('news', item.id, item.imageUrl)}
                          disabled={loading}
                        >
                          {t('common.delete')}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );

  const renderEventsSection = () => (
    <>
      <div className="content-section">
        <h3>{t('adminHomepage.addNewEvent')}</h3>
        <form onSubmit={handleEventsSubmit} className="content-form">
          <div className="form-row">
            <div className="input-group">
              <label>{t('adminHomepage.titleRequired')}:</label>
              <input
                type="text"
                value={eventsForm.title}
                onChange={(e) => setEventsForm({...eventsForm, title: e.target.value})}
                placeholder={t('adminHomepage.enterEventTitle')}
                className="form-input"
                required
              />
            </div>
            <div className="input-group">
              <label>{t('adminHomepage.dateRequired')}:</label>
              <input
                type="date"
                value={eventsForm.date}
                onChange={(e) => setEventsForm({...eventsForm, date: e.target.value})}
                className="form-input"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="input-group">
              <label>{t('adminHomepage.locationRequired')}:</label>
              <input
                type="text"
                value={eventsForm.location}
                onChange={(e) => setEventsForm({...eventsForm, location: e.target.value})}
                placeholder={t('adminHomepage.enterEventLocation')}
                className="form-input"
                required
              />
            </div>
            <div className="input-group">
              <label>{t('adminHomepage.eventTypeRequired')}:</label>
              <select
                value={eventsForm.type}
                onChange={(e) => setEventsForm({ ...eventsForm, type: e.target.value })}
                className="form-input"
                required
              >
                <option value="">{t('adminHomepage.selectType')}</option>
                <option value="tournament">{t('adminHomepage.tournament')}</option>
                <option value="course">{t('adminHomepage.course')}</option>
                <option value="workshop">{t('adminHomepage.workshop')}</option>
                <option value="other">{t('adminHomepage.other')}</option>
              </select>
            </div>

            <div className="input-group">
              <label>{t('adminHomepage.imageOptional')}:</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageChange('events', e.target.files[0])}
                className="form-file-input"
              />
            </div>
          </div>

          <div className="input-group">
            <label>{t('adminHomepage.descriptionRequired')}:</label>
            <textarea
              value={eventsForm.description}
              onChange={(e) => setEventsForm({...eventsForm, description: e.target.value})}
              placeholder={t('adminHomepage.enterEventDescription')}
              className="form-textarea"
              rows="3"
              required
            />
          </div>

          {imagePreviews.events && (
            <div className="image-preview">
              <h4>{t('adminHomepage.imagePreview')}:</h4>
              <img src={imagePreviews.events} alt="Preview" className="preview-image" />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="submit-btn"
          >
            {loading ? t('adminHomepage.adding') + '...' : t('adminHomepage.addEvent')}
          </button>
        </form>
      </div>

      <div className="content-list-section">
        <div className="section-header">
          <h3>{t('adminHomepage.events')} ({eventsList.length})</h3>
          <div className="header-controls">
            <input
              type="text"
              placeholder={t('adminHomepage.searchEvents')}
              value={searchQueries.events}
              onChange={(e) => setSearchQueries(prev => ({...prev, events: e.target.value}))}
              className="search-input"
            />
            <select 
              value={sortOptions.events} 
              onChange={(e) => setSortOptions(prev => ({...prev, events: e.target.value}))}
              className="sort-select"
            >
              <option value="newest">{t('adminHomepage.newestFirst')}</option>
              <option value="oldest">{t('adminHomepage.oldestFirst')}</option>
              <option value="alphabetical">{t('adminHomepage.alphabetical')}</option>
              <option value="reverse-alphabetical">{t('adminHomepage.reverseAlphabetical')}</option>
            </select>
          </div>
        </div>

        <div className="content-grid">
          {getSortedItems(getFilteredItems(eventsList, searchQueries.events), sortOptions.events).length === 0 ? (
            <div className="empty-state">
              <h4>{t('adminHomepage.noEventsFound')}</h4>
              <p>{searchQueries.events ? t('adminHomepage.noEventsMatchSearch') : t('adminHomepage.noEventsAdded')}</p>
            </div>
          ) : (
            getSortedItems(getFilteredItems(eventsList, searchQueries.events), sortOptions.events).map(item => (
              <div key={item.id} className={`content-card ${editingItems.events === item.id ? 'editing' : ''}`}>
                {item.imageUrl && (
                  <div className="content-image">
                    <img src={item.imageUrl} alt={item.title} className="content-thumbnail" />
                  </div>
                )}
                <div className="content-info">
                  {editingItems.events === item.id ? (
                    <div className="edit-form">
                      <input
                        type="text"
                        value={editData.events.title}
                        onChange={(e) => setEditData(prev => ({ 
                          ...prev, 
                          events: { ...prev.events, title: e.target.value } 
                        }))}
                        className="edit-input"
                        placeholder={t('adminHomepage.editTitle')}
                      />
                      <input
                        type="date"
                        value={editData.events.date}
                        onChange={(e) => setEditData(prev => ({ 
                          ...prev, 
                          events: { ...prev.events, date: e.target.value } 
                        }))}
                        className="edit-input"
                      />
                      <input
                        type="text"
                        value={editData.events.location}
                        onChange={(e) => setEditData(prev => ({ 
                          ...prev, 
                          events: { ...prev.events, location: e.target.value } 
                        }))}
                        className="edit-input"
                        placeholder={t('adminHomepage.editLocation')}
                      />
                      <textarea
                        value={editData.events.description}
                        onChange={(e) => setEditData(prev => ({ 
                          ...prev, 
                          events: { ...prev.events, description: e.target.value } 
                        }))}
                        className="edit-textarea"
                        rows="2"
                        placeholder={t('adminHomepage.editDescription')}
                      />
                      <div className="edit-actions">
                        <button 
                          onClick={() => handleEditSave('events', item.id)}
                          className="save-btn"
                          disabled={loading}
                        >
                          {t('common.save')}
                        </button>
                        <button 
                          onClick={() => setEditingItems(prev => ({ ...prev, events: null }))}
                          className="cancel-btn"
                        >
                          {t('common.cancel')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h4 className="content-title">{item.title}</h4>
                      <div className="event-meta">
                        <p className="event-date">📅 {formatDate(item.date)}</p>
                        <p className="event-location">📍 {item.location}</p>
                        <p className="upload-date">⬆️ {t('adminHomepage.uploaded')}: {formatDate(item.uploadedAt)}</p>
                      </div>
                      <p className="content-description">{item.description}</p>
                      <div className="content-actions">
                        <button 
                          className="edit-btn" 
                          onClick={() => startEditing('events', item)}
                        >
                          {t('common.edit')}
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => handleDelete('events', item.id, item.imageUrl)}
                          disabled={loading}
                        >
                          {t('common.delete')}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );

  const renderGallerySection = () => (
    <>
      <div className="content-section">
        <h3>{t('adminHomepage.addNewGalleryImage')}</h3>
        <form onSubmit={handleGallerySubmit} className="content-form">
          <div className="form-row">
            <div className="input-group">
              <label>{t('adminHomepage.titleRequired')}:</label>
              <input
                type="text"
                value={galleryForm.title}
                onChange={(e) => setGalleryForm({...galleryForm, title: e.target.value})}
                placeholder={t('adminHomepage.enterImageTitle')}
                className="form-input"
                required
              />
            </div>
            <div className="input-group">
              <label>{t('adminHomepage.imageRequired')}:</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageChange('gallery', e.target.files[0])}
                className="form-file-input"
                required
              />
            </div>
          </div>

          {imagePreviews.gallery && (
            <div className="image-preview">
              <h4>{t('adminHomepage.imagePreview')}:</h4>
              <img src={imagePreviews.gallery} alt="Preview" className="preview-image" />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="submit-btn"
          >
            {loading ? t('adminHomepage.adding') + '...' : t('adminHomepage.addGalleryImage')}
          </button>
        </form>
      </div>

      <div className="content-list-section">
        <div className="section-header">
          <h3>{t('adminHomepage.galleryImages')} ({galleryList.length})</h3>
          <div className="header-controls">
            <input
              type="text"
              placeholder={t('adminHomepage.searchGallery')}
              value={searchQueries.gallery}
              onChange={(e) => setSearchQueries(prev => ({...prev, gallery: e.target.value}))}
              className="search-input"
            />
            <select 
              value={sortOptions.gallery} 
              onChange={(e) => setSortOptions(prev => ({...prev, gallery: e.target.value}))}
              className="sort-select"
            >
              <option value="newest">{t('adminHomepage.newestFirst')}</option>
              <option value="oldest">{t('adminHomepage.oldestFirst')}</option>
              <option value="alphabetical">{t('adminHomepage.alphabetical')}</option>
              <option value="reverse-alphabetical">{t('adminHomepage.reverseAlphabetical')}</option>
            </select>
          </div>
        </div>

        <div className="gallery-grid">
          {getSortedItems(getFilteredItems(galleryList, searchQueries.gallery), sortOptions.gallery).length === 0 ? (
            <div className="empty-state">
              <h4>{t('adminHomepage.noGalleryImagesFound')}</h4>
              <p>{searchQueries.gallery ? t('adminHomepage.noImagesMatchSearch') : t('adminHomepage.noGalleryImagesAdded')}</p>
            </div>
          ) : (
            getSortedItems(getFilteredItems(galleryList, searchQueries.gallery), sortOptions.gallery).map(item => (
              <div key={item.id} className={`gallery-card ${editingItems.gallery === item.id ? 'editing' : ''}`}>
                <div className="gallery-image">
                  <img src={item.imageUrl} alt={item.title} className="gallery-thumbnail" />
                </div>
                <div className="gallery-info">
                  {editingItems.gallery === item.id ? (
                    <div className="edit-form">
                      <input
                        type="text"
                        value={editData.gallery.title}
                        onChange={(e) => setEditData(prev => ({ 
                          ...prev, 
                          gallery: { ...prev.gallery, title: e.target.value } 
                        }))}
                        className="edit-input"
                        placeholder={t('adminHomepage.editTitle')}
                      />
                      <div className="edit-actions">
                        <button 
                          onClick={() => handleEditSave('gallery', item.id)}
                          className="save-btn"
                          disabled={loading}
                        >
                          {t('common.save')}
                        </button>
                        <button 
                          onClick={() => setEditingItems(prev => ({ ...prev, gallery: null }))}
                          className="cancel-btn"
                        >
                          {t('common.cancel')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h4 className="gallery-title">{item.title}</h4>
                      <div className="upload-date">📅 {formatDate(item.uploadedAt)}</div>
                      <div className="gallery-actions">
                        <button 
                          className="view-btn" 
                          onClick={() => openImageViewer(item)}
                        >
                          {t('adminHomepage.view')}
                        </button>
                        <button 
                          className="edit-btn" 
                          onClick={() => startEditing('gallery', item)}
                        >
                          {t('common.edit')}
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => handleDelete('gallery', item.id, item.imageUrl)}
                          disabled={loading}
                        >
                          {t('common.delete')}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );

  return (
    <div className="homepage-editor-container">
      {/* Header Section */}
      <div className="homepage-header">
        <div className="homepage-stats">
          <div className="stat-card news">
            <div className="stat-number">{newsList.length}</div>
            <div className="stat-label">{t('adminHomepage.newsItems')}</div>
          </div>
          <div className="stat-card events">
            <div className="stat-number">{eventsList.length}</div>
            <div className="stat-label">{t('adminHomepage.events')}</div>
          </div>
          <div className="stat-card gallery">
            <div className="stat-number">{galleryList.length}</div>
            <div className="stat-label">{t('adminHomepage.galleryImages')}</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="section-navigation">
        <button 
          className={`nav-tab ${activeSection === 'news' ? 'active' : ''}`}
          onClick={() => setActiveSection('news')}
        >
          📰 {t('adminHomepage.newsManagement')}
        </button>
        <button 
          className={`nav-tab ${activeSection === 'events' ? 'active' : ''}`}
          onClick={() => setActiveSection('events')}
        >
          📅 {t('adminHomepage.eventsManagement')}
        </button>
        <button 
          className={`nav-tab ${activeSection === 'gallery' ? 'active' : ''}`}
          onClick={() => setActiveSection('gallery')}
        >
          🖼️ {t('adminHomepage.galleryManagement')}
        </button>
      </div>

      {/* Content Sections */}
      {activeSection === 'news' && renderNewsSection()}
      {activeSection === 'events' && renderEventsSection()}
      {activeSection === 'gallery' && renderGallerySection()}

      {/* Image Viewer Modal */}
      {viewingImage && (
        <div className="image-modal-overlay" onClick={closeImageViewer}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="image-modal-header">
              <h3>{viewingImage.title}</h3>
              <button className="close-modal-btn" onClick={closeImageViewer}>
                ✕
              </button>
            </div>
            <div className="image-modal-body">
              <img 
                src={viewingImage.imageUrl} 
                alt={viewingImage.title} 
                className="modal-image" 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHomepageEditor;