import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next'; // add translation hook
import { collection, getDocs, doc, getDoc, query, where, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate, useLocation } from 'react-router-dom';
import './TrainerSessions.css';

const TrainerSessions = () => {
  const { t } = useTranslation(); // translation hook
  const [upcoming, setUpcoming] = useState([]); // upcoming sessions
  const [past, setPast] = useState([]); // past/completed sessions
  const [loading, setLoading] = useState(true); // loading state while fetching
  const [showSessionModal, setShowSessionModal] = useState(false); // whether detail modal is visible
  const [selectedSession, setSelectedSession] = useState(null); // session currently viewed
  const [students, setStudents] = useState([]); // students for selected session
  const [searchTerm, setSearchTerm] = useState(''); // current search input
  const [filteredPast, setFilteredPast] = useState([]); // filtered past sessions
  const [filteredUpcoming, setFilteredUpcoming] = useState([]); // filtered upcoming sessions
  const [autoSearchClass, setAutoSearchClass] = useState(''); // prefilled search from URL param
  const navigate = useNavigate();
  const location = useLocation();

  // Function to log trainer actions into adminLogs collection
  const logTrainerAction = async (actionType, description, targetId = null) => {
    try {
      // Retrieve current user info from localStorage
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const trainerName = `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.email || 'Unknown Trainer';

      const logEntry = {
        actionType,
        adminName: trainerName, // reuse same field name as admin logs
        description,
        targetType: 'session',
        timestamp: new Date(),
        targetId: targetId || null,
        adminId: currentUser.uid || currentUser.id || null
      };

      await addDoc(collection(db, 'adminLogs'), logEntry);
      console.log('Trainer action logged:', logEntry);
    } catch (err) {
      console.error('Error logging trainer action:', err);
      // Do not block the main flow if logging fails
    }
  };

  // Helper: convert various timestamp formats to display string D/M/Y
  const formatTimestampToDisplay = (timestamp) => {
    if (!timestamp) return t('messages.noData');
    
    let dateObj;
    if (timestamp.seconds) {
      // Firestore Timestamp
      dateObj = new Date(timestamp.seconds * 1000);
    } else if (timestamp instanceof Date) {
      dateObj = timestamp;
    } else if (typeof timestamp === 'string') {
      dateObj = new Date(timestamp);
    } else {
      return 'Invalid Date';
    }
    
    // Format as D/M/Y
    const day = dateObj.getDate();
    const month = dateObj.getMonth() + 1;
    const year = dateObj.getFullYear();
    
    return `${day}/${month}/${year}`;
  };

  // Helper: parse date plus optional startTime to a Date object for sorting
  const parseDateForSorting = (date, startTime) => {
    let dateObj;
    
    if (typeof date === 'object' && date.seconds) {
      // Firestore Timestamp
      dateObj = new Date(date.seconds * 1000);
    } else if (typeof date === 'string') {
      // String date
      dateObj = new Date(date);
    } else {
      // Fallback to now
      dateObj = new Date();
    }
    
    // Incorporate startTime if provided for more granular ordering
    if (startTime && typeof startTime === 'string') {
      const [hours, minutes] = startTime.split(':');
      if (hours && minutes) {
        dateObj.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      }
    }
    
    return dateObj;
  };

  // Initial fetch of sessions for the logged-in trainer
  useEffect(() => {
    const fetchSessions = async () => {
      const user = JSON.parse(localStorage.getItem('user'));
      const trainerId = user?.uid;
      if (!trainerId) return;

      try {
        const q = query(collection(db, 'sessions'), where('trainerId', '==', trainerId));
        const snapshot = await getDocs(q);

        const sessionsList = [];

        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();
          
          // Retrieve class information if available
          const classId = data.classId;
          let className = '[No Class]';
          let studentsCount = 0;
          
          if (classId) {
            try {
              const classRef = doc(db, 'classes', classId);
              const classDoc = await getDoc(classRef);
              if (classDoc.exists()) {
                const classData = classDoc.data();
                className = classData.className || className;
                studentsCount = Array.isArray(classData.studentsId) ? classData.studentsId.length : 0;
              }
            } catch (error) {
              console.error('Error fetching class:', error);
            }
          }

          // Get school name (stored directly in schoolId field)
          const schoolName = data.schoolId || '[No School]';

          // Prepare display date
          let displayDate = formatTimestampToDisplay(data.date);
          
          // Append start time if exists
          if (data.startTime) {
            displayDate = `${displayDate} ${data.startTime}`;
          }
          
          console.log('Final display date:', displayDate);

          const sessionObj = {
            id: docSnap.id,
            date: displayDate,
            duration: data.duration || 0,
            status: data.status === true ? 'completed' : 'upcoming',
            studentsCount,
            className,
            school: schoolName,
            topic: data.topic || '',
            method: data.method || '',
            fullData: data
          };

          sessionsList.push(sessionObj);
        }

        // Separate and sort completed sessions (past)
        const completedSessions = sessionsList
          .filter(s => s.status === 'completed')
          .sort((a, b) => {
            const dateA = parseDateForSorting(a.fullData.date, a.fullData.startTime);
            const dateB = parseDateForSorting(b.fullData.date, b.fullData.startTime);
            return dateA - dateB; // oldest first
          });
          
        // Separate and sort upcoming sessions
        const upcomingSessions = sessionsList
          .filter(s => s.status === 'upcoming')
          .sort((a, b) => {
            const dateA = parseDateForSorting(a.fullData.date, a.fullData.startTime);
            const dateB = parseDateForSorting(b.fullData.date, b.fullData.startTime);
            return dateA - dateB; // oldest first
          });

        // Update state and filtered copies
        setPast(completedSessions);
        setUpcoming(upcomingSessions);
        setFilteredPast(completedSessions);
        setFilteredUpcoming(upcomingSessions);
        
      } catch (error) {
        console.error('Error fetching sessions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  // Read searchClass param from URL and prefill search
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const classNameParam = searchParams.get('searchClass');
    if (classNameParam) {
      setSearchTerm(classNameParam);
      setAutoSearchClass(classNameParam);
    }
  }, [location.search]);

  // Apply text filtering to both upcoming and past sessions
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredPast(past);
      setFilteredUpcoming(upcoming);
      return;
    }

    const filterSessions = (sessions) => {
      return sessions.filter(session => {
        const searchLower = searchTerm.toLowerCase();
        return (
          session.school.toLowerCase().includes(searchLower) ||
          session.className.toLowerCase().includes(searchLower) ||
          session.date.toLowerCase().includes(searchLower) ||
          session.topic.toLowerCase().includes(searchLower)
        );
      });
    };

    setFilteredPast(filterSessions(past));
    setFilteredUpcoming(filterSessions(upcoming));
  }, [searchTerm, past, upcoming]);

  // Handler for search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Clear search input and reset URL
  const clearSearch = () => {
    setSearchTerm('');
    setAutoSearchClass('');
    navigate('/trainer-area/sessions', { replace: true });
  };

  // Start recording a session (upcoming) and log the action
  const handleRecordSession = async (session, event) => {
    // Prevent row click when record button is clicked
    event.stopPropagation();
    
    // log action to adminLogs
    await logTrainerAction(
      'start-record-session',
      `Started recording a session for class "${session.className}" at ${session.school}`,
      session.id
    );
    
    navigate('/trainer-area/record-session', {
      state: {
        ...session,
        classId: session.fullData.classId,
        className: session.className,
        // Ensure session ID is passed
        id: session.id,
        isRecording: true, // mark as recording upcoming session
        originalDate: session.fullData.date,
        originalStartTime: session.fullData.startTime
      }
    });
  };

  // Edit an existing session and log the action
  const handleEditSession = async (session, event) => {
    // Prevent row click when edit button is clicked
    event.stopPropagation();
    
    // log action to adminLogs
    await logTrainerAction(
      'start-edit-session',
      `Started editing a session for class "${session.className}" from ${session.date}`,
      session.id
    );
    
    navigate('/trainer-area/record-session', {
      state: {
        ...session,
        classId: session.fullData.classId,
        className: session.className,
        id: session.id,
        originalDate: session.fullData.date,
        originalStartTime: session.fullData.startTime
      }
    });
  };

  // View session details and fetch related students
  const handleShowSession = async (session, event) => {
    // Prevent row click when show button is clicked
    event.stopPropagation();
    
    // log action to adminLogs
    await logTrainerAction(
      'view-session',
      `Viewed session details for class "${session.className}" from ${session.date}`,
      session.id
    );
    
    setSelectedSession(session);
    
    // Fetch students of the class if classId exists
    if (session.fullData.classId) {
      try {
        const classDoc = await getDoc(doc(db, 'classes', session.fullData.classId));
        if (classDoc.exists()) {
          const classData = classDoc.data();
          const studentIds = classData.studentsId || [];

          const fetchedStudents = await Promise.all(
            studentIds.map(async (id) => {
              try {
                const studentDoc = await getDoc(doc(db, 'students', id));
                return studentDoc.exists() ? { id: studentDoc.id, ...studentDoc.data() } : null;
              } catch (error) {
                console.error(`Error fetching student ${id}:`, error);
                return null;
              }
            })
          );

          const validStudents = fetchedStudents.filter(Boolean);
          setStudents(validStudents);
        }
      } catch (err) {
        console.error('Error fetching students:', err);
      }
    }
    
    setShowSessionModal(true);
  };

  // Close the session detail modal and reset related state
  const closeModal = () => {
    setShowSessionModal(false);
    setSelectedSession(null);
    setStudents([]);
  };

  // Render table for upcoming sessions
  const renderUpcomingTable = (sessions) => (
    <table className="sessions-table">
      <thead>
        <tr>
          <th>{t('trainerSessions.class')}</th>
          <th>{t('trainerSessions.school')}</th>
          <th>{t('trainerSessions.date')}</th>
          <th>{t('trainerSessions.duration')}</th>
          <th>{t('trainerSessions.status')}</th>
          <th># {t('trainerSessions.students')}</th>
          <th>{t('trainerSessions.actions')}</th>
        </tr>
      </thead>
      <tbody>
        {sessions.map((s) => (
          <tr key={s.id}>
            <td>{s.className}</td>
            <td>{s.school}</td>
            <td>{s.date}</td>
            <td>{s.duration} min</td>
            <td className={`status ${s.status}`}>{s.status === 'upcoming' ? t('trainerSessions.upcoming') : t('trainerSessions.completed')}</td>
            <td>{s.studentsCount}</td>
            <td>
              <button 
                className="record-btn"
                onClick={(event) => handleRecordSession(s, event)}
                title={t('trainerSessions.record')}
              >
                {t('trainerSessions.record')}
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  // Render table for past sessions with additional action buttons
  const renderPastTable = (sessions) => (
    <table className="sessions-table">
      <thead>
        <tr>
          <th>{t('trainerSessions.class')}</th>
          <th>{t('trainerSessions.school')}</th>
          <th>{t('trainerSessions.date')}</th>
          <th>{t('trainerSessions.duration')}</th>
          <th>{t('trainerSessions.status')}</th>
          <th># {t('trainerSessions.students')}</th>
          <th>{t('trainerSessions.actions')}</th>
        </tr>
      </thead>
      <tbody>
        {sessions.map((s) => (
          <tr key={s.id}>
            <td>{s.className}</td>
            <td>{s.school}</td>
            <td>{s.date}</td>
            <td>{s.duration} min</td>
            <td className={`status ${s.status}`}>{s.status === 'upcoming' ? t('trainerSessions.upcoming') : t('trainerSessions.completed')}</td>
            <td>{s.studentsCount}</td>
            <td>
              <div className="action-buttons">
                <button 
                  className="show-btn"
                  onClick={(event) => handleShowSession(s, event)}
                  title={t('trainerSessions.show')}
                >
                  {t('trainerSessions.show')}
                </button>
                <button 
                  className="edit-btn"
                  onClick={(event) => handleEditSession(s, event)}
                  title={t('trainerSessions.edit')}
                >
                  {t('trainerSessions.edit')}
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  // Display loading indicator while sessions are being fetched
  if (loading) return <p className="loading">{t('trainerSessions.loadingSessions')}</p>;

  return (
    <div className="sessions-page">
      {/* Show auto-search info if prefilled from URL */}
      {autoSearchClass && (
        <div className="auto-search-info">
          <span>🔍 {t('trainerSessions.showingSessions')} <strong>{autoSearchClass}</strong></span>
          <button onClick={clearSearch} className="clear-auto-search-btn">
            {t('trainerSessions.showAllSessions')}
          </button>
        </div>
      )}
      
      {/* Search input area */}
      <div className="search-input-wrapper">
        <input
          type="text"
          placeholder={t('trainerSessions.searchSessions')}
          value={searchTerm}
          onChange={handleSearchChange}
          className="search-input"
        />
        {searchTerm && (
          <button onClick={clearSearch} className="clear-search-btn">
            ×
          </button>
        )}
      </div>
      
      {/* Summary of search results */}
      {searchTerm && (
        <div className="search-results-info">
          {t('trainerSessions.foundSessions')} {filteredPast.length + filteredUpcoming.length} {t('trainerSessions.sessionMatching')} "{searchTerm}"
        </div>
      )}

      {/* Upcoming Sessions Section */}
      <section className="session-section">
        <h2 className="section-title-sessions">{t('trainerSessions.upcomingSessions')}</h2>
        {filteredUpcoming.length === 0 ? (
          <p className="empty">
            {searchTerm ? `${t('trainerSessions.noUpcomingFound')} "${searchTerm}".` : t('trainerSessions.noUpcomingSessions')}
          </p>
        ) : (
          renderUpcomingTable(filteredUpcoming)
        )}
      </section>

      {/* Past Sessions Section */}
      <section className="session-section">
        <h2 className="section-title-sessions">{t('trainerSessions.pastSessions')}</h2>
        {filteredPast.length === 0 ? (
          <p className="empty">
            {searchTerm ? `${t('trainerSessions.noPastFound')} "${searchTerm}".` : t('trainerSessions.noPastSessions')}
          </p>
        ) : (
          renderPastTable(filteredPast)
        )}
      </section>

      {/* Session Detail Modal */}
      {showSessionModal && selectedSession && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="session-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('trainerSessions.sessionDetails')}</h3>
              <button className="close-btn" onClick={closeModal}>×</button>
            </div>
            
            <div className="modal-content">
              <div className="session-info">
                <h4>{t('trainerSessions.sessionInformation')}</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <label>{t('trainerSessions.date')}:</label>
                    <span>{selectedSession.date}</span>
                  </div>
                  <div className="info-item">
                    <label>{t('trainerSessions.startTime')}:</label>
                    <span>{selectedSession.fullData.startTime || t('trainerSessions.notSpecified')}</span>
                  </div>
                  <div className="info-item">
                    <label>{t('trainerSessions.duration')}:</label>
                    <span>{selectedSession.duration} {t('trainerSessions.minutes')}</span>
                  </div>
                  <div className="info-item">
                    <label>{t('trainerSessions.topic')}:</label>
                    <span>{selectedSession.topic || t('trainerSessions.notSpecified')}</span>
                  </div>
                  <div className="info-item">
                    <label>{t('trainerSessions.method')}:</label>
                    <span>{selectedSession.method || t('trainerSessions.notSpecified')}</span>
                  </div>
                  <div className="info-item">
                    <label>{t('trainerSessions.sessionNumber')}:</label>
                    <span>{selectedSession.fullData.sessionCount || t('trainerSessions.notSpecified')}</span>
                  </div>
                  <div className="info-item">
                    <label>{t('trainerSessions.school')}:</label>
                    <span>{selectedSession.school}</span>
                  </div>
                  <div className="info-item">
                    <label>{t('trainerSessions.class')}:</label>
                    <span>{selectedSession.className}</span>
                  </div>
                </div>
              </div>

              {/* Attendance section if students exist */}
              {students.length > 0 && (
                <div className="attendance-info">
                  <h4>{t('trainerSessions.attendance')}</h4>
                  <div className="student-list">
                    {students.map(student => (
                      <div key={student.id} className="student-item">
                        <span className="student-name">{student.fullName || student.id}</span>
                        <span className={`attendance-status ${selectedSession.fullData.attendance?.[student.id] ? 'present' : 'absent'}`}>
                          {selectedSession.fullData.attendance?.[student.id] ? t('trainerSessions.present') : t('trainerSessions.absent')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ratings display */}
              <div className="ratings-info">
                <h4>{t('trainerSessions.ratings')}</h4>
                <div className="ratings-grid">
                  <div className="rating-item">
                    <label>{t('trainerSessions.materialRating')}:</label>
                    <div className="stars">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className={selectedSession.fullData.materialRating >= star ? 'star filled' : 'star'}>
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="rating-item">
                    <label>{t('trainerSessions.studentRating')}:</label>
                    <div className="stars">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className={selectedSession.fullData.studentRating >= star ? 'star filled' : 'star'}>
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes if present */}
              {selectedSession.fullData.notes && (
                <div className="notes-info">
                  <h4>{t('trainerSessions.notes')}</h4>
                  <p>{selectedSession.fullData.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainerSessions;
