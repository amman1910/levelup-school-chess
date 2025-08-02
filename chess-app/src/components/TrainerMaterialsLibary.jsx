import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next'; // הוספת useTranslation
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../firebase';
import './TrainerMaterialsLibary.css';

const TrainerMaterialsLibrary = () => {
  const { t } = useTranslation(); // add hook for translating
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [searchFilter, setSearchFilter] = useState('all'); // topic, date, description, all
  const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month
  const [currentUser, setCurrentUser] = useState(null);

  // Get current user
  useEffect(() => {
    const loggedInUser = localStorage.getItem('user');
    if (loggedInUser) {
      const userData = JSON.parse(loggedInUser);
      // Extract the document ID from uid for materials access
      if (userData.uid && !userData.id) {
        userData.id = userData.uid;
      }
      setCurrentUser(userData);
    }
  }, []);

  // Fetch materials that the trainer has access to
  useEffect(() => {
    if (!currentUser?.id) return;

    console.log('Fetching materials for trainer ID:', currentUser.id);

    const q = query(
      collection(db, 'learningMaterials'),
      where('trainerIdAccess', 'array-contains', currentUser.id),
      orderBy('uploadedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const materialsData = [];
      querySnapshot.forEach((doc) => {
        materialsData.push({ id: doc.id, ...doc.data() });
      });
      
      console.log('Found materials:', materialsData.length);
      setMaterials(materialsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching materials:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Helper function to check if date matches filter
  const matchesDateFilter = (uploadedAt) => {
    if (dateFilter === 'all' || !uploadedAt) return true;
    
    const now = new Date();
    const materialDate = uploadedAt.toDate();
    
    switch (dateFilter) {
      case 'today':
        return materialDate.toDateString() === now.toDateString();
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return materialDate >= weekAgo;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return materialDate >= monthAgo;
      default:
        return true;
    }
  };

  // Filter materials based on search, type, and date
  const filteredMaterials = materials.filter((material) => {
    // Type filter
    const matchesType = filterType === 'all' || material.type === filterType;
    
    // Date filter
    const matchesDate = matchesDateFilter(material.uploadedAt);
    
    // Search filter
    let matchesSearch = true;
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      
      switch (searchFilter) {
        case 'topic':
          matchesSearch = material.title?.toLowerCase().includes(searchLower);
          break;
        case 'description':
          matchesSearch = material.description?.toLowerCase().includes(searchLower);
          break;
        case 'all':
        default:
          matchesSearch = 
            material.title?.toLowerCase().includes(searchLower) ||
            material.description?.toLowerCase().includes(searchLower);
          break;
      }
    }
    
    return matchesType && matchesDate && matchesSearch;
  });

  const handleOpenFile = (fileUrl, title) => {
    if (fileUrl) {
      window.open(fileUrl, '_blank');
    } else {
      alert(t('trainerMaterials.fileNotAvailable'));
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return t('trainerMaterials.unknown');
    return timestamp.toDate().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'presentation':
        return '📊';
      case 'document':
        return '📄';
      case 'video':
        return '🎥';
      case 'image':
        return '🖼️';
      default:
        return '📎';
    }
  };

  if (loading) {
    return <div className="loading">{t('trainerMaterials.loadingMaterials')}</div>;
  }

  return (
    <div className="materials-library">
      <div className="materials-header">
        <div className="header-content">
          <h1>{t('trainerMaterials.materialsLibrary')}</h1>
          <p>{t('trainerMaterials.accessMaterials')}</p>
        </div>
      </div>

      <div className="materials-controls">
        <div className="search-filter-container">
          <div className="search-box">
            <input
              type="text"
              placeholder={t('trainerMaterials.searchMaterials')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>

          <select
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="filter-select search-filter-select"
          >
            <option value="all">{t('trainerMaterials.searchAll')}</option>
            <option value="topic">{t('trainerMaterials.searchByTopic')}</option>
            <option value="description">{t('trainerMaterials.searchByDescription')}</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select type-filter-select"
          >
            <option value="all">{t('trainerMaterials.allTypes')}</option>
            <option value="presentation">{t('trainerMaterials.presentations')}</option>
            <option value="document">{t('trainerMaterials.documents')}</option>
            <option value="video">{t('trainerMaterials.videos')}</option>
            <option value="image">{t('trainerMaterials.images')}</option>
          </select>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="filter-select date-filter-select"
          >
            <option value="all">{t('trainerMaterials.allDates')}</option>
            <option value="today">{t('trainerMaterials.today')}</option>
            <option value="week">{t('trainerMaterials.thisWeek')}</option>
            <option value="month">{t('trainerMaterials.thisMonth')}</option>
          </select>
        </div>

        <div className="materials-count">
          <span>{filteredMaterials.length} {t('trainerMaterials.materialsFound')}</span>
        </div>
      </div>

      {/* Active Filters Display */}
      {(searchTerm || filterType !== 'all' || dateFilter !== 'all' || searchFilter !== 'all') && (
        <div className="active-filters">
          <span className="filters-label">{t('trainerMaterials.activeFilters')}</span>
          {searchTerm && (
            <span className="filter-chip">
              {t('trainerMaterials.search')}: "{searchTerm}"
              <button onClick={() => setSearchTerm('')} className="remove-filter">×</button>
            </span>
          )}
          {filterType !== 'all' && (
            <span className="filter-chip">
              {t('trainerMaterials.type')}: {filterType}
              <button onClick={() => setFilterType('all')} className="remove-filter">×</button>
            </span>
          )}
          {dateFilter !== 'all' && (
            <span className="filter-chip">
              {t('trainerMaterials.date')}: {dateFilter}
              <button onClick={() => setDateFilter('all')} className="remove-filter">×</button>
            </span>
          )}
          {searchFilter !== 'all' && (
            <span className="filter-chip">
              {t('trainerMaterials.searchIn')}: {searchFilter}
              <button onClick={() => setSearchFilter('all')} className="remove-filter">×</button>
            </span>
          )}
          <button 
            onClick={() => {
              setSearchTerm('');
              setFilterType('all');
              setDateFilter('all');
              setSearchFilter('all');
            }}
            className="clear-all-filters"
          >
            {t('trainerMaterials.clearAll')}
          </button>
        </div>
      )}

      {filteredMaterials.length === 0 ? (
        <div className="no-materials">
          <div className="no-materials-icon">📚</div>
          <h3>{t('trainerMaterials.noMaterialsFound')}</h3>
          <p>
            {searchTerm || filterType !== 'all' || dateFilter !== 'all'
              ? t('trainerMaterials.adjustCriteria')
              : t('trainerMaterials.noAccess')}
          </p>
        </div>
      ) : (
        <div className="materials-grid">
          {filteredMaterials.map((material) => (
            <div key={material.id} className="material-card">
              <div className="material-header">
                <div className="material-icon">
                  {getFileIcon(material.type)}
                </div>
                <div className="material-type">
                  {material.type || 'file'}
                </div>
              </div>

              <div className="material-content">
                <h3 className="material-title">{material.title}</h3>
                <p className="material-description">{material.description}</p>
                
                <div className="material-meta">
                  <div className="upload-date">
                    <span className="meta-label">{t('trainerMaterials.uploaded')}:</span>
                    <span className="meta-value">{formatDate(material.uploadedAt)}</span>
                  </div>
                </div>
              </div>

              <div className="material-actions">
                <button
                  onClick={() => handleOpenFile(material.fileUrl, material.title)}
                  className="open-file-btn"
                  disabled={!material.fileUrl}
                >
                  <span className="btn-icon">📂</span>
                  {t('trainerMaterials.openFile')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrainerMaterialsLibrary;