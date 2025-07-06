import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next'; // הוספת useTranslation
import { db } from '../firebase';
import { doc, setDoc, deleteDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { logAdminAction } from '../utils/adminLogger';
import './ManageUsers.css'; // Import your CSS styles

/**
 * ManageLessons Component (renamed to Sessions)
 * 
 * Props:
 * - classes: Array of class objects
 * - loading: Boolean loading state
 * - setLoading: Function to set loading state
 * - error: Function to set error messages
 * - success: Function to set success messages
 */
const ManageLessons = ({ classes, loading, setLoading, error, success }) => {
  const { t } = useTranslation(); // הוספת hook לתרגום
  
  // Debug logs
  console.log('ManageLessons props:', { 
    classes: Array.isArray(classes) ? `Array(${classes.length})` : classes,
    loading,
    setLoading: typeof setLoading,
    error: typeof error,
    success: typeof success
  });

  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [schools, setSchools] = useState([]);
  const [schoolsLoading, setSchoolsLoading] = useState(false);
  
  const [newSession, setNewSession] = useState({
    date: '',
    startTime: '16:00',
    schoolId: '',
    classId: '',
    topic: '',
    duration: 60,
    status: false // false = planned, true = completed
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState('all');
  const [editingSession, setEditingSession] = useState(null);

  // Fetch sessions from database
  const fetchSessions = async () => {
    setSessionsLoading(true);
    try {
      const sessionsSnapshot = await getDocs(collection(db, "sessions"));
      const sessionsData = sessionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSessions(sessionsData);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      if (typeof error === 'function') error(t('adminSessions.failedToLoadSessions'));
    } finally {
      setSessionsLoading(false);
    }
  };

  // Fetch schools from database
  const fetchSchools = async () => {
    setSchoolsLoading(true);
    try {
      const schoolsSnapshot = await getDocs(collection(db, "schools"));
      const schoolsData = schoolsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSchools(schoolsData);
    } catch (err) {
      console.error('Error fetching schools:', err);
      if (typeof error === 'function') error(t('adminSessions.failedToLoadSchools'));
    } finally {
      setSchoolsLoading(false);
    }
  };

  // Fetch sessions and schools on component mount
  useEffect(() => {
    fetchSessions();
    fetchSchools();
  }, []);

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
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  };

  // Format time function
  const formatTime = (timeString) => {
    if (!timeString) return '-';
    return timeString;
  };

  const handleSessionChange = (e) => {
    const { name, value } = e.target;
    
    // If school is changed, reset classId
    if (name === 'schoolId') {
      setNewSession({ 
        ...newSession, 
        [name]: value,
        classId: '' // Reset class selection when school changes
      });
    } else {
      setNewSession({ ...newSession, [name]: value });
    }
  };

  // Filter classes based on selected school
  const getFilteredClasses = () => {
    if (!newSession.schoolId || !classes || !Array.isArray(classes)) {
      return [];
    }
    return classes.filter(cls => cls.school === newSession.schoolId);
  };

  const handleAddSession = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (typeof error === 'function') error('');
    if (typeof success === 'function') success('');
    
    try {
      // בדיקת שדות חובה
      if (!newSession.date || !newSession.schoolId || !newSession.classId || !newSession.topic) {
        if (typeof error === 'function') error(t('adminSessions.fillAllRequiredFields'));
        setLoading(false);
        return;
      }

      // בדיקת sessions כפולים - הוולידציה החדשה!
      const sessionDate = new Date(newSession.date);
      const existingSession = sessions.find(session => {
        let existingDate;
        if (session.date && session.date.toDate) {
          existingDate = session.date.toDate();
        } else if (session.date instanceof Date) {
          existingDate = session.date;
        } else if (session.date) {
          existingDate = new Date(session.date);
        } else {
          return false;
        }

        // השוואת כל הפרמטרים
        return (
          existingDate.toDateString() === sessionDate.toDateString() && // אותו תאריך
          session.schoolId === newSession.schoolId && // אותו בית ספר
          session.classId === newSession.classId && // אותה כיתה
          session.startTime === newSession.startTime // אותה שעת התחלה
        );
      });

      if (existingSession) {
        const classInfo = classes && Array.isArray(classes)
          ? classes.find(c => c.id === newSession.classId)
          : null;
        const className = classInfo ? classInfo.className : t('adminSessions.unknownClass');
        
        if (typeof error === 'function') {
          error(t('adminSessions.sessionAlreadyExists', {
            date: new Date(newSession.date).toLocaleDateString(),
            time: newSession.startTime,
            className: className,
            school: newSession.schoolId
          }));
        }
        setLoading(false);
        return;
      }

      // Get trainer ID from selected class
      const selectedClass = classes.find(cls => cls.id === newSession.classId);
      const trainerId = selectedClass ? selectedClass.assignedTrainer : '';

      // Generate random document ID
      const randomId = doc(collection(db, "sessions")).id;
      
      const sessionData = {
        date: new Date(newSession.date),
        startTime: newSession.startTime,
        schoolId: newSession.schoolId, // Save school name as string
        classId: newSession.classId,
        trainerId: trainerId, // Save trainer ID from class
        topic: newSession.topic,
        duration: Number(newSession.duration),
        status: newSession.status, // Boolean: true=completed, false=planned
        createdAt: new Date()
      };

      await setDoc(doc(db, "sessions", randomId), sessionData);
      
      // מציאת שם הכיתה לרישום האדמין
      const classInfo = classes && Array.isArray(classes)
        ? classes.find(c => c.id === newSession.classId)
        : null;
      const className = classInfo ? classInfo.className : t('adminSessions.unknownClass');
      
      const admin = JSON.parse(localStorage.getItem('user'));
      await logAdminAction({
        admin,
        actionType: 'add_session',
        targetType: 'session',
        targetId: randomId,
        description: `Added session for class "${className}" on ${newSession.date}`
      });

      if (typeof success === 'function') success(t('adminSessions.sessionAddedSuccessfully'));
      
      // עדכון מקומי של הרשימה
      setSessions([...sessions, { ...sessionData, id: randomId }]);
      
      setNewSession({
        date: '',
        startTime: '16:00',
        schoolId: '',
        classId: '',
        topic: '',
        duration: 60,
        status: false
      });
      
      fetchSessions();
    } catch (err) {
      console.error("Error:", err);
      if (typeof error === 'function') error(err.message);
    }
    setLoading(false);
  };

  const handleDeleteSession = async (sessionId) => {
    // מציאת השיעור לפני המחיקה כדי לקחת את פרטיו לרישום
    const sessionToDelete = sessions.find(session => session.id === sessionId);
    let sessionDescription = `Deleted session with ID ${sessionId}`;
    
    if (sessionToDelete) {
      const classInfo = classes && Array.isArray(classes)
        ? classes.find(c => c.id === sessionToDelete.classId)
        : null;
      const className = classInfo ? classInfo.className : t('adminSessions.unknownClass');
      const sessionDate = formatDate(sessionToDelete.date);
      sessionDescription = `Deleted session for class "${className}" on ${sessionDate}`;
    }
    
    if (!window.confirm(t('adminSessions.confirmDeleteSession'))) return;
    setLoading(true);
    if (typeof error === 'function') error('');
    if (typeof success === 'function') success('');
    
    try {
      await deleteDoc(doc(db, "sessions", sessionId));
      const admin = JSON.parse(localStorage.getItem('user'));
      await logAdminAction({
        admin,
        actionType: 'delete_session',
        targetType: 'session',
        targetId: sessionId,
        description: sessionDescription
      });
      
      if (typeof success === 'function') success(t('adminSessions.sessionDeletedSuccessfully'));
      
      // עדכון מקומי של הרשימה
      setSessions(sessions.filter(session => session.id !== sessionId));
      
      fetchSessions();
    } catch (err) {
      console.error("Error deleting session:", err);
      if (typeof error === 'function') error(t('adminSessions.failedToDeleteSession') + ': ' + err.message);
    }
    setLoading(false);
  };

  const handleEditSession = (sessionToEdit) => {
    setEditingSession(sessionToEdit.id);
    
    // Format date for input
    let formattedDate = '';
    if (sessionToEdit.date) {
      const date = sessionToEdit.date.toDate ? sessionToEdit.date.toDate() : new Date(sessionToEdit.date);
      formattedDate = date.toISOString().split('T')[0];
    }
    
    setNewSession({
      date: formattedDate,
      startTime: sessionToEdit.startTime || '16:00',
      schoolId: sessionToEdit.schoolId || '',
      classId: sessionToEdit.classId || '',
      topic: sessionToEdit.topic || '',
      duration: sessionToEdit.duration || 60,
      status: sessionToEdit.status === true || sessionToEdit.status === 'completed' ? true : false // Handle both boolean and string
    });
    
    // גלילה חלקה לראש הדף
    setTimeout(() => {
      document.body.scrollTop = 0; // Safari
      document.documentElement.scrollTop = 0; // Chrome, Firefox, IE, Opera
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      
      const container = document.querySelector('.admin-content') || document.querySelector('.user-management-container');
      if (container) {
        container.scrollTop = 0;
      }
    }, 50);
  };

  const handleUpdateSession = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (typeof error === 'function') error('');
    if (typeof success === 'function') success('');
    
    try {
      // בדיקת שדות חובה
      if (!newSession.date || !newSession.schoolId || !newSession.classId || !newSession.topic) {
        if (typeof error === 'function') error(t('adminSessions.fillAllRequiredFields'));
        setLoading(false);
        return;
      }

      // בדיקת sessions כפולים (מלבד הsession הנוכחי שנערך) - הוולידציה החדשה!
      const sessionDate = new Date(newSession.date);
      const existingSession = sessions.find(session => {
        // התעלמות מהsession הנוכחי שנערך
        if (session.id === editingSession) return false;

        let existingDate;
        if (session.date && session.date.toDate) {
          existingDate = session.date.toDate();
        } else if (session.date instanceof Date) {
          existingDate = session.date;
        } else if (session.date) {
          existingDate = new Date(session.date);
        } else {
          return false;
        }

        // השוואת כל הפרמטרים
        return (
          existingDate.toDateString() === sessionDate.toDateString() && // אותו תאריך
          session.schoolId === newSession.schoolId && // אותו בית ספר
          session.classId === newSession.classId && // אותה כיתה
          session.startTime === newSession.startTime // אותה שעת התחלה
        );
      });

      if (existingSession) {
        const classInfo = classes && Array.isArray(classes)
          ? classes.find(c => c.id === newSession.classId)
          : null;
        const className = classInfo ? classInfo.className : t('adminSessions.unknownClass');
        
        if (typeof error === 'function') {
          error(t('adminSessions.sessionAlreadyExists', {
            date: new Date(newSession.date).toLocaleDateString(),
            time: newSession.startTime,
            className: className,
            school: newSession.schoolId
          }));
        }
        setLoading(false);
        return;
      }

      // Get trainer ID from selected class
      const selectedClass = classes.find(cls => cls.id === newSession.classId);
      const trainerId = selectedClass ? selectedClass.assignedTrainer : '';

      const updatedData = {
        date: new Date(newSession.date),
        startTime: newSession.startTime,
        schoolId: newSession.schoolId, // Save school name as string
        classId: newSession.classId,
        trainerId: trainerId, // Save trainer ID from class
        topic: newSession.topic,
        duration: Number(newSession.duration),
        status: newSession.status, // Boolean: true=completed, false=planned
        updatedAt: new Date()
      };

      await updateDoc(doc(db, "sessions", editingSession), updatedData);
      
      // מציאת שם הכיתה לרישום האדמין
      const classInfo = classes && Array.isArray(classes)
        ? classes.find(c => c.id === newSession.classId)
        : null;
      const className = classInfo ? classInfo.className : t('adminSessions.unknownClass');
      
      const admin = JSON.parse(localStorage.getItem('user'));
      await logAdminAction({
        admin,
        actionType: 'update_session',
        targetType: 'session',
        targetId: editingSession,
        description: `Updated session for class "${className}" on ${newSession.date}`
      });

      if (typeof success === 'function') success(t('adminSessions.sessionUpdatedSuccessfully'));
      
      // עדכון מקומי של הרשימה
      setSessions(sessions.map(session => 
        session.id === editingSession 
          ? { ...session, ...updatedData }
          : session
      ));
      
      setEditingSession(null);
      setNewSession({
        date: '',
        startTime: '16:00',
        schoolId: '',
        classId: '',
        topic: '',
        duration: 60,
        status: false
      });
      
      fetchSessions();
    } catch (err) {
      console.error("Error updating session:", err);
      if (typeof error === 'function') error(err.message);
    }
    setLoading(false);
  };

  const handleCancelEdit = () => {
    setEditingSession(null);
    setNewSession({
      date: '',
      startTime: '16:00',
      schoolId: '',
      classId: '',
      topic: '',
      duration: 60,
      status: false
    });
    
    // ניקוי הודעות שגיאה והצלחה
    if (typeof error === 'function') error('');
    if (typeof success === 'function') success('');
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchFilter('all');
  };

  // Filter and sort sessions based on search query and filter with error handling
  const filteredSessions = (sessions || [])
    .filter(session => {
      try {
        if (!searchQuery.trim()) return true;
        
        const query = searchQuery.toLowerCase();
        
        switch (searchFilter) {
          case 'topic':
            return (session.topic || '').toLowerCase().includes(query);
          case 'school':
            return (session.schoolId || '').toLowerCase().includes(query);
          case 'class':
            const classInfo = classes && Array.isArray(classes)
              ? classes.find(c => c.id === session.classId)
              : null;
            const className = classInfo ? classInfo.className.toLowerCase() : '';
            return className.includes(query);
          case 'status':
            const statusText = session.status === true ? t('adminSessions.completed').toLowerCase() : t('adminSessions.planned').toLowerCase();
            return statusText.includes(query);
          case 'date':
            const dateStr = formatDate(session.date).toLowerCase();
            return dateStr.includes(query);
          case 'added':
            const addedDateStr = formatDate(session.createdAt).toLowerCase();
            return addedDateStr.includes(query);
          case 'all':
          default:
            const classInfo2 = classes && Array.isArray(classes)
              ? classes.find(c => c.id === session.classId)
              : null;
            const className2 = classInfo2 ? classInfo2.className.toLowerCase() : '';
            const dateStr2 = formatDate(session.date).toLowerCase();
            const addedDateStr2 = formatDate(session.createdAt).toLowerCase();
            const statusText2 = session.status === true ? t('adminSessions.completed').toLowerCase() : t('adminSessions.planned').toLowerCase();
            
            return (
              (session.topic || '').toLowerCase().includes(query) ||
              (session.schoolId || '').toLowerCase().includes(query) ||
              className2.includes(query) ||
              statusText2.includes(query) ||
              dateStr2.includes(query) ||
              addedDateStr2.includes(query)
            );
        }
      } catch (err) {
        console.error('Error filtering session:', err, session);
        return false;
      }
    })
    .sort((a, b) => {
      // Sort by createdAt descending (newest first) - CHANGED FROM date TO createdAt
      try {
        let createdAtA, createdAtB;
        
        if (a.createdAt && a.createdAt.toDate) {
          createdAtA = a.createdAt.toDate();
        } else if (a.createdAt instanceof Date) {
          createdAtA = a.createdAt;
        } else if (a.createdAt) {
          createdAtA = new Date(a.createdAt);
        } else {
          createdAtA = new Date(0); // Default to epoch if no date
        }
        
        if (b.createdAt && b.createdAt.toDate) {
          createdAtB = b.createdAt.toDate();
        } else if (b.createdAt instanceof Date) {
          createdAtB = b.createdAt;
        } else if (b.createdAt) {
          createdAtB = new Date(b.createdAt);
        } else {
          createdAtB = new Date(0); // Default to epoch if no date
        }
        
        return createdAtB.getTime() - createdAtA.getTime(); // Descending order (newest first)
      } catch (err) {
        console.error('Error sorting sessions:', err);
        return 0;
      }
    });

  return (
    <div className="user-management-container">
      {/* Add Session Section */}
      <div className="add-user-section">
        <h2>{editingSession ? t('adminSessions.editSession') : t('adminSessions.addNewSession')}</h2>
        
        <form onSubmit={editingSession ? handleUpdateSession : handleAddSession} className="add-user-form">
          <div className="form-row">
            <div className="form-group">
              <label>{t('adminSessions.dateRequired')}</label>
              <input
                type="date"
                name="date"
                value={newSession.date}
                onChange={handleSessionChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>{t('adminSessions.startTimeRequired')}</label>
              <input
                type="time"
                name="startTime"
                value={newSession.startTime}
                onChange={handleSessionChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>{t('adminSessions.schoolRequired')}</label>
              <select
                name="schoolId"
                value={newSession.schoolId}
                onChange={handleSessionChange}
                required
              >
                <option value="">
                  {schoolsLoading 
                    ? t('adminSessions.loadingSchools')
                    : schools.length === 0 
                      ? t('adminSessions.noSchoolsAvailable')
                      : t('adminSessions.selectSchool')}
                </option>
                {schools.map(school => (
                  <option key={school.id} value={school.name}>
                    {school.name}
                  </option>
                ))}
              </select>
              {schools.length === 0 && !schoolsLoading && (
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  {t('adminSessions.noSchoolsFoundAddFirst')}
                </div>
              )}
            </div>
            
            <div className="form-group">
              <label>{t('adminSessions.classRequired')}</label>
              <select
                name="classId"
                value={newSession.classId}
                onChange={handleSessionChange}
                required
                disabled={!newSession.schoolId}
              >
                <option value="">
                  {!newSession.schoolId 
                    ? t('adminSessions.selectSchoolFirst')
                    : getFilteredClasses().length === 0 
                      ? t('adminSessions.noClassesAvailableForSchool')
                      : t('adminSessions.selectClass')}
                </option>
                {getFilteredClasses().map(cls => (
                  <option key={cls.id} value={cls.id}>
                    {cls.className} ({cls.level})
                  </option>
                ))}
              </select>
              {newSession.schoolId && getFilteredClasses().length === 0 && (
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  {t('adminSessions.noClassesFoundForSchool', { school: newSession.schoolId })}
                </div>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>{t('adminSessions.durationMinutesRequired')}</label>
              <select
                name="duration"
                value={newSession.duration}
                onChange={handleSessionChange}
                required
              >
                <option value={30}>{t('adminSessions.30minutes')}</option>
                <option value={45}>{t('adminSessions.45minutes')}</option>
                <option value={60}>{t('adminSessions.60minutes')}</option>
                <option value={90}>{t('adminSessions.90minutes')}</option>
                <option value={120}>{t('adminSessions.120minutes')}</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>{t('adminSessions.topicRequired')}</label>
              <input
                type="text"
                name="topic"
                value={newSession.topic}
                onChange={handleSessionChange}
                placeholder={t('adminSessions.sessionTopicPlaceholder')}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>{t('adminSessions.statusRequired')}</label>
              <select
                name="status"
                value={newSession.status}
                onChange={(e) => setNewSession({...newSession, status: e.target.value === 'true'})}
                required
              >
                <option value={false}>{t('adminSessions.planned')}</option>
                <option value={true}>{t('adminSessions.completed')}</option>
              </select>
            </div>
          </div>

          <div className="form-actions">
            {editingSession ? (
              <>
                <div className="edit-mode-info">
                  <div className="edit-indicator">
                    ✏️ {t('adminSessions.editMode')}
                  </div>
                  <div className="edit-description">
                    {t('adminSessions.editModeDescription')}
                  </div>
                </div>
                <div className="edit-buttons-row">
                  <button 
                    type="submit" 
                    className="save-button"
                    disabled={loading || sessionsLoading}
                  >
                    {loading || sessionsLoading ? t('adminSessions.saving') + '...' : t('adminSessions.saveChanges')}
                  </button>
                  <button 
                    type="button" 
                    className="cancel-button"
                    onClick={handleCancelEdit}
                    disabled={loading || sessionsLoading}
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </>
            ) : (
              <button 
                type="submit" 
                className="add-button"
                disabled={loading || sessionsLoading}
              >
                {loading || sessionsLoading ? t('adminSessions.adding') + '...' : t('adminSessions.addSession')}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Sessions List Section */}
      <div className="user-list-section">
        <div className="users-list-header">
          <h3>{t('adminSessions.sessionsList', { count: filteredSessions.length })}</h3>
          <div className="users-search-container">
            <div className="users-search-filter-row">
              <select
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="users-filter-select"
              >
                <option value="all">{t('adminSessions.allFields')}</option>
                <option value="topic">{t('adminSessions.topic')}</option>
                <option value="school">{t('adminSessions.school')}</option>
                <option value="class">{t('adminSessions.class')}</option>
                <option value="status">{t('adminSessions.status')}</option>
                <option value="date">{t('adminSessions.sessionDate')}</option>
                <option value="added">{t('adminSessions.addedDate')}</option>
              </select>
              
              <input
                type="text"
                placeholder={t('adminSessions.searchPlaceholder', { 
                  field: searchFilter === 'all' ? t('adminSessions.allFields').toLowerCase() : 
                    searchFilter === 'topic' ? t('adminSessions.topic').toLowerCase() :
                    searchFilter === 'school' ? t('adminSessions.school').toLowerCase() :
                    searchFilter === 'class' ? t('adminSessions.class').toLowerCase() :
                    searchFilter === 'status' ? t('adminSessions.status').toLowerCase() :
                    searchFilter === 'date' ? t('adminSessions.sessionDate').toLowerCase() :
                    searchFilter === 'added' ? t('adminSessions.addedDate').toLowerCase() : 'sessions'
                })}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="users-search-input"
              />
              
              {(searchQuery || searchFilter !== 'all') && (
                <button 
                  onClick={clearSearch}
                  className="users-clear-search-button"
                  title={t('adminSessions.clearSearch')}
                >
                  ×
                </button>
              )}
            </div>
            
            <button 
              onClick={() => {
                fetchSessions();
                fetchSchools(); // Also refresh schools
              }} 
              className="refresh-button"
              disabled={loading || sessionsLoading}
            >
              {loading || sessionsLoading ? t('adminSessions.refreshing') + '...' : '↻ ' + t('adminSessions.refresh')}
            </button>
          </div>
        </div>

        {(searchQuery || searchFilter !== 'all') && (
          <div className="search-results-info">
            {t('adminSessions.showingResults', { 
              filtered: filteredSessions.length, 
              total: (sessions || []).length,
              query: searchQuery,
              field: searchFilter !== 'all' ? (
                searchFilter === 'topic' ? t('adminSessions.topic').toLowerCase() :
                searchFilter === 'school' ? t('adminSessions.school').toLowerCase() :
                searchFilter === 'class' ? t('adminSessions.class').toLowerCase() :
                searchFilter === 'status' ? t('adminSessions.status').toLowerCase() :
                searchFilter === 'date' ? t('adminSessions.sessionDate').toLowerCase() :
                searchFilter === 'added' ? t('adminSessions.addedDate').toLowerCase() : searchFilter
              ) : ''
            })}
          </div>
        )}
        
        {loading || sessionsLoading ? (
          <div className="loading-users">{t('adminSessions.loadingSessions')}</div>
        ) : (
          <div className="users-table-wrapper">
            {filteredSessions.length > 0 ? (
              <table className="users-table">
                <thead>
                  <tr>
                    <th>{t('adminSessions.date')}</th>
                    <th>{t('adminSessions.time')}</th>
                    <th>{t('adminSessions.school')}</th>
                    <th>{t('adminSessions.class')}</th>
                    <th>{t('adminSessions.topic')}</th>
                    <th>{t('adminSessions.duration')}</th>
                    <th>{t('adminSessions.status')}</th>
                    <th>{t('adminSessions.added')}</th>
                    <th>{t('adminSessions.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSessions.map(session => {
                    const classInfo = classes && Array.isArray(classes)
                      ? classes.find(c => c.id === session.classId)
                      : null;
                    
                    return (
                      <tr key={session.id}>
                        <td>{formatDate(session.date)}</td>
                        <td>{formatTime(session.startTime)}</td>
                        <td>{session.schoolId || '-'}</td>
                        <td>
                          {classInfo 
                            ? `${classInfo.className} (${classInfo.level})` 
                            : t('adminSessions.unknownClass')}
                        </td>
                        <td>{session.topic}</td>
                        <td>{session.duration} {t('adminSessions.minutes')}</td>
                        <td>
                          <span className={`role-badge ${session.status === true ? 'completed' : 'planned'}`}>
                            {session.status === true ? t('adminSessions.completed') : t('adminSessions.planned')}
                          </span>
                        </td>
                        <td>{formatDate(session.createdAt)}</td>
                        <td>
                          <div className="table-actions">
                            <button 
                              className="edit-button"
                              onClick={() => handleEditSession(session)}
                              disabled={loading || sessionsLoading}
                            >
                              {t('common.edit')}
                            </button>
                            <button 
                              className="delete-button"
                              onClick={() => handleDeleteSession(session.id)}
                              disabled={loading || sessionsLoading}
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
                  ? t('adminSessions.noSessionsMatchSearch')
                  : t('adminSessions.noSessionsFound')}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageLessons;