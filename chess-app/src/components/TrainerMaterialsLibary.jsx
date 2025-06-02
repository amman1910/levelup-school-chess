import React, { useEffect, useState } from 'react';
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
      alert('File URL not available');
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
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
    return <div className="loading">Loading materials...</div>;
  }

  return (
    <div className="materials-library">
      <div className="materials-header">
        <div className="header-content">
          <h1>Materials Library</h1>
          <p>Access your authorized learning materials and presentations</p>
        </div>
      </div>

      <div className="materials-controls">
        <div className="search-filter-container">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search materials..."
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
            <option value="all">Search All</option>
            <option value="topic">Search by Topic</option>
            <option value="description">Search by Description</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select type-filter-select"
          >
            <option value="all">All Types</option>
            <option value="presentation">Presentations</option>
            <option value="document">Documents</option>
            <option value="video">Videos</option>
            <option value="image">Images</option>
          </select>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="filter-select date-filter-select"
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>

        <div className="materials-count">
          <span>{filteredMaterials.length} materials found</span>
        </div>
      </div>

      {/* Active Filters Display */}
      {(searchTerm || filterType !== 'all' || dateFilter !== 'all' || searchFilter !== 'all') && (
        <div className="active-filters">
          <span className="filters-label">Active Filters:</span>
          {searchTerm && (
            <span className="filter-chip">
              Search: "{searchTerm}"
              <button onClick={() => setSearchTerm('')} className="remove-filter">×</button>
            </span>
          )}
          {filterType !== 'all' && (
            <span className="filter-chip">
              Type: {filterType}
              <button onClick={() => setFilterType('all')} className="remove-filter">×</button>
            </span>
          )}
          {dateFilter !== 'all' && (
            <span className="filter-chip">
              Date: {dateFilter}
              <button onClick={() => setDateFilter('all')} className="remove-filter">×</button>
            </span>
          )}
          {searchFilter !== 'all' && (
            <span className="filter-chip">
              Search in: {searchFilter}
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
            Clear All
          </button>
        </div>
      )}

      {filteredMaterials.length === 0 ? (
        <div className="no-materials">
          <div className="no-materials-icon">📚</div>
          <h3>No materials found</h3>
          <p>
            {searchTerm || filterType !== 'all' || dateFilter !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : 'You don\'t have access to any materials yet. Contact your administrator.'}
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
                    <span className="meta-label">Uploaded:</span>
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
                  Open File
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