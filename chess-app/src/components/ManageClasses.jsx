import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';

const ManageClasses = ({ classes, users, setClasses, loading, setLoading, error, success, fetchClasses }) => {
  const [newClass, setNewClass] = useState({
    id: '',
    className: '',
    school: '',
    level: 'beginner',
    assignedTrainer: ''
  });
  const [searchQuery, setSearchQuery] = useState('');

  const handleClassChange = (e) => {
    setNewClass({ ...newClass, [e.target.name]: e.target.value });
  };

  const handleAddClass = async (e) => {
    e.preventDefault();
    setLoading(true);
    error('');
    success('');
    
    try {
      if (!newClass.id || !newClass.className) {
        error('Please fill required fields');
        setLoading(false);
        return;
      }

      await setDoc(doc(db, "classes", newClass.id), {
        className: newClass.className,
        school: newClass.school,
        level: newClass.level,
        assignedTrainer: newClass.assignedTrainer,
        createdAt: new Date()
      });

      success('Class added successfully!');
      setNewClass({
        id: '',
        className: '',
        school: '',
        level: 'beginner',
        assignedTrainer: ''
      });
      fetchClasses();
    } catch (err) {
      console.error("Error:", err);
      error(err.message);
    }
    setLoading(false);
  };

  const handleDeleteClass = async (classId) => {
    if (!window.confirm("Are you sure you want to delete this class?")) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, "classes", classId));
      success('Class deleted successfully');
      fetchClasses();
    } catch (err) {
      error('Failed to delete class');
    }
    setLoading(false);
  };

  // Filter classes based on search query with error handling
  const filteredClasses = (classes || []).filter(cls => {
    try {
      return (
        (cls.className || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cls.school || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cls.level || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    } catch (err) {
      console.error('Error filtering class:', err, cls);
      return false;
    }
  });

  return (
    <div className="class-management-container">
      <div className="add-user-section">
        <h2>Add New Class</h2>
        <form onSubmit={handleAddClass} className="add-user-form">
          <div className="form-row">
            <div className="form-group">
              <label>Class ID*</label>
              <input
                type="text"
                name="id"
                value={newClass.id}
                onChange={handleClassChange}
                placeholder="Class ID"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Class Name*</label>
              <input
                type="text"
                name="className"
                value={newClass.className}
                onChange={handleClassChange}
                placeholder="Class Name"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>School</label>
              <input
                type="text"
                name="school"
                value={newClass.school}
                onChange={handleClassChange}
                placeholder="School Name"
              />
            </div>
            
            <div className="form-group">
              <label>Level*</label>
              <select
                name="level"
                value={newClass.level}
                onChange={handleClassChange}
                required
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Assigned Trainer</label>
              <select
                name="assignedTrainer"
                value={newClass.assignedTrainer}
                onChange={handleClassChange}
              >
                <option value="">Select Trainer</option>
                {(users || []).filter(u => u.role === 'trainer').map(trainer => (
                  <option key={trainer.id} value={trainer.id}>
                    {trainer.firstName} {trainer.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="add-button"
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add Class'}
            </button>
          </div>
        </form>
      </div>

      <div className="user-list-section">
        <div className="users-list-header">
          <h3>Class List</h3>
          <div className="search-container">
            <input
              type="text"
              placeholder="Search classes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button 
              onClick={fetchClasses} 
              className="refresh-button"
              disabled={loading}
            >
              {loading ? 'Refreshing...' : '↻ Refresh List'}
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="loading-users">Loading classes...</div>
        ) : (
          <div className="users-table-wrapper">
            {filteredClasses.length > 0 ? (
              <table className="users-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Class Name</th>
                    <th>School</th>
                    <th>Level</th>
                    <th>Trainer</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClasses.map(cls => (
                    <tr key={cls.id}>
                      <td>{cls.id}</td>
                      <td>{cls.className}</td>
                      <td>{cls.school || '-'}</td>
                      <td>{cls.level}</td>
                      <td>
                        {cls.assignedTrainer && users && Array.isArray(users)
                          ? `${users.find(u => u.id === cls.assignedTrainer)?.firstName || ''} ${users.find(u => u.id === cls.assignedTrainer)?.lastName || ''}` || '-'
                          : '-'}
                      </td>
                      <td>
                        <div className="table-actions">
                          <button 
                            className="delete-button"
                            onClick={() => handleDeleteClass(cls.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="no-users">
                {searchQuery ? 'No classes match your search.' : 'No classes found. Add your first class.'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageClasses;