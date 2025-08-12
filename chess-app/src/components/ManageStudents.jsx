import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next'; 
import { db } from '../firebase';
import { doc, setDoc, deleteDoc, updateDoc, collection, getDocs, getDoc } from 'firebase/firestore';
import { logAdminAction } from '../utils/adminLogger';

const ManageStudents = ({ students, classes, setStudents, loading, setLoading, error, success, setError, setSuccess, fetchStudents }) => {
  const { t } = useTranslation(); 
  
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

  const errorFunction = typeof setError === 'function' ? setError : (typeof error === 'function' ? error : () => {});
  const successFunction = typeof setSuccess === 'function' ? setSuccess : (typeof success === 'function' ? success : () => {});

  const [schools, setSchools] = useState([]);
  const [schoolsLoading, setSchoolsLoading] = useState(false);
  const [newStudent, setNewStudent] = useState({
    id: '',
    fullName: '',
    grade: '',
    contact_number: '',
    school: '',
    classId: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState('all');
  const [editingStudent, setEditingStudent] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Grade options A-L
  const gradeOptions = [
    { value: 'Grade A', label: t('adminStudents.gradeA') },
    { value: 'Grade B', label: t('adminStudents.gradeB') },
    { value: 'Grade C', label: t('adminStudents.gradeC') },
    { value: 'Grade D', label: t('adminStudents.gradeD') },
    { value: 'Grade E', label: t('adminStudents.gradeE') },
    { value: 'Grade F', label: t('adminStudents.gradeF') },
    { value: 'Grade G', label: t('adminStudents.gradeG') },
    { value: 'Grade H', label: t('adminStudents.gradeH') },
    { value: 'Grade I', label: t('adminStudents.gradeI') },
    { value: 'Grade J', label: t('adminStudents.gradeJ') },
    { value: 'Grade K', label: t('adminStudents.gradeK') },
    { value: 'Grade L', label: t('adminStudents.gradeL') }
  ];

  // Fetch schools from database
  const fetchSchools = async () => {
    setSchoolsLoading(true);
    try {
      const schoolsSnapshot = await getDocs(collection(db, "schools"));
      const schoolsData = schoolsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSchools(schoolsData);
    } catch (err) {
      console.error('Error fetching schools:', err);
      errorFunction(t('adminStudents.failedToLoadSchools'));
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
      if (!newStudent.id || !newStudent.fullName) {
        console.log('Validation failed - calling error function');
        errorFunction(t('adminStudents.fillAllRequiredFields'));
        setLoading(false);
        return;
      }

      // Check if student ID already exists
      const existingStudent = (students || []).find(std => std.id === newStudent.id);
      if (existingStudent && !isEditing) {
        console.log('Student ID exists - calling error function');
        errorFunction(t('adminStudents.studentIdExists', { id: newStudent.id }));
        setLoading(false);
        return;
      }

      if (isEditing) {
        await updateDoc(doc(db, "students", newStudent.id), {
          fullName: newStudent.fullName,
          grade: newStudent.grade,
          contact_number: newStudent.contact_number,
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
        successFunction(t('adminStudents.studentUpdatedSuccessfully'));
      } else {
        await setDoc(doc(db, "students", newStudent.id), {
          fullName: newStudent.fullName,
          grade: newStudent.grade,
          contact_number: newStudent.contact_number,
          school: newStudent.school,
          classId: newStudent.classId,
          sessions_attended: 0,
          createdAt: new Date()
        });

        // Update the class document to add student ID to studentsId array
        try {
          const classRef = doc(db, "classes", newStudent.classId);
          const classDoc = await getDoc(classRef);
          if (classDoc.exists()) {
            const currentStudentsId = classDoc.data().studentsId || [];
            if (!currentStudentsId.includes(newStudent.id)) {
              await updateDoc(classRef, {
                studentsId: [...currentStudentsId, newStudent.id]
              });
            }
          }
        } catch (classUpdateError) {
          console.error('Error updating class studentsId:', classUpdateError);
          // Don't fail the entire operation if class update fails
        }

        const currentAdmin = JSON.parse(localStorage.getItem('user'));
        await logAdminAction({
          admin: currentAdmin,
          actionType: 'add-student',
          targetType: 'student',
          targetId: newStudent.id,
          description: `Added student ${newStudent.fullName} to class ${newStudent.classId}`
        });
        
        console.log('Student added successfully - calling success function');
        successFunction(t('adminStudents.studentAddedSuccessfully'));
      }

      // Update local state
      if (setStudents && Array.isArray(students)) {
        if (isEditing) {
          setStudents(students.map(std => 
            std.id === newStudent.id 
              ? { ...std, ...newStudent, updatedAt: new Date() }
              : std
          ));
        } else {
          setStudents([...students, { ...newStudent, sessions_attended: 0, createdAt: new Date() }]);
        }
      }

      setNewStudent({
        id: '',
        fullName: '',
        grade: '',
        contact_number: '',
        school: '',
        classId: ''
      });
      setIsEditing(false);
      setEditingStudent(null);
      
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
    if (!window.confirm(t('adminStudents.confirmDeleteStudent'))) return;
    setLoading(true);
    
    console.log('handleDeleteStudent called - errorFunction:', typeof errorFunction);
    console.log('handleDeleteStudent called - successFunction:', typeof successFunction);
    
    errorFunction('');
    successFunction('');
    
    try {
      // Get student data first to know which class to update
      const studentDoc = await getDoc(doc(db, "students", studentId));
      const studentData = studentDoc.exists() ? studentDoc.data() : null;
      
      await deleteDoc(doc(db, "students", studentId));

      // Remove student from class studentsId array
      if (studentData && studentData.classId) {
        try {
          const classRef = doc(db, "classes", studentData.classId);
          const classDoc = await getDoc(classRef);
          if (classDoc.exists()) {
            const currentStudentsId = classDoc.data().studentsId || [];
            const updatedStudentsId = currentStudentsId.filter(id => id !== studentId);
            await updateDoc(classRef, {
              studentsId: updatedStudentsId
            });
          }
        } catch (classUpdateError) {
          console.error('Error updating class studentsId on delete:', classUpdateError);
          // Don't fail the entire operation if class update fails
        }
      }

      const currentAdmin = JSON.parse(localStorage.getItem('user'));
      await logAdminAction({
        admin: currentAdmin,
        actionType: 'delete-student',
        targetType: 'student',
        targetId: studentId,
        description: `Deleted student with ID ${studentId}`
      });

      console.log('Student deleted successfully - calling success function');
      successFunction(t('adminStudents.studentDeletedSuccessfully'));
      
      // Update local state
      if (setStudents && Array.isArray(students)) {
        setStudents(students.filter(std => std.id !== studentId));
      }
      
      if (typeof fetchStudents === 'function') {
        fetchStudents();
      }

    } catch (err) {
      console.error("Error deleting student:", err);
      console.log('Caught delete error - calling error function');
      errorFunction(t('adminStudents.failedToDeleteStudent') + ': ' + err.message);
    }
    setLoading(false);
  };

  const handleEditStudent = (studentData) => {
    setNewStudent({
      id: studentData.id,
      fullName: studentData.fullName,
      grade: studentData.grade,
      contact_number: studentData.contact_number,
      school: studentData.school,
      classId: studentData.classId
    });
    setIsEditing(true);
    setEditingStudent(studentData.id);

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

  const handleCancelEdit = () => {
    setNewStudent({
      id: '',
      fullName: '',
      grade: '',
      contact_number: '',
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
        case 'grade':
          return (student.grade || '').toLowerCase().includes(query);
        case 'contact':
          return (student.contact_number || '').toLowerCase().includes(query);
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
            (student.grade || '').toLowerCase().includes(query) ||
            (student.contact_number || '').toLowerCase().includes(query) ||
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
        <h2>{isEditing ? t('adminStudents.editStudent') : t('adminStudents.addNewStudent')}</h2>
        
        <form onSubmit={handleAddStudent} className="add-user-form">
          <div className="form-row">
            <div className="form-group">
              <label>{t('adminStudents.studentIdRequired')}</label>
              <input
                type="text"
                name="id"
                value={newStudent.id}
                onChange={handleStudentChange}
                placeholder={t('adminStudents.studentIdPlaceholder')}
                required
                disabled={isEditing}
              />
            </div>
            
            <div className="form-group">
              <label>{t('adminStudents.fullNameRequired')}</label>
              <input
                type="text"
                name="fullName"
                value={newStudent.fullName}
                onChange={handleStudentChange}
                placeholder={t('adminStudents.fullNamePlaceholder')}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>{t('adminStudents.grade')}</label>
              <select
                name="grade"
                value={newStudent.grade}
                onChange={handleStudentChange}
              >
                <option value="">{t('adminStudents.selectGrade')}</option>
                {gradeOptions.map(grade => (
                  <option key={grade.value} value={grade.value}>
                    {grade.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>{t('adminStudents.contactNumber')}</label>
              <input
                type="tel"
                name="contact_number"
                value={newStudent.contact_number}
                onChange={handleStudentChange}
                placeholder={t('adminStudents.contactNumberPlaceholder')}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>{t('adminStudents.school')}</label>
              <select
                name="school"
                value={newStudent.school}
                onChange={handleStudentChange}
              >
                <option value="">
                  {schoolsLoading 
                    ? t('adminStudents.loadingSchools')
                    : schools.length === 0 
                      ? t('adminStudents.noSchoolsAvailable')
                      : t('adminStudents.selectSchool')}
                </option>
                {schools.map(school => (
                  <option key={school.id} value={school.name}>
                    {school.name}
                  </option>
                ))}
              </select>
              {schools.length === 0 && !schoolsLoading && (
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  {t('adminStudents.noSchoolsFoundAddFirst')}
                </div>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>{t('adminStudents.class')}</label>
              <select
                name="classId"
                value={newStudent.classId}
                onChange={handleStudentChange}
                disabled={!newStudent.school}
              >
                <option value="">
                  {!newStudent.school 
                    ? t('adminStudents.selectSchoolFirst')
                    : getFilteredClasses().length === 0 
                      ? t('adminStudents.noClassesAvailableForSchool')
                      : t('adminStudents.selectClass')}
                </option>
                {getFilteredClasses().map(cls => (
                  <option key={cls.id} value={cls.id}>
                    {cls.className} ({cls.level})
                  </option>
                ))}
              </select>
              {newStudent.school && getFilteredClasses().length === 0 && (
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  {t('adminStudents.noClassesFoundForSchool', { school: newStudent.school })}
                </div>
              )}
            </div>
          </div>

          <div className="form-actions">
            {isEditing ? (
              <>
                <div className="edit-mode-info">
                  <div className="edit-indicator">
                    ✏️ {t('adminStudents.editMode')}
                  </div>
                  <div className="edit-description">
                    {t('adminStudents.editModeDescription')}
                  </div>
                </div>
                <div className="edit-buttons-row">
                  <button 
                    type="submit" 
                    className="save-button"
                    disabled={loading}
                  >
                    {loading ? t('adminStudents.saving') + '...' : t('adminStudents.saveChanges')}
                  </button>
                  <button 
                    type="button" 
                    className="cancel-button"
                    onClick={handleCancelEdit}
                    disabled={loading}
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </>
            ) : (
              <button 
                type="submit" 
                className="add-button"
                disabled={loading}
              >
                {loading ? t('adminStudents.adding') + '...' : t('adminStudents.addStudent')}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Students List Section */}
      <div className="user-list-section">
        <div className="users-list-header">
          <h3>{t('adminStudents.studentsList', { count: filteredStudents.length })}</h3>
          <div className="users-search-container">
            <div className="users-search-filter-row">
              <select
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="users-filter-select"
              >
                <option value="all">{t('adminStudents.allFields')}</option>
                <option value="id">{t('adminStudents.studentId')}</option>
                <option value="name">{t('adminStudents.fullName')}</option>
                <option value="grade">{t('adminStudents.grade')}</option>
                <option value="contact">{t('adminStudents.contact')}</option>
                <option value="school">{t('adminStudents.school')}</option>
                <option value="class">{t('adminStudents.class')}</option>
                <option value="added">{t('adminStudents.addedDate')}</option>
              </select>
              
              <input
                type="text"
                placeholder={t('adminStudents.searchPlaceholder', { 
                  field: searchFilter === 'all' ? t('adminStudents.allFields').toLowerCase() : 
                    searchFilter === 'id' ? t('adminStudents.studentId').toLowerCase() :
                    searchFilter === 'name' ? t('adminStudents.fullName').toLowerCase() :
                    searchFilter === 'grade' ? t('adminStudents.grade').toLowerCase() :
                    searchFilter === 'contact' ? t('adminStudents.contactNumber').toLowerCase() :
                    searchFilter === 'school' ? t('adminStudents.school').toLowerCase() :
                    searchFilter === 'class' ? t('adminStudents.class').toLowerCase() :
                    searchFilter === 'added' ? t('adminStudents.addedDate').toLowerCase() : 'students'
                })}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="users-search-input"
              />
              
              {(searchQuery || searchFilter !== 'all') && (
                <button 
                  onClick={clearSearch}
                  className="users-clear-search-button"
                  title={t('adminStudents.clearSearch')}
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
              {loading ? t('adminStudents.refreshing') + '...' : '↻ ' + t('adminStudents.refresh')}
            </button>
          </div>
        </div>

        {(searchQuery || searchFilter !== 'all') && (
          <div className="search-results-info">
            {t('adminStudents.showingResults', { 
              filtered: filteredStudents.length, 
              total: (students || []).length,
              query: searchQuery,
              field: searchFilter !== 'all' ? (
                searchFilter === 'id' ? t('adminStudents.studentId').toLowerCase() :
                searchFilter === 'name' ? t('adminStudents.fullName').toLowerCase() :
                searchFilter === 'grade' ? t('adminStudents.grade').toLowerCase() :
                searchFilter === 'contact' ? t('adminStudents.contactNumber').toLowerCase() :
                searchFilter === 'school' ? t('adminStudents.school').toLowerCase() :
                searchFilter === 'class' ? t('adminStudents.class').toLowerCase() :
                searchFilter === 'added' ? t('adminStudents.addedDate').toLowerCase() : searchFilter
              ) : ''
            })}
          </div>
        )}
        
        {loading ? (
          <div className="loading-users">{t('adminStudents.loadingStudents')}</div>
        ) : (
          <div className="users-table-wrapper">
            {filteredStudents.length > 0 ? (
              <table className="users-table">
                <thead>
                  <tr>
                    <th>{t('adminStudents.studentId')}</th>
                    <th>{t('adminStudents.fullName')}</th>
                    <th>{t('adminStudents.grade')}</th>
                    <th>{t('adminStudents.contact')}</th>
                    <th>{t('adminStudents.school')}</th>
                    <th>{t('adminStudents.class')}</th>
                    <th>{t('adminStudents.added')}</th>
                    <th>{t('adminStudents.actions')}</th>
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
                        <td>{student.grade || '-'}</td>
                        <td>{student.contact_number || '-'}</td>
                        <td>{student.school}</td>
                        <td>
                          {studentClass 
                            ? studentClass.className
                            : t('adminStudents.unknown')}
                        </td>
                        <td>{formatDate(student.createdAt)}</td>
                        <td>
                          <div className="table-actions">
                            <button 
                              className="edit-button"
                              onClick={() => handleEditStudent(student)}
                              disabled={loading}
                            >
                              {t('common.edit')}
                            </button>
                            <button 
                              className="delete-button"
                              onClick={() => handleDeleteStudent(student.id)}
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
                  ? t('adminStudents.noStudentsMatchSearch')
                  : t('adminStudents.noStudentsFound')}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageStudents;