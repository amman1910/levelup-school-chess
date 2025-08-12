import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next'; 
import { db, storage } from '../firebase';
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import './ManageMaterialsAdmin.css';

const ManageMaterialsAdmin = ({ loading, setLoading, error, success }) => {
  const { t } = useTranslation(); 
  
  const [users, setUsers] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [materialList, setMaterialList] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [sortOption, setSortOption] = useState('newest');
  const [viewerFilter, setViewerFilter] = useState('');
  const [pendingUpdates, setPendingUpdates] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMaterials, setFilteredMaterials] = useState([]);
  const [typeFilter, setTypeFilter] = useState('');
  
  // Form data for new materials
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: ''
  });

  // Edit data for existing materials
  const [editData, setEditData] = useState({
    title: '',
    description: '',
    type: '',
    trainerIdAccess: []
  });

  const logAdminAction = async (actionType, description, targetId = null) => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const adminName = `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.email || 'Unknown Admin';

      const logEntry = {
        actionType,
        adminName,
        description,
        targetType: 'material',
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

  // Get trainers from users
  const trainers = users.filter(user => user.role === 'trainer').map((trainer) => ({
    id: trainer.id,
    name: `${trainer.firstName || ''} ${trainer.lastName || ''}`.trim() || trainer.email
  })).sort((a, b) => a.name.localeCompare(b.name));

  const materialTypes = [
    { value: '', label: t('adminMaterials.selectTypeOptional') },
    { value: 'Presentation', label: t('adminMaterials.presentation') },
    { value: 'Document', label: t('adminMaterials.document') },
    { value: 'Image', label: t('adminMaterials.image') },
    { value: 'Video', label: t('adminMaterials.video') }
  ];

  // Fetch users from database
  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersList = [];
      querySnapshot.forEach((doc) => {
        usersList.push({ id: doc.id, ...doc.data() });
      });
      setUsers(usersList);
    } catch (err) {
      console.error('Error fetching users:', err);
      error(t('adminMaterials.failedToLoadUsers'));
    }
  };

  // Fetch materials from database
  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'learningMaterials'));
      const materials = await Promise.all(snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        
        return {
          id: docSnap.id,
          title: data.title,
          description: data.description || '',
          type: data.type || '',
          fileUrl: data.fileUrl,
          trainerIdAccess: data.trainerIdAccess || [],
          uploadedAt: data.uploadedAt
        };
      }));

      setMaterialList(materials);
    } catch (err) {
      console.error('Failed to fetch materials:', err);
      error(t('adminMaterials.failedToLoadMaterials'));
    } finally {
      setLoading(false);
    }
  };

  // Format date function
  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    
    let date;
    if (timestamp.toDate) {
      // Firestore Timestamp
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      // JavaScript Date
      date = timestamp;
    } else {
      // String or other format
      date = new Date(timestamp);
    }
    
    if (isNaN(date.getTime())) return '-';
    
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Filter materials based on search query and type filter
  useEffect(() => {
    let filtered = materialList;
    
    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(material =>
        material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        material.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        material.type.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filter by type
    if (typeFilter) {
      filtered = filtered.filter(material => material.type === typeFilter);
    }
    
    setFilteredMaterials(filtered);
  }, [materialList, searchQuery, typeFilter]);

  // Load data on component mount
  useEffect(() => {
    fetchUsers();
    fetchMaterials();
  }, []);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  };

  const handleUserToggle = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      error(t('adminMaterials.pleaseSelectFiles'));
      return;
    }

    if (!formData.title.trim()) {
      error(t('adminMaterials.pleaseEnterTitle'));
      return;
    }

    setLoading(true);

    try {
      const uploadPromises = selectedFiles.map(async (file) => {
        const path = `learningMaterials/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, path);
        const snapshot = await uploadBytes(storageRef, file);
        const fileUrl = await getDownloadURL(snapshot.ref);

        const docRef = await addDoc(collection(db, 'learningMaterials'), {
          title: formData.title.trim(),
          description: formData.description.trim() || '',
          type: formData.type || '',
          fileUrl,
          trainerIdAccess: selectedUsers,
          uploadedAt: new Date(),
        });

        await logAdminAction(
          'add-material',
          `Added a new material with the title "${formData.title.trim()}"${formData.type ? ` of type ${formData.type}` : ''}`,
          docRef.id
        );

        return {
          id: docRef.id,
          title: formData.title.trim(),
          description: formData.description.trim() || '',
          type: formData.type || '',
          fileUrl,
          trainerIdAccess: selectedUsers,
          uploadedAt: new Date()
        };
      });

      const newMaterials = await Promise.all(uploadPromises);
      setMaterialList((prev) => [...prev, ...newMaterials]);

      // Reset form
      setSelectedFiles([]);
      setSelectedUsers([]);
      setFormData({ title: '', description: '', type: '' });
      
      // Reset file input
      const fileInput = document.querySelector('.materials-file-input');
      if (fileInput) fileInput.value = '';
      
      success(t('adminMaterials.uploadSuccess', { count: newMaterials.length }));
    } catch (err) {
      console.error('Error uploading:', err);
      error(t('adminMaterials.uploadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const toggleEditTrainer = (userId) => {
    setEditData(prev => {
      const isTrainer = prev.trainerIdAccess.includes(userId);
      const updatedTrainers = isTrainer
        ? prev.trainerIdAccess.filter(id => id !== userId)
        : [...prev.trainerIdAccess, userId];

      return { ...prev, trainerIdAccess: updatedTrainers };
    });
  };

  const startEditing = (material) => {
    setEditingId(material.id);
    setEditData({
      title: material.title,
      description: material.description || '',
      type: material.type || '',
      trainerIdAccess: [...material.trainerIdAccess]
    });
  };

  const handleSaveEdit = async (materialId) => {
    if (!editData.title.trim()) {
      error(t('adminMaterials.pleaseEnterTitle'));
      return;
    }

    const material = materialList.find(m => m.id === materialId);
    if (!material) return;

    setLoading(true);
    try {
      const materialRef = doc(db, 'learningMaterials', materialId);
      const updateData = {
        title: editData.title.trim(),
        description: editData.description.trim(),
        type: editData.type,
        trainerIdAccess: editData.trainerIdAccess
      };
      
      await updateDoc(materialRef, updateData);

      await logAdminAction(
        'edit-material',
        `Updated material "${material.title}" to "${editData.title.trim()}" with access for ${editData.trainerIdAccess.length} trainer${editData.trainerIdAccess.length !== 1 ? 's' : ''}`,
        materialId
      );

      setMaterialList(prev => prev.map(m => 
        m.id === materialId ? { ...m, ...updateData } : m
      ));
      
      setEditingId(null);
      setEditData({ title: '', description: '', type: '', trainerIdAccess: [] });
      
      success(t('adminMaterials.materialUpdatedSuccessfully'));
    } catch (err) {
      console.error('Failed to save changes:', err);
      error(t('adminMaterials.failedToSaveChanges'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({ title: '', description: '', type: '', trainerIdAccess: [] });
  };

  const handleDelete = async (id, fileUrl) => {
    const material = materialList.find(m => m.id === id);
    if (!material) {
      error(t('adminMaterials.materialNotFound'));
      return;
    }

    if (!window.confirm(t('adminMaterials.confirmDeleteMaterial', { title: material.title }))) return;

    setLoading(true);
    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'learningMaterials', id));

      // Try to delete from storage if possible
      if (fileUrl) {
        try {
          const fileRef = ref(storage, fileUrl);
          await deleteObject(fileRef);
        } catch (storageErr) {
          console.warn('Could not delete file from storage:', storageErr);
        }
      }

      await logAdminAction(
        'delete-material',
        `Deleted material "${material.title}"${material.type ? ` of type ${material.type}` : ''}`,
        id
      );

      setMaterialList(prev => prev.filter(m => m.id !== id));
      success(t('adminMaterials.materialDeletedSuccessfully'));
    } catch (err) {
      console.error('Error deleting material:', err);
      error(t('adminMaterials.failedToDeleteMaterial'));
    } finally {
      setLoading(false);
    }
  };

  const getSortedMaterials = (materials) => {
    return [...materials].sort((a, b) => {
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

  const clearSearch = () => {
    setSearchQuery('');
    setTypeFilter('');
  };

  const getFileIcon = (type, fileName) => {
    if (type === 'Presentation') return '📊';
    if (type === 'Document') return '📄';
    if (type === 'Image') return '🖼️';
    if (type === 'Video') return '🎥';
    
    // Fallback based on file extension
    const ext = fileName?.split('.').pop()?.toLowerCase();
    if (['pdf'].includes(ext)) return '📄';
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return '🖼️';
    if (['mp4', 'avi', 'mov'].includes(ext)) return '🎥';
    if (['ppt', 'pptx'].includes(ext)) return '📊';
    
    return '📁';
  };

  const sortedMaterials = getSortedMaterials(filteredMaterials);

  return (
    <div className="materials-admin-container">
      {/* Header Section */}
      <div className="materials-header">
        <div className="materials-stats">
          <div className="stat-card total">
            <div className="stat-number">{materialList.length}</div>
            <div className="stat-label">{t('adminMaterials.totalMaterials')}</div>
          </div>
          <div className="stat-card trainers">
            <div className="stat-number">{trainers.length}</div>
            <div className="stat-label">{t('adminMaterials.availableTrainers')}</div>
          </div>
        </div>
      </div>

      {/* Upload Section */}
      <div className="materials-upload-section">
        <h3>{t('adminMaterials.uploadNewMaterials')}</h3>
        <div className="upload-area">
          <div className="form-row">
            <div className="input-group">
              <label htmlFor="title">{t('adminMaterials.titleRequired')}:</label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={t('adminMaterials.enterMaterialTitle')}
                className="form-input"
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="type">{t('adminMaterials.type')}:</label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="form-select"
              >
                {materialTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="description">{t('adminMaterials.description')}:</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t('adminMaterials.enterMaterialDescription')}
              className="form-textarea"
              rows="3"
            />
          </div>

          <div className="input-group">
            <label htmlFor="files">{t('adminMaterials.files')}:</label>
            <input
              id="files"
              type="file"
              multiple
              onChange={handleFileChange}
              className="materials-file-input"
            />
          </div>
          
          {selectedFiles.length > 0 && (
            <>
              <div className="selected-files-preview">
                <h4>{t('adminMaterials.selectedFiles')}:</h4>
                <div className="files-list">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="file-item">
                      <span className="file-icon">{getFileIcon('', file.name)}</span>
                      <span className="file-name">{file.name}</span>
                      <span className="file-size">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="viewer-selection">
                <h4>{t('adminMaterials.selectTrainersWithAccess')}:</h4>
                <div className="viewers-grid">
                  {trainers.map(user => (
                    <label key={user.id} className="viewer-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleUserToggle(user.id)}
                      />
                      <span>{user.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button 
                onClick={handleUpload} 
                disabled={loading || !formData.title.trim()}
                className="upload-btn"
              >
                {loading ? t('adminMaterials.uploading') + '...' : t('adminMaterials.uploadFiles', { count: selectedFiles.length })}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Materials List */}
      <div className="materials-list-section">
        <div className="section-header">
          <h3>{t('adminMaterials.materialsLibrary', { count: sortedMaterials.length })}</h3>
          <div className="header-controls">
            <input
              type="text"
              placeholder={t('adminMaterials.searchMaterials')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <select 
              value={typeFilter} 
              onChange={(e) => setTypeFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">{t('adminMaterials.allTypes')}</option>
              <option value="Presentation">{t('adminMaterials.presentations')}</option>
              <option value="Document">{t('adminMaterials.documents')}</option>
              <option value="Image">{t('adminMaterials.images')}</option>
              <option value="Video">{t('adminMaterials.videos')}</option>
            </select>
            <select 
              value={sortOption} 
              onChange={(e) => setSortOption(e.target.value)}
              className="sort-select"
            >
              <option value="newest">{t('adminMaterials.newestFirst')}</option>
              <option value="oldest">{t('adminMaterials.oldestFirst')}</option>
              <option value="alphabetical">{t('adminMaterials.alphabetical')}</option>
              <option value="reverse-alphabetical">{t('adminMaterials.reverseAlphabetical')}</option>
            </select>
          </div>
        </div>

        {(searchQuery || typeFilter) && (
          <div className="search-results-info">
            {filteredMaterials.length === 0 
              ? t('adminMaterials.noMaterialsMatchCriteria')
              : t('adminMaterials.foundMaterials', { count: filteredMaterials.length })
            }
          </div>
        )}
        
        {sortedMaterials.length === 0 ? (
          <div className="empty-state">
            {(searchQuery || typeFilter) ? (
              <>
                <h4>{t('adminMaterials.noMaterialsFound')}</h4>
                <p>{t('adminMaterials.noMaterialsMatchSearch')}</p>
              </>
            ) : (
              <>
                <h4>{t('adminMaterials.noMaterialsUploaded')}</h4>
                <p>{t('adminMaterials.uploadFirstMaterial')}</p>
              </>
            )}
          </div>
        ) : (
          <div className="materials-grid">
            {sortedMaterials.map(material => (
              <div
                key={material.id}
                className={`material-card ${editingId === material.id ? 'editing' : ''}`}
              >
                <div className="material-header">
                  <div className="material-icon">
                    {getFileIcon(material.type, material.title)}
                  </div>
                  {material.type && (
                    <span className="material-type-badge">{material.type}</span>
                  )}
                </div>

                <div className="material-info">
                  {editingId === material.id ? (
                    <div className="edit-form">
                      <div className="edit-row">
                        <div className="edit-group">
                          <label>{t('adminMaterials.title')}:</label>
                          <input
                            type="text"
                            value={editData.title}
                            onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                            className="edit-input"
                            placeholder={t('adminMaterials.materialTitle')}
                          />
                        </div>
                        <div className="edit-group">
                          <label>{t('adminMaterials.type')}:</label>
                          <select
                            value={editData.type}
                            onChange={(e) => setEditData(prev => ({ ...prev, type: e.target.value }))}
                            className="edit-select"
                          >
                            {materialTypes.map(type => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      <div className="edit-group">
                        <label>{t('adminMaterials.description')}:</label>
                        <textarea
                          value={editData.description}
                          onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                          className="edit-textarea"
                          rows="2"
                          placeholder={t('adminMaterials.materialDescription')}
                        />
                      </div>

                      <div className="edit-trainers">
                        <label>{t('adminMaterials.trainerAccess')}:</label>
                        <div className="edit-trainers-grid">
                          {trainers.map(user => (
                            <label key={user.id} className="trainer-checkbox">
                              <input
                                type="checkbox"
                                checked={editData.trainerIdAccess.includes(user.id)}
                                onChange={() => toggleEditTrainer(user.id)}
                              />
                              <span>{user.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="edit-actions">
                        <button 
                          onClick={() => handleSaveEdit(material.id)}
                          className="save-btn"
                          disabled={loading}
                        >
                          {loading ? t('adminMaterials.saving') + '...' : t('adminMaterials.saveChanges')}
                        </button>
                        <button 
                          onClick={handleCancelEdit}
                          className="cancel-btn"
                        >
                          {t('common.cancel')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h4 className="material-name">{material.title}</h4>
                      <div className="upload-date">📅 {formatDate(material.uploadedAt)}</div>
                      {material.description && (
                        <p className="material-description">{material.description}</p>
                      )}
                      <div className="material-stats">
                        <span className="viewer-count">
                          {t('adminMaterials.trainersWithAccess', { count: material.trainerIdAccess.length })}
                        </span>
                      </div>
                      
                      <div className="material-actions">
                        <a 
                          href={material.fileUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="action-btn view-btn"
                        >
                          {t('adminMaterials.view')}
                        </a>
                        <button 
                          onClick={() => startEditing(material)}
                          className="action-btn edit-btn"
                        >
                          {t('common.edit')}
                        </button>
                        <button 
                          className="action-btn delete-btn" 
                          onClick={() => handleDelete(material.id, material.fileUrl)}
                          disabled={loading}
                        >
                          {t('common.delete')}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filter by User Section */}
      {trainers.length > 0 && (
        <div className="filter-by-user-section">
          <h3>{t('adminMaterials.viewMaterialsByTrainer')}</h3>
          <div className="user-filter-controls">
            <select 
              value={viewerFilter} 
              onChange={(e) => setViewerFilter(e.target.value)}
              className="user-filter-select"
            >
              <option value="">{t('adminMaterials.selectTrainer')}</option>
              {trainers.map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>

            {viewerFilter && (
              <div className="filtered-materials">
                <h4>{t('adminMaterials.materialsAccessibleTo', { trainerName: trainers.find(u => u.id === viewerFilter)?.name })}:</h4>
                {(() => {
                  const userMaterials = getSortedMaterials(
                    materialList.filter(material => material.trainerIdAccess.includes(viewerFilter))
                  );
                  
                  return userMaterials.length === 0 ? (
                    <p className="no-materials">{t('adminMaterials.noMaterialsForTrainer')}</p>
                  ) : (
                    <div className="filtered-materials-grid">
                      {userMaterials.map(material => (
                        <div key={material.id} className="material-card compact">
                          <div className="material-header">
                            <div className="material-icon">
                              {getFileIcon(material.type, material.title)}
                            </div>
                            {material.type && (
                              <span className="material-type-badge small">{material.type}</span>
                            )}
                          </div>
                          <div className="material-info">
                            <h5 className="material-name">{material.title}</h5>
                            <a 
                              href={material.fileUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="action-btn view-btn"
                            >
                              {t('adminMaterials.viewMaterial')}
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageMaterialsAdmin;