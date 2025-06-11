import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, setDoc, deleteDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
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
      if (typeof error === 'function') error('Failed to load sessions data');
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
      if (typeof error === 'function') error('Failed to load schools data');
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
        if (typeof error === 'function') error('Please fill all required fields: Date, School, Class, and Topic');
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
        const className = classInfo ? classInfo.className : 'Unknown Class';
        
        if (typeof error === 'function') {
          error(`A session already exists on ${new Date(newSession.date).toLocaleDateString()} at ${newSession.startTime} for ${className} in ${newSession.schoolId}. Please choose a different date, time, or class.`);
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

      if (typeof success === 'function') success('Session added successfully!');
      
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
    if (!window.confirm("Are you sure you want to delete this session?")) return;
    setLoading(true);
    if (typeof error === 'function') error('');
    if (typeof success === 'function') success('');
    
    try {
      await deleteDoc(doc(db, "sessions", sessionId));
      
      if (typeof success === 'function') success('Session deleted successfully');
      
      // עדכון מקומי של הרשימה
      setSessions(sessions.filter(session => session.id !== sessionId));
      
      fetchSessions();
    } catch (err) {
      console.error("Error deleting session:", err);
      if (typeof error === 'function') error('Failed to delete session: ' + err.message);
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
        if (typeof error === 'function') error('Please fill all required fields: Date, School, Class, and Topic');
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
        const className = classInfo ? classInfo.className : 'Unknown Class';
        
        if (typeof error === 'function') {
          error(`A session already exists on ${new Date(newSession.date).toLocaleDateString()} at ${newSession.startTime} for ${className} in ${newSession.schoolId}. Please choose a different date, time, or class.`);
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

      if (typeof success === 'function') success('Session updated successfully!');
      
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
            const statusText = session.status === true ? 'completed' : 'planned';
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
            const statusText2 = session.status === true ? 'completed' : 'planned';
            
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
        <h2>{editingSession ? 'Edit Session' : 'Add New Session'}</h2>
        
        <form onSubmit={editingSession ? handleUpdateSession : handleAddSession} className="add-user-form">
          <div className="form-row">
            <div className="form-group">
              <label>Date*</label>
              <input
                type="date"
                name="date"
                value={newSession.date}
                onChange={handleSessionChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Start Time*</label>
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
              <label>School*</label>
              <select
                name="schoolId"
                value={newSession.schoolId}
                onChange={handleSessionChange}
                required
              >
                <option value="">
                  {schoolsLoading 
                    ? 'Loading schools...' 
                    : schools.length === 0 
                      ? 'No schools available' 
                      : 'Select School'}
                </option>
                {schools.map(school => (
                  <option key={school.id} value={school.name}>
                    {school.name}
                  </option>
                ))}
              </select>
              {schools.length === 0 && !schoolsLoading && (
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  No schools found in database. Add schools first.
                </div>
              )}
            </div>
            
            <div className="form-group">
              <label>Class*</label>
              <select
                name="classId"
                value={newSession.classId}
                onChange={handleSessionChange}
                required
                disabled={!newSession.schoolId}
              >
                <option value="">
                  {!newSession.schoolId 
                    ? 'Select school first' 
                    : getFilteredClasses().length === 0 
                      ? 'No classes available for selected school'
                      : 'Select Class'}
                </option>
                {getFilteredClasses().map(cls => (
                  <option key={cls.id} value={cls.id}>
                    {cls.className} ({cls.level})
                  </option>
                ))}
              </select>
              {newSession.schoolId && getFilteredClasses().length === 0 && (
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  No classes found for "{newSession.schoolId}". Add classes for this school first.
                </div>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Duration (minutes)*</label>
              <select
                name="duration"
                value={newSession.duration}
                onChange={handleSessionChange}
                required
              >
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
                <option value={90}>90 minutes</option>
                <option value={120}>120 minutes</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Topic*</label>
              <input
                type="text"
                name="topic"
                value={newSession.topic}
                onChange={handleSessionChange}
                placeholder="Session topic"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Status*</label>
              <select
                name="status"
                value={newSession.status}
                onChange={(e) => setNewSession({...newSession, status: e.target.value === 'true'})}
                required
              >
                <option value={false}>Planned</option>
                <option value={true}>Completed</option>
              </select>
            </div>
          </div>

          <div className="form-actions">
            {editingSession ? (
              <>
                <div className="edit-mode-info">
                  <div className="edit-indicator">
                    ✏️ Edit Mode
                  </div>
                  <div className="edit-description">
                    You are currently editing this session. Make your changes and click Save, or Cancel to discard changes.
                  </div>
                </div>
                <div className="edit-buttons-row">
                  <button 
                    type="submit" 
                    className="save-button"
                    disabled={loading || sessionsLoading}
                  >
                    {loading || sessionsLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button 
                    type="button" 
                    className="cancel-button"
                    onClick={handleCancelEdit}
                    disabled={loading || sessionsLoading}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <button 
                type="submit" 
                className="add-button"
                disabled={loading || sessionsLoading}
              >
                {loading || sessionsLoading ? 'Adding...' : 'Add Session'}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Sessions List Section */}
      <div className="user-list-section">
        <div className="users-list-header">
          <h3>Sessions List ({filteredSessions.length})</h3>
          <div className="users-search-container">
            <div className="users-search-filter-row">
              <select
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="users-filter-select"
              >
                <option value="all">All Fields</option>
                <option value="topic">Topic</option>
                <option value="school">School</option>
                <option value="class">Class</option>
                <option value="status">Status</option>
                <option value="date">Session Date</option>
                <option value="added">Added Date</option>
              </select>
              
              <input
                type="text"
                placeholder={`Search ${searchFilter === 'all' ? 'all fields' : 
                  searchFilter === 'topic' ? 'topic' :
                  searchFilter === 'school' ? 'school' :
                  searchFilter === 'class' ? 'class' :
                  searchFilter === 'status' ? 'status' :
                  searchFilter === 'date' ? 'session date' :
                  searchFilter === 'added' ? 'added date' : 'sessions'}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="users-search-input"
              />
              
              {(searchQuery || searchFilter !== 'all') && (
                <button 
                  onClick={clearSearch}
                  className="users-clear-search-button"
                  title="Clear search"
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
              {loading || sessionsLoading ? 'Refreshing...' : '↻ Refresh'}
            </button>
          </div>
        </div>

        {(searchQuery || searchFilter !== 'all') && (
          <div className="search-results-info">
            Showing {filteredSessions.length} of {(sessions || []).length} sessions
            {searchQuery && ` matching "${searchQuery}"`}
            {searchFilter !== 'all' && ` in ${
              searchFilter === 'topic' ? 'topic' :
              searchFilter === 'school' ? 'school' :
              searchFilter === 'class' ? 'class' :
              searchFilter === 'status' ? 'status' :
              searchFilter === 'date' ? 'session date' :
              searchFilter === 'added' ? 'added date' : searchFilter
            }`}
          </div>
        )}
        
        {loading || sessionsLoading ? (
          <div className="loading-users">Loading sessions...</div>
        ) : (
          <div className="users-table-wrapper">
            {filteredSessions.length > 0 ? (
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Time</th>
                    <th>School</th>
                    <th>Class</th>
                    <th>Topic</th>
                    <th>Duration</th>
                    <th>Status</th>
                    <th>Added</th>
                    <th>Actions</th>
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
                            : 'Unknown Class'}
                        </td>
                        <td>{session.topic}</td>
                        <td>{session.duration} min</td>
                        <td>
                          <span className={`role-badge ${session.status === true ? 'completed' : 'planned'}`}>
                            {session.status === true ? 'Completed' : 'Planned'}
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
                              Edit
                            </button>
                            <button 
                              className="delete-button"
                              onClick={() => handleDeleteSession(session.id)}
                              disabled={loading || sessionsLoading}
                            >
                              Delete
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
                  ? `No sessions match your search criteria.` 
                  : 'No sessions found. Add your first session.'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageLessons;