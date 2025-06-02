import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate, useLocation } from 'react-router-dom';
import './TrainerSessions.css';

const TrainerSessions = () => {
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

          // Handle date - check if it's a Timestamp object or string
          let displayDate = 'No Date';
          
          if (data.date) {
            // Check if it's a Firestore Timestamp object
            if (typeof data.date === 'object' && data.date.seconds) {
              // Convert Timestamp to readable date
              const dateObj = new Date(data.date.seconds * 1000);
              displayDate = dateObj.toLocaleDateString('en-US');
            } else if (typeof data.date === 'string') {
              // It's already a string, use it directly
              displayDate = data.date;
            } else {
              // Unknown format, convert to string safely
              displayDate = String(data.date);
            }
            
            // Add start time if available
            if (data.startTime) {
              displayDate = `${displayDate} ${data.startTime}`;
            }
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

  const handleRecordSession = (session, event) => {
    // Prevent row click when record button is clicked
    event.stopPropagation();
    
    navigate('/trainer-area/record-session', {
      state: {
        ...session,
        classId: session.fullData.classId,
        className: session.className,
        // Make sure the session ID is passed
        id: session.id,
        isRecording: true // Flag to indicate this is recording an upcoming session
      }
    });
  };

  const handleEditSession = (session, event) => {
    // Prevent row click when edit button is clicked
    event.stopPropagation();
    
    navigate('/trainer-area/record-session', {
      state: {
        ...session,
        classId: session.fullData.classId,
        className: session.className,
        // Make sure the session ID is passed
        id: session.id
      }
    });
  };

  const handleShowSession = async (session, event) => {
    // Prevent row click when show button is clicked
    event.stopPropagation();
    
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
          <th>Class</th>
          <th>School</th>
          <th>Date</th>
          <th>Duration</th>
          <th>Status</th>
          <th># Students</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {sessions.map((s) => (
          <tr key={s.id}>
            <td>{s.className}</td>
            <td>{s.school}</td>
            <td>{s.date}</td>
            <td>{s.duration} min</td>
            <td className={`status ${s.status}`}>{s.status.charAt(0).toUpperCase() + s.status.slice(1)}</td>
            <td>{s.studentsCount}</td>
            <td>
              <button 
                className="record-btn"
                onClick={(event) => handleRecordSession(s, event)}
                title="Record this session"
              >
                Record
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
          <th>Class</th>
          <th>School</th>
          <th>Date</th>
          <th>Duration</th>
          <th>Status</th>
          <th># Students</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {sessions.map((s) => (
          <tr key={s.id}>
            <td>{s.className}</td>
            <td>{s.school}</td>
            <td>{s.date}</td>
            <td>{s.duration} min</td>
            <td className={`status ${s.status}`}>{s.status.charAt(0).toUpperCase() + s.status.slice(1)}</td>
            <td>{s.studentsCount}</td>
            <td>
              <div className="action-buttons">
                <button 
                  className="show-btn"
                  onClick={(event) => handleShowSession(s, event)}
                  title="View session details"
                >
                  Show
                </button>
                <button 
                  className="edit-btn"
                  onClick={(event) => handleEditSession(s, event)}
                  title="Edit this session"
                >
                  Edit
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  if (loading) return <p className="loading">Loading sessions...</p>;

  return (
    <div className="sessions-page">
      {/* Search Section */}
      <div className="search-section">
        <div className="search-container">
          {autoSearchClass && (
            <div className="auto-search-info">
              <span>🔍 Showing sessions for class: <strong>{autoSearchClass}</strong></span>
              <button onClick={clearSearch} className="clear-auto-search-btn">
                Show All Sessions
              </button>
            </div>
          )}
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder="Search by school, class, date, or topic..."
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
              Found {filteredPast.length + filteredUpcoming.length} session(s) matching "{searchTerm}"
            </div>
          )}
        </div>
      </div>

      {/* Past Sessions appear first */}
      <section className="session-section">
        <h2 className="section-title">Past Sessions</h2>
        {filteredPast.length === 0 ? (
          <p className="empty">
            {searchTerm ? `No past sessions found matching "${searchTerm}".` : 'No past sessions.'}
          </p>
        ) : (
          renderPastTable(filteredPast)
        )}
      </section>

      {/* Upcoming Sessions appear second */}
      <section className="session-section">
        <h2 className="section-title">Upcoming Sessions</h2>
        {filteredUpcoming.length === 0 ? (
          <p className="empty">
            {searchTerm ? `No upcoming sessions found matching "${searchTerm}".` : 'No upcoming sessions.'}
          </p>
        ) : (
          renderUpcomingTable(filteredUpcoming)
        )}
      </section>

      {/* Session Details Modal */}
      {showSessionModal && selectedSession && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="session-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Session Details</h3>
              <button className="close-btn" onClick={closeModal}>×</button>
            </div>
            
            <div className="modal-content">
              <div className="session-info">
                <h4>Session Information</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Date:</label>
                    <span>{selectedSession.date}</span>
                  </div>
                  <div className="info-item">
                    <label>Start Time:</label>
                    <span>{selectedSession.fullData.startTime || 'Not specified'}</span>
                  </div>
                  <div className="info-item">
                    <label>Duration:</label>
                    <span>{selectedSession.duration} minutes</span>
                  </div>
                  <div className="info-item">
                    <label>Topic:</label>
                    <span>{selectedSession.topic || 'Not specified'}</span>
                  </div>
                  <div className="info-item">
                    <label>Method:</label>
                    <span>{selectedSession.method || 'Not specified'}</span>
                  </div>
                  <div className="info-item">
                    <label>Session Number:</label>
                    <span>{selectedSession.fullData.sessionCount || 'Not specified'}</span>
                  </div>
                  <div className="info-item">
                    <label>School:</label>
                    <span>{selectedSession.school}</span>
                  </div>
                  <div className="info-item">
                    <label>Class:</label>
                    <span>{selectedSession.className}</span>
                  </div>
                </div>
              </div>

              {students.length > 0 && (
                <div className="attendance-info">
                  <h4>Attendance</h4>
                  <div className="student-list">
                    {students.map(student => (
                      <div key={student.id} className="student-item">
                        <span className="student-name">{student.fullName || student.id}</span>
                        <span className={`attendance-status ${selectedSession.fullData.attendance?.[student.id] ? 'present' : 'absent'}`}>
                          {selectedSession.fullData.attendance?.[student.id] ? 'Present' : 'Absent'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="ratings-info">
                <h4>Ratings</h4>
                <div className="ratings-grid">
                  <div className="rating-item">
                    <label>Material Rating:</label>
                    <div className="stars">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className={selectedSession.fullData.materialRating >= star ? 'star filled' : 'star'}>
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="rating-item">
                    <label>Student Rating:</label>
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
                  <h4>Notes</h4>
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