import React, { useState, useEffect } from 'react';
import { db } from '../firebase';

import { doc, setDoc, deleteDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { logAdminAction } from '../utils/adminLogger';



const ManageStudents = ({ students, classes, setStudents, loading, setLoading, error, success, setError, setSuccess, fetchStudents }) => {
  // Debug logs
  console.log('ManageStudents props:', { 
    students: Array.isArray(students) ? `Array(${students.length})` : students,
    classes: Array.isArray(classes) ? `Array(${classes.length})` : classes,
    setStudents: typeof setStudents,
    loading,
    setLoading: typeof setLoading,
    error: typeof error,
    success: typeof success,
    setError: typeof setError,
    setSuccess: typeof setSuccess,
    fetchStudents: typeof fetchStudents
  });

  // Use the correct error and success functions
  const errorFunction = typeof setError === 'function' ? setError : (typeof error === 'function' ? error : () => {});
  const successFunction = typeof setSuccess === 'function' ? setSuccess : (typeof success === 'function' ? success : () => {});

  const [schools, setSchools] = useState([]);
  const [schoolsLoading, setSchoolsLoading] = useState(false);
  const [newStudent, setNewStudent] = useState({
    id: '',
    fullName: '',
    age: '',
    school: '',
    classId: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState('all');
  const [editingStudent, setEditingStudent] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Fetch schools from database
  const fetchSchools = async () => {
    setSchoolsLoading(true);
    try {
      const schoolsSnapshot = await getDocs(collection(db, "schools"));
      const schoolsData = schoolsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSchools(schoolsData);
    } catch (err) {
      console.error('Error fetching schools:', err);
      errorFunction('Failed to load schools data');
    } finally {
      setSchoolsLoading(false);
    }
  };

  // Fetch schools on component mount
  useEffect(() => {
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

  const handleStudentChange = (e) => {
    const { name, value } = e.target;
    
    // If school is changed, reset classId
    if (name === 'school') {
      setNewStudent({ 
        ...newStudent, 
        [name]: value,
        classId: '' // Reset class selection when school changes
      });
    } else {
      setNewStudent({ ...newStudent, [name]: value });
    }
  };

  // Filter classes based on selected school
  const getFilteredClasses = () => {
    if (!newStudent.school || !classes || !Array.isArray(classes)) {
      return [];
    }
    return classes.filter(cls => cls.school === newStudent.school);
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    console.log('handleAddStudent called - errorFunction:', typeof errorFunction);
    console.log('handleAddStudent called - successFunction:', typeof successFunction);
    
    errorFunction('');
    successFunction('');
    
    try {
      if (!newStudent.id || !newStudent.fullName || !newStudent.school || !newStudent.classId) {
        console.log('Validation failed - calling error function');
        errorFunction('Please fill all required fields: Student ID, Full Name, School, and Class');
        setLoading(false);
        return;
      }


      // Check if student ID already exists
      const existingStudent = (students || []).find(std => std.id === newStudent.id);
      if (existingStudent && !isEditing) {
        console.log('Student ID exists - calling error function');
        errorFunction(`A student with ID "${newStudent.id}" already exists. Please choose a different ID.`);
        setLoading(false);
        return;
      }

      if (isEditing) {
        await updateDoc(doc(db, "students", newStudent.id), {
          fullName: newStudent.fullName,
          age: Number(newStudent.age) || 0,
          school: newStudent.school,
          classId: newStudent.classId,
          updatedAt: new Date()
        });
          const currentAdmin = JSON.parse(localStorage.getItem('user'));
  await logAdminAction({
    admin: currentAdmin,
    actionType: 'update-student',
    targetType: 'student',
    targetId: newStudent.id,
    description: `Updated student ${newStudent.fullName}`
  });
        console.log('Student updated successfully - calling success function');
        successFunction('Student updated successfully!');
      } else {
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
        console.log('Student added successfully - calling success function');
        successFunction('Student added successfully!');
      }

      // Update local state
      if (setStudents && Array.isArray(students)) {
        if (isEditing) {
          setStudents(students.map(std => 
            std.id === newStudent.id 
              ? { ...std, ...newStudent, age: Number(newStudent.age) || 0, updatedAt: new Date() }
              : std
          ));
        } else {
          setStudents([...students, { ...newStudent, age: Number(newStudent.age) || 0, createdAt: new Date() }]);
        }
      }


      setNewStudent({
        id: '',
        fullName: '',
        age: '',
        school: '',
        classId: ''
      });
      setIsEditing(false);
      setEditingStudent(null);
      
      // קריאה ל-fetchStudents רק אם היא קיימת
      if (typeof fetchStudents === 'function') {
        fetchStudents();
      }
    } catch (err) {
      console.error("Error:", err);
      console.log('Caught error - calling error function');
      errorFunction(err.message);
    }
    setLoading(false);
  };

  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm("Are you sure you want to delete this student?")) return;
    setLoading(true);
    
    console.log('handleDeleteStudent called - errorFunction:', typeof errorFunction);
    console.log('handleDeleteStudent called - successFunction:', typeof successFunction);
    
    errorFunction('');
    successFunction('');
    
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


      console.log('Student deleted successfully - calling success function');
      successFunction('Student deleted successfully');
      
      // Update local state
      if (setStudents && Array.isArray(students)) {
        setStudents(students.filter(std => std.id !== studentId));
      }
      
      // קריאה ל-fetchStudents רק אם היא קיימת
      if (typeof fetchStudents === 'function') {
        fetchStudents();
      }

    } catch (err) {
      console.error("Error deleting student:", err);
      console.log('Caught delete error - calling error function');
      errorFunction('Failed to delete student: ' + err.message);
    }
    setLoading(false);
  };

  const handleEditStudent = (studentData) => {
    setNewStudent({
      id: studentData.id,
      fullName: studentData.fullName,
      age: studentData.age,
      school: studentData.school,
      classId: studentData.classId
    });
    setIsEditing(true);
    setEditingStudent(studentData.id);

    // Scroll to top smoothly
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

  const handleCancelEdit = () => {
    setNewStudent({
      id: '',
      fullName: '',
      age: '',
      school: '',
      classId: ''
    });
    setIsEditing(false);
    setEditingStudent(null);
    
    // Clear messages
    errorFunction('');
    successFunction('');
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchFilter('all');
  };

  // Enhanced filter function with category-specific search
  const filteredStudents = (students || []).filter(student => {
    try {
      if (!searchQuery.trim()) return true;
      
      const query = searchQuery.toLowerCase();
      
      switch (searchFilter) {
        case 'id':
          return (student.id || '').toLowerCase().includes(query);
        case 'name':
          return (student.fullName || '').toLowerCase().includes(query);
        case 'age':
          return (student.age || '').toString().includes(query);
        case 'school':
          return (student.school || '').toLowerCase().includes(query);
        case 'class':
          const className = classes && Array.isArray(classes)
            ? (classes.find(c => c.id === student.classId)?.className || '')
            : '';
          return className.toLowerCase().includes(query);
        case 'added':
          const dateStr = formatDate(student.createdAt).toLowerCase();
          return dateStr.includes(query);
        case 'all':
        default:
          const className2 = classes && Array.isArray(classes)
            ? (classes.find(c => c.id === student.classId)?.className || '')
            : '';
          const dateStr2 = formatDate(student.createdAt).toLowerCase();
          
          return (
            (student.id || '').toLowerCase().includes(query) ||
            (student.fullName || '').toLowerCase().includes(query) ||
            (student.age || '').toString().includes(query) ||
            (student.school || '').toLowerCase().includes(query) ||
            className2.toLowerCase().includes(query) ||
            dateStr2.includes(query)
          );
      }
    } catch (err) {
      console.error('Error filtering student:', err, student);
      return false;
    }
  }).sort((a, b) => {
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
      console.error('Error sorting students:', err);
      return 0;
    }
  });

  console.log('ManageStudents props:', { students, classes, searchQuery, filteredStudents });

  return (
    <div className="user-management-container">
      {/* Add Student Section */}
      <div className="add-user-section">
        <h2>{isEditing ? 'Edit Student' : 'Add New Student'}</h2>
        
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
                disabled={isEditing}
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
                min="5"
                max="25"
              />
            </div>
            
            <div className="form-group">
              <label>School*</label>
              <select
                name="school"
                value={newStudent.school}
                onChange={handleStudentChange}
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
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Class*</label>
              <select
                name="classId"
                value={newStudent.classId}
                onChange={handleStudentChange}
                required
                disabled={!newStudent.school}
              >
                <option value="">
                  {!newStudent.school 
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
              {newStudent.school && getFilteredClasses().length === 0 && (
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  No classes found for "{newStudent.school}". Add classes for this school first.
                </div>
              )}
            </div>
          </div>

          <div className="form-actions">
            {isEditing ? (
              <>
                <div className="edit-mode-info">
                  <div className="edit-indicator">
                    ✏️ Edit Mode
                  </div>
                  <div className="edit-description">
                    You are currently editing this student. Make your changes and click Save, or Cancel to discard changes.
                  </div>
                </div>
                <div className="edit-buttons-row">
                  <button 
                    type="submit" 
                    className="save-button"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button 
                    type="button" 
                    className="cancel-button"
                    onClick={handleCancelEdit}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <button 
                type="submit" 
                className="add-button"
                disabled={loading}
              >
                {loading ? 'Adding...' : 'Add Student'}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Students List Section */}
      <div className="user-list-section">
        <div className="users-list-header">
          <h3>Students List ({filteredStudents.length})</h3>
          <div className="users-search-container">
            <div className="users-search-filter-row">
              <select
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="users-filter-select"
              >
                <option value="all">All Fields</option>
                <option value="id">Student ID</option>
                <option value="name">Full Name</option>
                <option value="age">Age</option>
                <option value="school">School</option>
                <option value="class">Class</option>
                <option value="added">Added Date</option>
              </select>
              
              <input
                type="text"
                placeholder={`Search ${searchFilter === 'all' ? 'all fields' : 
                  searchFilter === 'id' ? 'student ID' :
                  searchFilter === 'name' ? 'full name' :
                  searchFilter === 'age' ? 'age' :
                  searchFilter === 'school' ? 'school' :
                  searchFilter === 'class' ? 'class' :
                  searchFilter === 'added' ? 'date' : 'students'}...`}
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
                if (typeof fetchStudents === 'function') {
                  fetchStudents();
                } else {
                  console.warn('fetchStudents function is not available');
                }
                fetchSchools(); // Also refresh schools
              }} 
              className="refresh-button"
              disabled={loading}
            >
              {loading ? 'Refreshing...' : '↻ Refresh'}
            </button>
          </div>
        </div>

        {(searchQuery || searchFilter !== 'all') && (
          <div className="search-results-info">
            Showing {filteredStudents.length} of {(students || []).length} students
            {searchQuery && ` matching "${searchQuery}"`}
            {searchFilter !== 'all' && ` in ${
              searchFilter === 'id' ? 'student ID' :
              searchFilter === 'name' ? 'full name' :
              searchFilter === 'age' ? 'age' :
              searchFilter === 'school' ? 'school' :
              searchFilter === 'class' ? 'class' :
              searchFilter === 'added' ? 'added date' : searchFilter
            }`}
          </div>
        )}
        
        {loading ? (
          <div className="loading-users">Loading students...</div>
        ) : (
          <div className="users-table-wrapper">
            {filteredStudents.length > 0 ? (
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Student ID</th>
                    <th>Full Name</th>
                    <th>Age</th>
                    <th>School</th>
                    <th>Class</th>
                    <th>Added</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map(student => {
                    const studentClass = classes && Array.isArray(classes)
                      ? classes.find(c => c.id === student.classId)
                      : null;
                    
                    return (
                      <tr key={student.id}>
                        <td>{student.id}</td>
                        <td>{student.fullName}</td>
                        <td>{student.age || '-'}</td>
                        <td>{student.school}</td>
                        <td>
                          {studentClass 
                            ? studentClass.className
                            : 'Unknown'}
                        </td>
                        <td>{formatDate(student.createdAt)}</td>
                        <td>
                          <div className="table-actions">
                            <button 
                              className="edit-button"
                              onClick={() => handleEditStudent(student)}
                              disabled={loading}
                            >
                              Edit
                            </button>
                            <button 
                              className="delete-button"
                              onClick={() => handleDeleteStudent(student.id)}
                              disabled={loading}
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
                  ? `No students match your search criteria.` 
                  : 'No students found. Add your first student.'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageStudents;