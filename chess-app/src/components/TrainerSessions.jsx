import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next'; // הוספת useTranslation
import { collection, getDocs, doc, getDoc, query, where, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate, useLocation } from 'react-router-dom';
import './TrainerSessions.css';

const TrainerSessions = () => {
  const { t } = useTranslation(); // הוספת hook לתרגום
  const [upcoming, setUpcoming] = useState([]);
  const [past, setPast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPast, setFilteredPast] = useState([]);
  const [filteredUpcoming, setFilteredUpcoming] = useState([]);
  const [autoSearchClass, setAutoSearchClass] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // פונקציה לרישום פעולות ב-adminLogs
  const logTrainerAction = async (actionType, description, targetId = null) => {
    try {
      // קבלת פרטי המשתמש הנוכחי
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const trainerName = `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.email || 'Unknown Trainer';

      const logEntry = {
        actionType,
        adminName: trainerName, // משתמשים באותו שדה כמו באדמין
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
      // אל תעצור את הפעולה אם הלוג נכשל
    }
  };

  // Helper function to format Timestamp to D/M/Y
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

  // Helper function to parse date for sorting
  const parseDateForSorting = (date, startTime) => {
    let dateObj;
    
    if (typeof date === 'object' && date.seconds) {
      // Firestore Timestamp
      dateObj = new Date(date.seconds * 1000);
    } else if (typeof date === 'string') {
      // String date
      dateObj = new Date(date);
    } else {
      // Fallback
      dateObj = new Date();
    }
    
    // If startTime is provided, try to add it to the date for more accurate sorting
    if (startTime && typeof startTime === 'string') {
      const [hours, minutes] = startTime.split(':');
      if (hours && minutes) {
        dateObj.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      }
    }
    
    return dateObj;
  };

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
          
          // Get class information
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

          // Get school name directly from schoolId (which contains the school name)
          const schoolName = data.schoolId || '[No School]';

          // Format date for display
          let displayDate = formatTimestampToDisplay(data.date);
          
          // Add start time if available
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

        // Split sessions by status and sort by date
        const completedSessions = sessionsList
          .filter(s => s.status === 'completed')
          .sort((a, b) => {
            // Parse dates for comparison
            const dateA = parseDateForSorting(a.fullData.date, a.fullData.startTime);
            const dateB = parseDateForSorting(b.fullData.date, b.fullData.startTime);
            return dateA - dateB; // Oldest first, newest last
          });
          
        const upcomingSessions = sessionsList
          .filter(s => s.status === 'upcoming')
          .sort((a, b) => {
            // Parse dates for comparison
            const dateA = parseDateForSorting(a.fullData.date, a.fullData.startTime);
            const dateB = parseDateForSorting(b.fullData.date, b.fullData.startTime);
            return dateA - dateB; // Oldest first, newest last
          });

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

  // Check for search parameter from navigation
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const classNameParam = searchParams.get('searchClass');
    if (classNameParam) {
      setSearchTerm(classNameParam);
      setAutoSearchClass(classNameParam);
    }
  }, [location.search]);

  // Filter sessions based on search term
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

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setAutoSearchClass('');
    // Clear URL parameters
    navigate('/trainer-area/sessions', { replace: true });
  };

  const handleRecordSession = async (session, event) => {
    // Prevent row click when record button is clicked
    event.stopPropagation();
    
    // רישום פעולה ב-adminLogs
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
        // Make sure the session ID is passed
        id: session.id,
        isRecording: true, // Flag to indicate this is recording an upcoming session
        // Pass the original Timestamp for proper handling in the form
        originalDate: session.fullData.date,
        originalStartTime: session.fullData.startTime
      }
    });
  };

  const handleEditSession = async (session, event) => {
    // Prevent row click when edit button is clicked
    event.stopPropagation();
    
    // רישום פעולה ב-adminLogs
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
        // Make sure the session ID is passed
        id: session.id,
        // Pass the original Timestamp for proper handling in the form
        originalDate: session.fullData.date,
        originalStartTime: session.fullData.startTime
      }
    });
  };

  const handleShowSession = async (session, event) => {
    // Prevent row click when show button is clicked
    event.stopPropagation();
    
    // רישום פעולה ב-adminLogs
    await logTrainerAction(
      'view-session',
      `Viewed session details for class "${session.className}" from ${session.date}`,
      session.id
    );
    
    setSelectedSession(session);
    
    // Fetch students for this session
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

  const closeModal = () => {
    setShowSessionModal(false);
    setSelectedSession(null);
    setStudents([]);
  };

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

  if (loading) return <p className="loading">{t('trainerSessions.loadingSessions')}</p>;

  return (
    <div className="sessions-page">
      {/* Search Section - Simplified */}
      {autoSearchClass && (
        <div className="auto-search-info">
          <span>🔍 {t('trainerSessions.showingSessions')} <strong>{autoSearchClass}</strong></span>
          <button onClick={clearSearch} className="clear-auto-search-btn">
            {t('trainerSessions.showAllSessions')}
          </button>
        </div>
      )}
      
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
      
      {searchTerm && (
        <div className="search-results-info">
          {t('trainerSessions.foundSessions')} {filteredPast.length + filteredUpcoming.length} {t('trainerSessions.sessionMatching')} "{searchTerm}"
        </div>
      )}

      {/* Upcoming Sessions appear first */}
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

      {/* Past Sessions appear second */}
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

      {/* Session Details Modal */}
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