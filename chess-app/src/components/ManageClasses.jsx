import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next'; 
import { db, storage } from '../firebase';
import { doc, setDoc, deleteDoc, updateDoc, collection, getDocs, query, where, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { logAdminAction } from '../utils/adminLogger';
import './ManageUsers.css';

const ManageClasses = ({ classes, users, setClasses, loading, setLoading, error, success, fetchClasses }) => {
  const { t } = useTranslation(); 
  
  
  console.log('ManageClasses props:', { 
    classes: Array.isArray(classes) ? `Array(${classes.length})` : classes,
    users: Array.isArray(users) ? `Array(${users.length})` : users,
    setClasses: typeof setClasses,
    loading,
    setLoading: typeof setLoading,
    error: typeof error,
    success: typeof success,
    fetchClasses: typeof fetchClasses
  });

  const [schools, setSchools] = useState([]);
  const [schoolsLoading, setSchoolsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileUploading, setFileUploading] = useState(false);
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [previousSelectedStudents, setPreviousSelectedStudents] = useState([]); // NEW: שמירת המצב הקודם
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  
  const [newClass, setNewClass] = useState({
    className: '',
    school: '',
    level: 'beginner',
    assignedTrainer: '',
    syllabus: '',
    studentsId: ['']
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState('all');
  const [editingClass, setEditingClass] = useState(null);

  
  const logAdminActionLocal = async (actionType, description, targetType, targetId = null) => {
    try {
      
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
      
    }
  };

  
  const fetchSchools = async () => {
    setSchoolsLoading(true);
    try {
      const schoolsSnapshot = await getDocs(collection(db, "schools"));
      const schoolsData = schoolsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSchools(schoolsData);
    } catch (err) {
      console.error('Error fetching schools:', err);
      if (typeof error === 'function') error(t('adminClasses.failedToLoadSchools'));
    } finally {
      setSchoolsLoading(false);
    }
  };

  // Fetch students from database
  const fetchStudents = async () => {
    setStudentsLoading(true);
    try {
      const studentsSnapshot = await getDocs(collection(db, "students"));
      const studentsData = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudents(studentsData);
    } catch (err) {
      console.error('Error fetching students:', err);
      if (typeof error === 'function') error(t('adminClasses.failedToLoadStudents'));
    } finally {
      setStudentsLoading(false);
    }
  };

  
  const deleteSessionsOnClassDelete = async (classId) => {
    try {
      console.log(`Deleting sessions for class deletion: ${classId}`);
      
      
      const sessionsQuery = query(collection(db, 'sessions'), where('classId', '==', classId));
      const sessionsSnapshot = await getDocs(sessionsQuery);
      
     
      const deletePromises = sessionsSnapshot.docs.map(docRef => 
        deleteDoc(docRef.ref)
      );
      
      if (deletePromises.length > 0) {
        await Promise.all(deletePromises);
        console.log(`Deleted ${deletePromises.length} sessions with classId = ${classId}`);
        return deletePromises.length;
      } else {
        console.log("No sessions found with this class ID");
        return 0;
      }
      
    } catch (error) {
      console.error("Error deleting sessions:", error);
      throw error;
    }
  };

  // Fetch schools and students on component mount
  useEffect(() => {
    fetchSchools();
    fetchStudents();
  }, []);

  // Format date function
  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    
    let date;
    if (timestamp.toDate) {
      
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      
      date = timestamp;
    } else {
      
      date = new Date(timestamp);
    }
    
    if (isNaN(date.getTime())) return '-';
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  };

  const handleClassChange = (e) => {
    if (e.target.type === 'file') {
      setSelectedFile(e.target.files[0]);
    } else {
      setNewClass({ ...newClass, [e.target.name]: e.target.value });
    }
  };

  const openStudentsModal = () => {
    setPreviousSelectedStudents([...selectedStudents]);
    setShowStudentsModal(true);
  };

  const closeStudentsModal = () => {
    setSelectedStudents([...previousSelectedStudents]);
    setShowStudentsModal(false);
  };

  const handleStudentToggle = (studentId) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const saveSelectedStudents = () => {
    const studentsArray = selectedStudents.length > 0 ? selectedStudents : [''];
    setNewClass({ ...newClass, studentsId: studentsArray });
    setPreviousSelectedStudents([...selectedStudents]);
    setShowStudentsModal(false);
  };

  const uploadSyllabusFile = async (file, classId) => {
    if (!file) return null;
    
    try {
      setFileUploading(true);
      const timestamp = Date.now();
      const fileName = `${classId}_${timestamp}_${file.name}`;
      const storageRef = ref(storage, `syllabi/${fileName}`);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading file:', error);
      if (typeof error === 'function') error(t('adminClasses.failedToUploadSyllabus'));
      return null;
    } finally {
      setFileUploading(false);
    }
  };

  const deleteSyllabusFile = async (syllabusUrl) => {
    if (!syllabusUrl) return;
    
    try {
      const storageRef = ref(storage, syllabusUrl);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const handleAddClass = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (typeof error === 'function') error('');
    if (typeof success === 'function') success('');
    
    try {
      if (!newClass.className || !newClass.school || !newClass.assignedTrainer) {
        if (typeof error === 'function') error(t('adminClasses.fillRequiredFields'));
        setLoading(false);
        return;
      }

      const existingClass = (classes || []).find(cls => 
        cls.school === newClass.school && cls.className === newClass.className
      );
      
      if (existingClass) {
        if (typeof error === 'function') error(t('adminClasses.classAlreadyExists', { className: newClass.className, school: newClass.school }));
        setLoading(false);
        return;
      }

      const randomId = doc(collection(db, "classes")).id;
      
      let syllabusUrl = '';
      
      if (selectedFile) {
        syllabusUrl = await uploadSyllabusFile(selectedFile, randomId);
        if (!syllabusUrl) {
          setLoading(false);
          return; 
        }
      }

      const classData = {
        className: newClass.className,
        school: newClass.school,
        level: newClass.level,
        assignedTrainer: newClass.assignedTrainer,
        syllabus: syllabusUrl,
        studentsId: newClass.studentsId.length > 0 ? newClass.studentsId : [''],
        createdAt: new Date()
      };

      await setDoc(doc(db, "classes", randomId), classData);

      await logAdminActionLocal(
        'add-class',
        `Added class "${classData.className}" at ${classData.school}`,
        'class',
        randomId
      );

      if (typeof success === 'function') success(t('adminClasses.classAddedSuccessfully'));
      
      if (setClasses && Array.isArray(classes)) {
        setClasses([...classes, { ...classData, id: randomId }]);
      }
      
      setNewClass({
        className: '',
        school: '',
        level: 'beginner',
        assignedTrainer: '',
        syllabus: '',
        studentsId: ['']
      });
      setSelectedFile(null);
      setSelectedStudents([]);
      setPreviousSelectedStudents([]); 
      
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
      
      if (typeof fetchClasses === 'function') {
        fetchClasses();
      }
    } catch (err) {
      console.error("Error:", err);
      if (typeof error === 'function') error(err.message);
    }
    setLoading(false);
  };

  const handleDeleteClass = async (classId) => {
    const classToDelete = (classes || []).find(cls => cls.id === classId);
    let classDescription = `Deleted class with ID ${classId}`;
    
    if (classToDelete) {
      classDescription = `Deleted class "${classToDelete.className}" from ${classToDelete.school}`;
    }
    
    if (!window.confirm(t('adminClasses.confirmDeleteClass'))) return;
    setLoading(true);
    if (typeof error === 'function') error('');
    if (typeof success === 'function') success('');
    
    try {
      console.log("Class deletion initiated, deleting related sessions first...");
      await deleteSessionsOnClassDelete(classId);
      
      await deleteDoc(doc(db, "classes", classId));

      await logAdminActionLocal(
        'delete-class',
        classDescription,
        'class',
        classId
      );
      
      if (typeof success === 'function') success(t('adminClasses.classDeletedSuccessfully'));
      
      if (setClasses && Array.isArray(classes)) {
        setClasses(classes.filter(cls => cls.id !== classId));
      }
      
      if (typeof fetchClasses === 'function') {
        fetchClasses();
      }
    } catch (err) {
      console.error("Error deleting class:", err);
      if (typeof error === 'function') error(t('adminClasses.failedToDeleteClass') + ': ' + err.message);
    }
    setLoading(false);
  };

  const handleEditClass = (classToEdit) => {
    setEditingClass(classToEdit.id);
    setNewClass({
      className: classToEdit.className,
      school: classToEdit.school || '',
      level: classToEdit.level,
      assignedTrainer: classToEdit.assignedTrainer || '',
      syllabus: classToEdit.syllabus || '',
      studentsId: classToEdit.studentsId || ['']
    });
    const currentStudents = classToEdit.studentsId && classToEdit.studentsId.length > 0 && classToEdit.studentsId[0] !== '' ? classToEdit.studentsId : [];
    setSelectedStudents(currentStudents);
    setPreviousSelectedStudents([...currentStudents]); // שמירת המצב הנוכחי גם כמצב קודם
    setSelectedFile(null);
    
    // Reset file input
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = '';
    
    setTimeout(() => {
      document.body.scrollTop = 0; 
      document.documentElement.scrollTop = 0; 
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      
      const container = document.querySelector('.admin-content') || document.querySelector('.user-management-container');
      if (container) {
        container.scrollTop = 0;
      }
    }, 50);
  };

  const handleUpdateClass = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (typeof error === 'function') error('');
    if (typeof success === 'function') success('');
    
    try {
      if (!newClass.className || !newClass.school || !newClass.assignedTrainer) {
        if (typeof error === 'function') error(t('adminClasses.fillRequiredFields'));
        setLoading(false);
        return;
      }

      const existingClass = (classes || []).find(cls => 
        cls.school === newClass.school && 
        cls.className === newClass.className && 
        cls.id !== editingClass 
      );
      
      if (existingClass) {
        if (typeof error === 'function') error(t('adminClasses.classAlreadyExists', { className: newClass.className, school: newClass.school }));
        setLoading(false);
        return;
      }

      let syllabusUrl = newClass.syllabus; 
      
      if (selectedFile) {
        const newSyllabusUrl = await uploadSyllabusFile(selectedFile, editingClass);
        if (newSyllabusUrl) {
          if (syllabusUrl) {
            await deleteSyllabusFile(syllabusUrl);
          }
          syllabusUrl = newSyllabusUrl;
        } else {
          setLoading(false);
          return; 
        }
      }

      const updatedData = {
        className: newClass.className,
        school: newClass.school,
        level: newClass.level,
        assignedTrainer: newClass.assignedTrainer,
        syllabus: syllabusUrl,
        studentsId: newClass.studentsId.length > 0 ? newClass.studentsId : [''],
        updatedAt: new Date()
      };

      await updateDoc(doc(db, "classes", editingClass), updatedData);
      
      await logAdminActionLocal(
        'update-class',
        `Updated class "${updatedData.className}" at ${updatedData.school}`,
        'class',
        editingClass
      );

      if (typeof success === 'function') success(t('adminClasses.classUpdatedSuccessfully'));
      
      if (setClasses && Array.isArray(classes)) {
        setClasses(classes.map(cls => 
          cls.id === editingClass 
            ? { ...cls, ...updatedData }
            : cls
        ));
      }
      
      setEditingClass(null);
      setNewClass({
        className: '',
        school: '',
        level: 'beginner',
        assignedTrainer: '',
        syllabus: '',
        studentsId: ['']
      });
      setSelectedFile(null);
      setSelectedStudents([]);
      setPreviousSelectedStudents([]); 
      
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
      
      if (typeof fetchClasses === 'function') {
        fetchClasses();
      }
    } catch (err) {
      console.error("Error updating class:", err);
      if (typeof error === 'function') error(err.message);
    }
    setLoading(false);
  };

  const handleCancelEdit = () => {
    setEditingClass(null);
    setNewClass({
      className: '',
      school: '',
      level: 'beginner',
      assignedTrainer: '',
      syllabus: '',
      studentsId: ['']
    });
    setSelectedFile(null);
    setSelectedStudents([]);
    setPreviousSelectedStudents([]); 
    
    
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = '';
    
    
    if (typeof error === 'function') error('');
    if (typeof success === 'function') success('');
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchFilter('all');
  };

  const filteredClasses = (classes || [])
    .filter(cls => {
      try {
        if (!searchQuery.trim()) return true;
        
        const query = searchQuery.toLowerCase();
        
        switch (searchFilter) {
          case 'className':
            return (cls.className || '').toLowerCase().includes(query);
          case 'school':
            return (cls.school || '').toLowerCase().includes(query);
          case 'level':
            return (cls.level || '').toLowerCase().includes(query);
          case 'trainer':
            const trainer = cls.assignedTrainer && users && Array.isArray(users)
              ? users.find(u => u.id === cls.assignedTrainer)
              : null;
            const trainerName = trainer ? `${trainer.firstName} ${trainer.lastName}`.toLowerCase() : '';
            return trainerName.includes(query);
          case 'added':
            const dateStr = formatDate(cls.createdAt).toLowerCase();
            return dateStr.includes(query);
          case 'all':
          default:
            const trainer2 = cls.assignedTrainer && users && Array.isArray(users)
              ? users.find(u => u.id === cls.assignedTrainer)
              : null;
            const trainerName2 = trainer2 ? `${trainer2.firstName} ${trainer2.lastName}`.toLowerCase() : '';
            const dateStr2 = formatDate(cls.createdAt).toLowerCase();
            
            return (
              (cls.className || '').toLowerCase().includes(query) ||
              (cls.school || '').toLowerCase().includes(query) ||
              (cls.level || '').toLowerCase().includes(query) ||
              trainerName2.includes(query) ||
              dateStr2.includes(query)
            );
        }
      } catch (err) {
        console.error('Error filtering class:', err, cls);
        return false;
      }
    })
    .sort((a, b) => {
      // Sort by createdAt descending (newest first)
      try {
        let dateA, dateB;
        
        if (a.createdAt && a.createdAt.toDate) {
          dateA = a.createdAt.toDate();
        } else if (a.createdAt instanceof Date) {
          dateA = a.createdAt;
        } else if (a.createdAt) {
          dateA = new Date(a.createdAt);
        } else {
          dateA = new Date(0); 
        }
        
        if (b.createdAt && b.createdAt.toDate) {
          dateB = b.createdAt.toDate();
        } else if (b.createdAt instanceof Date) {
          dateB = b.createdAt;
        } else if (b.createdAt) {
          dateB = new Date(b.createdAt);
        } else {
          dateB = new Date(0); 
        }
        
        return dateB.getTime() - dateA.getTime(); 
      } catch (err) {
        console.error('Error sorting classes:', err);
        return 0;
      }
    });

  return (
    <div className="user-management-container">
      {/* Add Class Section */}
      <div className="add-user-section">
        <h2>{editingClass ? t('adminClasses.editClass') : t('adminClasses.addNewClass')}</h2>
        
        <form onSubmit={editingClass ? handleUpdateClass : handleAddClass} className="add-user-form">
          <div className="form-row">
            <div className="form-group">
              <label>{t('adminClasses.classNameRequired')}</label>
              <input
                type="text"
                name="className"
                value={newClass.className}
                onChange={handleClassChange}
                placeholder={t('adminClasses.classNamePlaceholder')}
                required
              />
            </div>
            
            <div className="form-group">
              <label>{t('adminClasses.levelRequired')}</label>
              <select
                name="level"
                value={newClass.level}
                onChange={handleClassChange}
                required
              >
                <option value="beginner">{t('adminClasses.beginner')}</option>
                <option value="intermediate">{t('adminClasses.intermediate')}</option>
                <option value="advanced">{t('adminClasses.advanced')}</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>{t('adminClasses.schoolRequired')}</label>
              <select
                name="school"
                value={newClass.school}
                onChange={handleClassChange}
                required
              >
                <option value="">
                  {schoolsLoading 
                    ? t('adminClasses.loadingSchools')
                    : schools.length === 0 
                      ? t('adminClasses.noSchoolsAvailable')
                      : t('adminClasses.selectSchool')}
                </option>
                {schools.map(school => (
                  <option key={school.id} value={school.name}>
                    {school.name}
                  </option>
                ))}
              </select>
              {schools.length === 0 && !schoolsLoading && (
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  {t('adminClasses.noSchoolsFoundAddFirst')}
                </div>
              )}
            </div>
            
            <div className="form-group">
              <label>{t('adminClasses.assignedTrainerRequired')}</label>
              <select
                name="assignedTrainer"
                value={newClass.assignedTrainer}
                onChange={handleClassChange}
                required
              >
                <option value="">{t('adminClasses.selectTrainer')}</option>
                {(users || []).filter(u => u.role === 'trainer').map(trainer => (
                  <option key={trainer.id} value={trainer.id}>
                    {trainer.firstName} {trainer.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>{t('adminClasses.syllabusFile')}</label>
              <input
                type="file"
                name="syllabus"
                onChange={handleClassChange}
                accept="*/*"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px dashed #e6e6e6',
                  borderRadius: '6px',
                  fontSize: '13px',
                  backgroundColor: '#faf8f1',
                  color: '#333333',
                  boxSizing: 'border-box',
                  height: '42px',
                  cursor: 'pointer',
                  lineHeight: '1.2',
                  display: 'flex',
                  alignItems: 'center'
                }}
              />
              {editingClass && newClass.syllabus && (
                <div className="current-file-info">
                  <small style={{ color: '#666', fontSize: '11px' }}>
                    {t('adminClasses.current')}: <a href={newClass.syllabus} target="_blank" rel="noopener noreferrer" style={{ color: '#5e3c8f' }}>
                      {t('adminClasses.viewCurrentSyllabus')}
                    </a>
                  </small>
                </div>
              )}
              {selectedFile && (
                <div className="selected-file-info">
                  <small style={{ color: '#5e3c8f', fontSize: '11px' }}>
                    {t('adminClasses.selected')}: {selectedFile.name}
                  </small>
                </div>
              )}
            </div>
            
            <div className="form-group">
              <label>{t('adminClasses.students')}</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={openStudentsModal}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#5e3c8f',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}
                  disabled={studentsLoading}
                >
                  {studentsLoading ? t('common.loading') + '...' : t('adminClasses.choose')}
                </button>
                <span style={{ fontSize: '12px', color: '#666' }}>
                  {selectedStudents.length > 0 
                    ? t('adminClasses.studentsSelected', { count: selectedStudents.length })
                    : t('adminClasses.noStudentsSelected')}
                </span>
              </div>
            </div>
          </div>

          <div className="form-actions">
            {editingClass ? (
              <>
                <div className="edit-mode-info">
                  <div className="edit-indicator">
                    ✏️ {t('adminClasses.editMode')}
                  </div>
                  <div className="edit-description">
                    {t('adminClasses.editModeDescription')}
                  </div>
                </div>
                <div className="edit-buttons-row">
                  <button 
                    type="submit" 
                    className="save-button"
                    disabled={loading || fileUploading}
                  >
                    {loading || fileUploading ? (fileUploading ? t('adminClasses.uploading') + '...' : t('adminClasses.saving') + '...') : t('common.save')}
                  </button>
                  <button 
                    type="button" 
                    className="cancel-button"
                    onClick={handleCancelEdit}
                    disabled={loading || fileUploading}
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </>
            ) : (
              <button 
                type="submit" 
                className="add-button"
                disabled={loading || fileUploading}
              >
                {loading || fileUploading ? (fileUploading ? t('adminClasses.uploading') + '...' : t('adminClasses.adding') + '...') : t('adminClasses.addClass')}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Classes List Section */}
      <div className="user-list-section">
        <div className="users-list-header">
          <h3>{t('adminClasses.classesList', { count: filteredClasses.length })}</h3>
          <div className="users-search-container">
            <div className="users-search-filter-row">
              <select
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="users-filter-select"
              >
                <option value="all">{t('adminClasses.allFields')}</option>
                <option value="className">{t('adminClasses.className')}</option>
                <option value="school">{t('adminClasses.school')}</option>
                <option value="level">{t('adminClasses.level')}</option>
                <option value="trainer">{t('adminClasses.assignedTrainer')}</option>
                <option value="added">{t('adminClasses.addedDate')}</option>
              </select>
              
              <input
                type="text"
                placeholder={t('adminClasses.searchPlaceholder', { 
                  field: searchFilter === 'all' ? t('adminClasses.allFields').toLowerCase() : 
                    searchFilter === 'className' ? t('adminClasses.className').toLowerCase() :
                    searchFilter === 'school' ? t('adminClasses.school').toLowerCase() :
                    searchFilter === 'level' ? t('adminClasses.level').toLowerCase() :
                    searchFilter === 'trainer' ? t('adminClasses.trainer').toLowerCase() :
                    searchFilter === 'added' ? t('adminClasses.date').toLowerCase() : t('adminClasses.classes').toLowerCase()
                })}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="users-search-input"
              />
              
              {(searchQuery || searchFilter !== 'all') && (
                <button 
                  onClick={clearSearch}
                  className="users-clear-search-button"
                  title={t('adminClasses.clearSearch')}
                >
                  ×
                </button>
              )}
            </div>
            
            <button 
              onClick={() => {
                if (typeof fetchClasses === 'function') {
                  fetchClasses();
                } else {
                  console.warn('fetchClasses function is not available');
                }
                fetchSchools(); // Also refresh schools
                fetchStudents(); // Also refresh students
              }} 
              className="refresh-button"
              disabled={loading}
            >
              {loading ? t('adminClasses.refreshing') + '...' : '↻ ' + t('admin.refresh')}
            </button>
          </div>
        </div>

        {(searchQuery || searchFilter !== 'all') && (
          <div className="search-results-info">
            {t('adminClasses.showingResults', { 
              filtered: filteredClasses.length, 
              total: (classes || []).length,
              query: searchQuery,
              field: searchFilter !== 'all' ? (
                searchFilter === 'className' ? t('adminClasses.className').toLowerCase() :
                searchFilter === 'school' ? t('adminClasses.school').toLowerCase() :
                searchFilter === 'level' ? t('adminClasses.level').toLowerCase() :
                searchFilter === 'trainer' ? t('adminClasses.assignedTrainer').toLowerCase() :
                searchFilter === 'added' ? t('adminClasses.addedDate').toLowerCase() : searchFilter
              ) : ''
            })}
          </div>
        )}
        
        {loading ? (
          <div className="loading-users">{t('adminClasses.loadingClasses')}</div>
        ) : (
          <div className="users-table-wrapper">
            {filteredClasses.length > 0 ? (
              <table className="users-table">
                <thead>
                  <tr>
                    <th>{t('adminClasses.className')}</th>
                    <th>{t('adminClasses.school')}</th>
                    <th>{t('adminClasses.level')}</th>
                    <th>{t('adminClasses.assignedTrainer')}</th>
                    <th>{t('adminClasses.added')}</th>
                    <th>{t('adminClasses.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClasses.map(cls => {
                    const assignedTrainer = cls.assignedTrainer && users && Array.isArray(users)
                      ? users.find(u => u.id === cls.assignedTrainer)
                      : null;
                    
                    return (
                      <tr key={cls.id}>
                        <td>{cls.className}</td>
                        <td>{cls.school || '-'}</td>
                        <td>
                          <span className={`role-badge ${cls.level}`}>
                            {t(`adminClasses.${cls.level}`)}
                          </span>
                        </td>
                        <td>
                          {assignedTrainer 
                            ? `${assignedTrainer.firstName} ${assignedTrainer.lastName}` 
                            : '-'}
                        </td>
                        <td>{formatDate(cls.createdAt)}</td>
                        <td>
                          <div className="table-actions">
                            <button 
                              className="edit-button"
                              onClick={() => handleEditClass(cls)}
                              disabled={loading}
                            >
                              {t('common.edit')}
                            </button>
                            <button 
                              className="delete-button"
                              onClick={() => handleDeleteClass(cls.id)}
                              disabled={loading}
                            >
                              {t('common.delete')}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="no-users">
                {searchQuery || searchFilter !== 'all' 
                  ? t('adminClasses.noClassesMatchSearch')
                  : t('adminClasses.noClassesFound')}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Students Selection Modal */}
      {showStudentsModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '20px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
          }}>
            <h3 style={{
              marginBottom: '15px',
              color: '#5e3c8f',
              borderBottom: '2px solid #e9c44c',
              paddingBottom: '8px'
            }}>
              {t('adminClasses.selectStudents')}
            </h3>
            
            {studentsLoading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>{t('adminClasses.loadingStudents')}</div>
            ) : students.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                {t('adminClasses.noStudentsFoundInDatabase')}
              </div>
            ) : (
              <div style={{ maxHeight: '300px', overflow: 'auto', marginBottom: '15px' }}>
                {students.map(student => (
                  <div key={student.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px',
                    borderBottom: '1px solid #eee',
                    cursor: 'pointer',
                    backgroundColor: selectedStudents.includes(student.id) ? '#f7eac5' : 'transparent'
                  }} onClick={() => handleStudentToggle(student.id)}>
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student.id)}
                      onChange={() => handleStudentToggle(student.id)}
                      style={{ marginRight: '10px', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '14px', color: '#333' }}>
                      {student.fullName}
                    </span>
                  </div>
                ))}
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={closeStudentsModal}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f5f5f5',
                  color: '#333',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600'
                }}
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={saveSelectedStudents}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#5e3c8f',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600'
                }}
              >
                {t('adminClasses.saveStudents', { count: selectedStudents.length })}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageClasses;