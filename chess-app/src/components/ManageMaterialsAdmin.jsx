import React, { useState, useEffect } from 'react';
import { db, storage } from '../firebase';
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import './ManageMaterialsAdmin.css';

const ManageMaterialsAdmin = ({ loading, setLoading, error, success }) => {
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

  // פונקציה לרישום פעולות ב-adminLogs
  const logAdminAction = async (actionType, description, targetId = null) => {
    try {
      // קבלת פרטי המשתמש הנוכחי
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
    { value: '', label: 'Select Type (Optional)' },
    { value: 'Presentation', label: 'Presentation' },
    { value: 'Document', label: 'Document' },
    { value: 'Image', label: 'Image' },
    { value: 'Video', label: 'Video' }
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
      error('Failed to load users data');
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
      error('Failed to load materials.');
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
      error('Please select at least one file.');
      return;
    }

    if (!formData.title.trim()) {
      error('Please enter a title.');
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

        // רישום פעולה ב-adminLogs
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
      
      success(`Successfully uploaded ${newMaterials.length} material${newMaterials.length > 1 ? 's' : ''}`);
    } catch (err) {
      console.error('Error uploading:', err);
      error('Upload failed');
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
      error('Please enter a title.');
      return;
    }

    // קבלת פרטי החומר לפני העדכון
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

      // רישום פעולה ב-adminLogs
      await logAdminAction(
        'edit-material',
        `Updated material "${material.title}" to "${editData.title.trim()}" with access for ${editData.trainerIdAccess.length} trainer${editData.trainerIdAccess.length !== 1 ? 's' : ''}`,
        materialId
      );

      // Update local state
      setMaterialList(prev => prev.map(m => 
        m.id === materialId ? { ...m, ...updateData } : m
      ));
      
      setEditingId(null);
      setEditData({ title: '', description: '', type: '', trainerIdAccess: [] });
      
      success('Material updated successfully');
    } catch (err) {
      console.error('Failed to save changes:', err);
      error('Failed to save changes.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({ title: '', description: '', type: '', trainerIdAccess: [] });
  };

  const handleDelete = async (id, fileUrl) => {
    // קבלת פרטי החומר לפני המחיקה
    const material = materialList.find(m => m.id === id);
    if (!material) {
      error('Material not found');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete the material "${material.title}"?`)) return;

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

      // רישום פעולה ב-adminLogs
      await logAdminAction(
        'delete-material',
        `Deleted material "${material.title}"${material.type ? ` of type ${material.type}` : ''}`,
        id
      );

      setMaterialList(prev => prev.filter(m => m.id !== id));
      success('Material deleted successfully');
    } catch (err) {
      console.error('Error deleting material:', err);
      error('Failed to delete material.');
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
            <div className="stat-label">Total Materials</div>
          </div>
          <div className="stat-card trainers">
            <div className="stat-number">{trainers.length}</div>
            <div className="stat-label">Available Trainers</div>
          </div>
        </div>
      </div>

      {/* Upload Section */}
      <div className="materials-upload-section">
        <h3>Upload New Learning Materials</h3>
        <div className="upload-area">
          <div className="form-row">
            <div className="input-group">
              <label htmlFor="title">Title (Required):</label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter material title"
                className="form-input"
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="type">Type:</label>
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
            <label htmlFor="description">Description:</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter material description (optional)"
              className="form-textarea"
              rows="3"
            />
          </div>

          <div className="input-group">
            <label htmlFor="files">Files:</label>
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
                <h4>Selected Files:</h4>
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
                <h4>Select Trainers with Access:</h4>
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
                {loading ? 'Uploading...' : `Upload ${selectedFiles.length} File${selectedFiles.length > 1 ? 's' : ''}`}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Materials List */}
      <div className="materials-list-section">
        <div className="section-header">
          <h3>Learning Materials Library ({sortedMaterials.length})</h3>
          <div className="header-controls">
            <input
              type="text"
              placeholder="Search materials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <select 
              value={typeFilter} 
              onChange={(e) => setTypeFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">All Types</option>
              <option value="Presentation">Presentations</option>
              <option value="Document">Documents</option>
              <option value="Image">Images</option>
              <option value="Video">Videos</option>
            </select>
            <select 
              value={sortOption} 
              onChange={(e) => setSortOption(e.target.value)}
              className="sort-select"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="alphabetical">A → Z</option>
              <option value="reverse-alphabetical">Z → A</option>
            </select>
          </div>
        </div>

        {(searchQuery || typeFilter) && (
          <div className="search-results-info">
            {filteredMaterials.length === 0 
              ? "No materials found matching your criteria" 
              : `Found ${filteredMaterials.length} material${filteredMaterials.length === 1 ? '' : 's'}`
            }
          </div>
        )}
        
        {sortedMaterials.length === 0 ? (
          <div className="empty-state">
            {(searchQuery || typeFilter) ? (
              <>
                <h4>No materials found</h4>
                <p>No materials match your search criteria.</p>
              </>
            ) : (
              <>
                <h4>No materials uploaded</h4>
                <p>Upload your first learning material using the form above.</p>
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
                          <label>Title:</label>
                          <input
                            type="text"
                            value={editData.title}
                            onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                            className="edit-input"
                            placeholder="Material title"
                          />
                        </div>
                        <div className="edit-group">
                          <label>Type:</label>
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
                        <label>Description:</label>
                        <textarea
                          value={editData.description}
                          onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                          className="edit-textarea"
                          rows="2"
                          placeholder="Material description"
                        />
                      </div>

                      <div className="edit-trainers">
                        <label>Trainer Access:</label>
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
                          {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button 
                          onClick={handleCancelEdit}
                          className="cancel-btn"
                        >
                          Cancel
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
                          {material.trainerIdAccess.length} trainer{material.trainerIdAccess.length !== 1 ? 's' : ''} with access
                        </span>
                      </div>
                      
                      <div className="material-actions">
                        <a 
                          href={material.fileUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="action-btn view-btn"
                        >
                          View
                        </a>
                        <button 
                          onClick={() => startEditing(material)}
                          className="action-btn edit-btn"
                        >
                          Edit
                        </button>
                        <button 
                          className="action-btn delete-btn" 
                          onClick={() => handleDelete(material.id, material.fileUrl)}
                          disabled={loading}
                        >
                          Delete
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
          <h3>View Materials by Trainer</h3>
          <div className="user-filter-controls">
            <select 
              value={viewerFilter} 
              onChange={(e) => setViewerFilter(e.target.value)}
              className="user-filter-select"
            >
              <option value="">-- Select a Trainer --</option>
              {trainers.map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>

            {viewerFilter && (
              <div className="filtered-materials">
                <h4>Materials accessible to {trainers.find(u => u.id === viewerFilter)?.name}:</h4>
                {(() => {
                  const userMaterials = getSortedMaterials(
                    materialList.filter(material => material.trainerIdAccess.includes(viewerFilter))
                  );
                  
                  return userMaterials.length === 0 ? (
                    <p className="no-materials">No materials available for this trainer.</p>
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
                              View Material
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