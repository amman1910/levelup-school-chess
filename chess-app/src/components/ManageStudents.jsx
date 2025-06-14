import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { logAdminAction } from '../utils/adminLogger';


const ManageStudents = ({ students, classes, setStudents, loading, setLoading, error, success, fetchStudents }) => {
  const [newStudent, setNewStudent] = useState({
    id: '',
    fullName: '',
    age: '',
    school: '',
    classId: ''
  });
  const [searchQuery, setSearchQuery] = useState('');

  const handleStudentChange = (e) => {
    setNewStudent({ ...newStudent, [e.target.name]: e.target.value });
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    setLoading(true);
    error('');
    success('');
    
    try {
      if (!newStudent.id || !newStudent.fullName || !newStudent.school || !newStudent.classId) {
        error('Please fill all required fields');
        setLoading(false);
        return;
      }

      await setDoc(doc(db, "students", newStudent.id), {
        fullName: newStudent.fullName,
        age: Number(newStudent.age) || 0,
        school: newStudent.school,
        classId: newStudent.classId,
        createdAt: new Date()
      });
      const currentAdmin = JSON.parse(localStorage.getItem('user'));
      await logAdminAction({
         admin: currentAdmin,
         actionType: 'add-student',
         targetType: 'student',
         targetId: newStudent.id,
         description: `Added student ${newStudent.fullName} to class ${newStudent.classId}`
});

      success('Student added successfully!');
      setNewStudent({
        id: '',
        fullName: '',
        age: '',
        school: '',
        classId: ''
      });
      fetchStudents();
    } catch (err) {
      console.error("Error:", err);
      error(err.message);
    }
    setLoading(false);
  };

  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm("Are you sure you want to delete this student?")) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, "students", studentId));
      const currentAdmin = JSON.parse(localStorage.getItem('user'));
      await logAdminAction({
          admin: currentAdmin,
          actionType: 'delete-student',
          targetType: 'student',
          targetId: studentId,
          description: `Deleted student with ID ${studentId}`
});

      success('Student deleted successfully');
      fetchStudents();
    } catch (err) {
      error('Failed to delete student');
    }
    setLoading(false);
  };

  // Filter students based on search query with error handling
  const filteredStudents = (students || []).filter(student => {
    try {
      const className = classes && Array.isArray(classes)
        ? (classes.find(c => c.id === student.classId)?.className || '')
        : '';
      console.log('Filtering student:', { fullName: student.fullName, school: student.school, className, searchQuery });
      return (
        (student.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (student.school || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        className.toLowerCase().includes(searchQuery.toLowerCase())
      );
    } catch (err) {
      console.error('Error filtering student:', err, student);
      return false; // Skip problematic student to prevent crash
    }
  });

  console.log('ManageStudents props:', { students, classes, searchQuery, filteredStudents });

  return (
    <div className="student-management-container">
      <div className="add-user-section">
        <h2>Add New Student</h2>
        <form onSubmit={handleAddStudent} className="add-user-form">
          <div className="form-row">
            <div className="form-group">
              <label>Student ID*</label>
              <input
                type="text"
                name="id"
                value={newStudent.id}
                onChange={handleStudentChange}
                placeholder="Student ID"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Full Name*</label>
              <input
                type="text"
                name="fullName"
                value={newStudent.fullName}
                onChange={handleStudentChange}
                placeholder="Full Name"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Age</label>
              <input
                type="number"
                name="age"
                value={newStudent.age}
                onChange={handleStudentChange}
                placeholder="Age"
              />
            </div>
            
            <div className="form-group">
              <label>School*</label>
              <input
                type="text"
                name="school"
                value={newStudent.school}
                onChange={handleStudentChange}
                placeholder="School Name"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Class*</label>
              <select
                name="classId"
                value={newStudent.classId}
                onChange={handleStudentChange}
                required
              >
                <option value="">Select Class</option>
                {classes && Array.isArray(classes) ? (
                  classes.map(cls => (
                    <option key={cls.id} value={cls.id}>
                      {cls.className} ({cls.school})
                    </option>
                  ))
                ) : (
                  <option value="">No classes available</option>
                )}
              </select>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="add-button" disabled={loading}>
              {loading ? 'Adding...' : 'Add Student'}
            </button>
          </div>
        </form>
      </div>

      <div className="user-list-section">
        <div className="users-list-header">
          <h3>Students List</h3>
          <div className="search-container">
            <input
              type="text"
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button onClick={fetchStudents} className="refresh-button" disabled={loading}>
              {loading ? 'Refreshing...' : '↻ Refresh List'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-users">Loading students...</div>
        ) : (
          <div className="users-table-wrapper">
            {filteredStudents.length > 0 ? (
              <table className="users-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Age</th>
                    <th>School</th>
                    <th>Class</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map(student => (
                    <tr key={student.id}>
                      <td>{student.id}</td>
                      <td>{student.fullName}</td>
                      <td>{student.age || '-'}</td>
                      <td>{student.school}</td>
                      <td>
                        {classes && Array.isArray(classes)
                          ? (classes.find(c => c.id === student.classId)?.className || 'Unknown')
                          : 'Unknown'}
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="delete-button"
                            onClick={() => handleDeleteStudent(student.id)}
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
                {searchQuery ? 'No students match your search.' : 'No students found. Add your first student.'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageStudents;