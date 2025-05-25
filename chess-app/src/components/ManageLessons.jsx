import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import './AdminArea.css';

const ManageLessons = ({ classes }) => {
  const [lessons, setLessons] = useState([]);
  const [newLesson, setNewLesson] = useState({
    date: '',
    startTime: '16:00',
    classId: classes.length > 0 ? classes[0].id : '', // Default to first class if available
    topic: '',
    duration: 60,
    status: 'planned'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Debugging logs
  console.log('Classes received:', classes);
  console.log('Initial lessons state:', lessons);

  const formatDate = (date) => {
    try {
      if (!date) return '-';
      const d = date?.toDate ? date.toDate() : new Date(date?.seconds * 1000 || date);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (err) {
      console.error('Date formatting error:', err);
      return '-';
    }
  };

  const fetchLessons = async () => {
    console.log('Fetching lessons...');
    try {
      setLoading(true);
      setError('');
      const querySnapshot = await getDocs(collection(db, "lessons"));
      console.log('Firestore response:', querySnapshot);
      
      const lessonsData = [];
      querySnapshot.forEach((doc) => {
        try {
          const data = doc.data();
          lessonsData.push({
            id: doc.id,
            date: data.date,
            startTime: data.startTime || '-',
            classId: data.classId,
            topic: data.topic || '-',
            duration: data.duration || 60,
            status: data.status || 'planned'
          });
        } catch (e) {
          console.error('Error processing document:', doc.id, e);
        }
      });
      
      console.log('Processed lessons:', lessonsData);
      setLessons(lessonsData);
    } catch (err) {
      console.error("Error fetching lessons:", err);
      setError("Failed to load lessons. Please check console for details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('Component mounted, fetching lessons...');
    fetchLessons();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      if (!newLesson.date || !newLesson.classId || !newLesson.topic) {
        throw new Error('Please fill all required fields');
      }

      const lessonId = `lesson_${Date.now()}`;
      console.log('Adding lesson:', newLesson);
      
      await setDoc(doc(db, "lessons", lessonId), {
        ...newLesson,
        date: new Date(newLesson.date),
        duration: Number(newLesson.duration),
        createdAt: new Date()
      });

      setSuccess('Lesson added successfully!');
      setNewLesson({
        date: '',
        startTime: '16:00',
        classId: classes.length > 0 ? classes[0].id : '',
        topic: '',
        duration: 60,
        status: 'planned'
      });
      await fetchLessons();
    } catch (err) {
      console.error("Error adding lesson:", err);
      setError(err.message || 'Failed to add lesson');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-message">Loading lessons...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <button onClick={fetchLessons}>Retry Loading</button>
      </div>
    );
  }

  return (
    <div className="lesson-management-container">
      <div className="add-user-section">
        <h2>Add New Lesson</h2>
        {success && <div className="success-message">{success}</div>}
        
        <form onSubmit={handleSubmit} className="add-user-form">
          <div className="form-row">
            <div className="form-group">
              <label>Date*</label>
              <input
                type="date"
                name="date"
                value={newLesson.date}
                onChange={(e) => setNewLesson({...newLesson, date: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Start Time*</label>
              <input
                type="time"
                name="startTime"
                value={newLesson.startTime}
                onChange={(e) => setNewLesson({...newLesson, startTime: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Class*</label>
              <select
                name="classId"
                value={newLesson.classId}
                onChange={(e) => setNewLesson({...newLesson, classId: e.target.value})}
                required
              >
                {classes.length > 0 ? (
                  classes.map(cls => (
                    <option key={cls.id} value={cls.id}>
                      {cls.className} ({cls.level})
                    </option>
                  ))
                ) : (
                  <option value="">No classes available</option>
                )}
              </select>
            </div>
            <div className="form-group">
              <label>Duration (minutes)*</label>
              <input
                type="number"
                name="duration"
                min="30"
                max="180"
                step="15"
                value={newLesson.duration}
                onChange={(e) => setNewLesson({...newLesson, duration: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Topic*</label>
              <input
                type="text"
                name="topic"
                value={newLesson.topic}
                onChange={(e) => setNewLesson({...newLesson, topic: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select
                name="status"
                value={newLesson.status}
                onChange={(e) => setNewLesson({...newLesson, status: e.target.value})}
              >
                <option value="planned">Planned</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="add-button"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Add Lesson'}
            </button>
          </div>
        </form>
      </div>

      <div className="user-list-section">
        <div className="users-list-header">
          <h3>Lesson Schedule</h3>
          <div className="search-container">
            <input
              type="text"
              placeholder="Search lessons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button 
              onClick={fetchLessons} 
              className="refresh-button"
              disabled={loading}
            >
              {loading ? 'Refreshing...' : '↻ Refresh'}
            </button>
          </div>
        </div>

        {lessons.length === 0 ? (
          <div className="no-lessons-message">
            No lessons found. Add your first lesson above.
          </div>
        ) : (
          <table className="users-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Class</th>
                <th>Topic</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {lessons.map(lesson => {
                const classInfo = classes.find(c => c.id === lesson.classId) || {};
                return (
                  <tr key={lesson.id}>
                    <td>{formatDate(lesson.date)}</td>
                    <td>{lesson.startTime}</td>
                    <td>{classInfo.className || 'Unknown Class'}</td>
                    <td>{lesson.topic}</td>
                    <td>{lesson.duration} min</td>
                    <td>
                      <span className={`status-badge ${lesson.status}`}>
                        {lesson.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="delete-button"
                        onClick={() => handleDelete(lesson.id)}
                        disabled={loading}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ManageLessons;