import React, { useState, useEffect } from 'react';
import { db, storage } from '../firebase';
import { doc, setDoc, deleteDoc, updateDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { logAdminAction } from '../utils/adminLogger';
import './ManageUsers.css'; // Import your CSS styles

/**
 * ManageClasses Component
 * 
 * Props:
 * - classes: Array of class objects
 * - users: Array of user objects (for trainer selection)
 * - setClasses: Function to update classes state
 * - loading: Boolean loading state
 * - setLoading: Function to set loading state
 * - error: Function to set error messages
 * - success: Function to set success messages
 * - fetchClasses: Optional function to refresh classes from database
 */
const ManageClasses = ({ classes, users, setClasses, loading, setLoading, error, success, fetchClasses }) => {
  // Debug logs
  console.log('ManageClasses props:', { 
    classes: Array.isArray(classes) ? `Array(${classes.length})` : classes,
    users: Array.isArray(users) ? `Array(${users.length})` : users,
    setClasses: typeof setClasses,
    loading,
    setLoading: typeof setLoading,
    error: typeof error,
    success: typeof success,
    fetchClasses: typeof fetchClasses
  });

  const [schools, setSchools] = useState([]);
  const [schoolsLoading, setSchoolsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileUploading, setFileUploading] = useState(false);
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [previousSelectedStudents, setPreviousSelectedStudents] = useState([]); // NEW: שמירת המצב הקודם
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  
  const [newClass, setNewClass] = useState({
    className: '',
    school: '',
    level: 'beginner',
    assignedTrainer: '',
    syllabus: '',
    studentsId: ['']
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState('all');
  const [editingClass, setEditingClass] = useState(null);

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

  // Fetch students from database
  const fetchStudents = async () => {
    setStudentsLoading(true);
    try {
      const studentsSnapshot = await getDocs(collection(db, "students"));
      const studentsData = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudents(studentsData);
    } catch (err) {
      console.error('Error fetching students:', err);
      if (typeof error === 'function') error('Failed to load students data');
    } finally {
      setStudentsLoading(false);
    }
  };

  // פונקציה למחיקת sessions כשמוחקים כיתה
  const deleteSessionsOnClassDelete = async (classId) => {
    try {
      console.log(`Deleting sessions for class deletion: ${classId}`);
      
      // שליפת כל המסמכים מ-sessions שיש להם את ה-classId
      const sessionsQuery = query(collection(db, 'sessions'), where('classId', '==', classId));
      const sessionsSnapshot = await getDocs(sessionsQuery);
      
      // מחיקת כל המסמכים
      const deletePromises = sessionsSnapshot.docs.map(docRef => 
        deleteDoc(docRef.ref)
      );
      
      if (deletePromises.length > 0) {
        await Promise.all(deletePromises);
        console.log(`Deleted ${deletePromises.length} sessions with classId = ${classId}`);
        return deletePromises.length;
      } else {
        console.log("No sessions found with this class ID");
        return 0;
      }
      
    } catch (error) {
      console.error("Error deleting sessions:", error);
      throw error;
    }
  };

  // Fetch schools and students on component mount
  useEffect(() => {
    fetchSchools();
    fetchStudents();
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

  const handleClassChange = (e) => {
    if (e.target.type === 'file') {
      setSelectedFile(e.target.files[0]);
    } else {
      setNewClass({ ...newClass, [e.target.name]: e.target.value });
    }
  };

  // Students modal handlers - FIXED
  const openStudentsModal = () => {
    // שמירת המצב הנוכחי לפני פתיחת המודל
    setPreviousSelectedStudents([...selectedStudents]);
    setShowStudentsModal(true);
  };

  const closeStudentsModal = () => {
    // החזרת המצב הקודם בביטול
    setSelectedStudents([...previousSelectedStudents]);
    setShowStudentsModal(false);
  };

  const handleStudentToggle = (studentId) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const saveSelectedStudents = () => {
    const studentsArray = selectedStudents.length > 0 ? selectedStudents : [''];
    setNewClass({ ...newClass, studentsId: studentsArray });
    // עדכון המצב הקודם למצב הנוכחי כי שמרנו את השינויים
    setPreviousSelectedStudents([...selectedStudents]);
    setShowStudentsModal(false);
  };

  // Upload file to Firebase Storage
  const uploadSyllabusFile = async (file, classId) => {
    if (!file) return null;
    
    try {
      setFileUploading(true);
      const timestamp = Date.now();
      const fileName = `${classId}_${timestamp}_${file.name}`;
      const storageRef = ref(storage, `syllabi/${fileName}`);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading file:', error);
      if (typeof error === 'function') error('Failed to upload syllabus file');
      return null;
    } finally {
      setFileUploading(false);
    }
  };

  // Delete file from Firebase Storage
  const deleteSyllabusFile = async (syllabusUrl) => {
    if (!syllabusUrl) return;
    
    try {
      const storageRef = ref(storage, syllabusUrl);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Error deleting file:', error);
      // Don't throw error as this is cleanup
    }
  };

  const handleAddClass = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (typeof error === 'function') error('');
    if (typeof success === 'function') success('');
    
    try {
      // בדיקת שדות חובה
      if (!newClass.className || !newClass.school || !newClass.assignedTrainer) {
        if (typeof error === 'function') error('Please fill all required fields: Class Name, School, and Assigned Trainer');
        setLoading(false);
        return;
      }

      // בדיקה שהקומבינציה של בית ספר + שם כיתה לא קיימת כבר
      const existingClass = (classes || []).find(cls => 
        cls.school === newClass.school && cls.className === newClass.className
      );
      
      if (existingClass) {
        if (typeof error === 'function') error(`A class named "${newClass.className}" already exists in "${newClass.school}". Please choose a different class name or school.`);
        setLoading(false);
        return;
      }

      // Generate random document ID
      const randomId = doc(collection(db, "classes")).id;
      
      let syllabusUrl = '';
      
      // Upload syllabus file if selected
      if (selectedFile) {
        syllabusUrl = await uploadSyllabusFile(selectedFile, randomId);
        if (!syllabusUrl) {
          setLoading(false);
          return; // Error message already shown in uploadSyllabusFile
        }
      }

      const classData = {
        className: newClass.className,
        school: newClass.school,
        level: newClass.level,
        assignedTrainer: newClass.assignedTrainer,
        syllabus: syllabusUrl,
        studentsId: newClass.studentsId.length > 0 ? newClass.studentsId : [''],
        createdAt: new Date()
      };

      await setDoc(doc(db, "classes", randomId), classData);

      const currentAdmin = JSON.parse(localStorage.getItem('user'));
      await logAdminAction({
        admin: currentAdmin,
        actionType: 'add-class',
        targetType: 'class',
        targetId: randomId,
        description: `Added class "${classData.className}" at ${classData.school}`
      });

      if (typeof success === 'function') success('Class added successfully!');
      
      // עדכון מקומי של הרשימה
      if (setClasses && Array.isArray(classes)) {
        setClasses([...classes, { ...classData, id: randomId }]);
      }
      
      setNewClass({
        className: '',
        school: '',
        level: 'beginner',
        assignedTrainer: '',
        syllabus: '',
        studentsId: ['']
      });
      setSelectedFile(null);
      setSelectedStudents([]);
      setPreviousSelectedStudents([]); // איפוס גם המצב הקודם
      
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
      
      // קריאה ל-fetchClasses רק אם היא קיימת
      if (typeof fetchClasses === 'function') {
        fetchClasses();
      }
    } catch (err) {
      console.error("Error:", err);
      if (typeof error === 'function') error(err.message);
    }
    setLoading(false);
  };

  const handleDeleteClass = async (classId) => {
    // מציאת הכיתה לפני המחיקה כדי לקחת את שמה לרישום
    const classToDelete = (classes || []).find(cls => cls.id === classId);
    let classDescription = `Deleted class with ID ${classId}`;
    
    if (classToDelete) {
      classDescription = `Deleted class "${classToDelete.className}" from ${classToDelete.school}`;
    }
    
    if (!window.confirm("Are you sure you want to delete this class? This will also delete all related sessions.")) return;
    setLoading(true);
    if (typeof error === 'function') error('');
    if (typeof success === 'function') success('');
    
    try {
      // מחיקת כל הסשנים הקשורים לכיתה לפני מחיקת הכיתה עצמה
      console.log("Class deletion initiated, deleting related sessions first...");
      await deleteSessionsOnClassDelete(classId);
      
      // מחיקת הכיתה עצמה
      await deleteDoc(doc(db, "classes", classId));

      const currentAdmin = JSON.parse(localStorage.getItem('user'));
      await logAdminAction({
        admin: currentAdmin,
        actionType: 'delete-class',
        targetType: 'class',
        targetId: classId,
        description: classDescription
      });
      
      if (typeof success === 'function') success('Class deleted successfully');
      
      // עדכון מקומי של הרשימה
      if (setClasses && Array.isArray(classes)) {
        setClasses(classes.filter(cls => cls.id !== classId));
      }
      
      // קריאה ל-fetchClasses רק אם היא קיימת
      if (typeof fetchClasses === 'function') {
        fetchClasses();
      }
    } catch (err) {
      console.error("Error deleting class:", err);
      if (typeof error === 'function') error('Failed to delete class: ' + err.message);
    }
    setLoading(false);
  };

  const handleEditClass = (classToEdit) => {
    setEditingClass(classToEdit.id);
    setNewClass({
      className: classToEdit.className,
      school: classToEdit.school || '',
      level: classToEdit.level,
      assignedTrainer: classToEdit.assignedTrainer || '',
      syllabus: classToEdit.syllabus || '',
      studentsId: classToEdit.studentsId || ['']
    });
    const currentStudents = classToEdit.studentsId && classToEdit.studentsId.length > 0 && classToEdit.studentsId[0] !== '' ? classToEdit.studentsId : [];
    setSelectedStudents(currentStudents);
    setPreviousSelectedStudents([...currentStudents]); // שמירת המצב הנוכחי גם כמצב קודם
    setSelectedFile(null);
    
    // Reset file input
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = '';
    
    // גלילה חלקה לראש הדף - פתרון מקיף
    setTimeout(() => {
      // נסה כל הדרכים הפופולריות לגלילה לראש
      document.body.scrollTop = 0; // Safari
      document.documentElement.scrollTop = 0; // Chrome, Firefox, IE, Opera
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      
      // גם זה לכל מקרה
      const container = document.querySelector('.admin-content') || document.querySelector('.user-management-container');
      if (container) {
        container.scrollTop = 0;
      }
    }, 50);
  };

  const handleUpdateClass = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (typeof error === 'function') error('');
    if (typeof success === 'function') success('');
    
    try {
      // בדיקת שדות חובה
      if (!newClass.className || !newClass.school || !newClass.assignedTrainer) {
        if (typeof error === 'function') error('Please fill all required fields: Class Name, School, and Assigned Trainer');
        setLoading(false);
        return;
      }

      // בדיקה שהקומבינציה של בית ספר + שם כיתה לא קיימת כבר (מלבד הכיתה הנוכחית שנערכת)
      const existingClass = (classes || []).find(cls => 
        cls.school === newClass.school && 
        cls.className === newClass.className && 
        cls.id !== editingClass // התעלמות מהכיתה הנוכחית שנערכת
      );
      
      if (existingClass) {
        if (typeof error === 'function') error(`A class named "${newClass.className}" already exists in "${newClass.school}". Please choose a different class name or school.`);
        setLoading(false);
        return;
      }

      let syllabusUrl = newClass.syllabus; // Keep existing URL by default
      
      // If new file selected, upload it and delete old one
      if (selectedFile) {
        // Upload new file
        const newSyllabusUrl = await uploadSyllabusFile(selectedFile, editingClass);
        if (newSyllabusUrl) {
          // Delete old file if exists
          if (syllabusUrl) {
            await deleteSyllabusFile(syllabusUrl);
          }
          syllabusUrl = newSyllabusUrl;
        } else {
          setLoading(false);
          return; // Error message already shown in uploadSyllabusFile
        }
      }

      const updatedData = {
        className: newClass.className,
        school: newClass.school,
        level: newClass.level,
        assignedTrainer: newClass.assignedTrainer,
        syllabus: syllabusUrl,
        studentsId: newClass.studentsId.length > 0 ? newClass.studentsId : [''],
        updatedAt: new Date()
      };

      await updateDoc(doc(db, "classes", editingClass), updatedData);
      const currentAdmin = JSON.parse(localStorage.getItem('user'));
      await logAdminAction({
        admin: currentAdmin,
        actionType: 'update-class',
        targetType: 'class',
        targetId: editingClass,
        description: `Updated class "${updatedData.className}" at ${updatedData.school}`
      });

      if (typeof success === 'function') success('Class updated successfully!');
      
      // עדכון מקומי של הרשימה
      if (setClasses && Array.isArray(classes)) {
        setClasses(classes.map(cls => 
          cls.id === editingClass 
            ? { ...cls, ...updatedData }
            : cls
        ));
      }
      
      setEditingClass(null);
      setNewClass({
        className: '',
        school: '',
        level: 'beginner',
        assignedTrainer: '',
        syllabus: '',
        studentsId: ['']
      });
      setSelectedFile(null);
      setSelectedStudents([]);
      setPreviousSelectedStudents([]); // איפוס גם המצב הקודם
      
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
      
      // קריאה ל-fetchClasses רק אם היא קיימת
      if (typeof fetchClasses === 'function') {
        fetchClasses();
      }
    } catch (err) {
      console.error("Error updating class:", err);
      if (typeof error === 'function') error(err.message);
    }
    setLoading(false);
  };

  const handleCancelEdit = () => {
    setEditingClass(null);
    setNewClass({
      className: '',
      school: '',
      level: 'beginner',
      assignedTrainer: '',
      syllabus: '',
      studentsId: ['']
    });
    setSelectedFile(null);
    setSelectedStudents([]);
    setPreviousSelectedStudents([]); // איפוס גם המצב הקודם
    
    // Reset file input
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = '';
    
    // ניקוי הודעות שגיאה והצלחה
    if (typeof error === 'function') error('');
    if (typeof success === 'function') success('');
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchFilter('all');
  };

  // Filter and sort classes based on search query and filter with error handling
  const filteredClasses = (classes || [])
    .filter(cls => {
      try {
        if (!searchQuery.trim()) return true;
        
        const query = searchQuery.toLowerCase();
        
        switch (searchFilter) {
          case 'className':
            return (cls.className || '').toLowerCase().includes(query);
          case 'school':
            return (cls.school || '').toLowerCase().includes(query);
          case 'level':
            return (cls.level || '').toLowerCase().includes(query);
          case 'trainer':
            const trainer = cls.assignedTrainer && users && Array.isArray(users)
              ? users.find(u => u.id === cls.assignedTrainer)
              : null;
            const trainerName = trainer ? `${trainer.firstName} ${trainer.lastName}`.toLowerCase() : '';
            return trainerName.includes(query);
          case 'added':
            const dateStr = formatDate(cls.createdAt).toLowerCase();
            return dateStr.includes(query);
          case 'all':
          default:
            const trainer2 = cls.assignedTrainer && users && Array.isArray(users)
              ? users.find(u => u.id === cls.assignedTrainer)
              : null;
            const trainerName2 = trainer2 ? `${trainer2.firstName} ${trainer2.lastName}`.toLowerCase() : '';
            const dateStr2 = formatDate(cls.createdAt).toLowerCase();
            
            return (
              (cls.className || '').toLowerCase().includes(query) ||
              (cls.school || '').toLowerCase().includes(query) ||
              (cls.level || '').toLowerCase().includes(query) ||
              trainerName2.includes(query) ||
              dateStr2.includes(query)
            );
        }
      } catch (err) {
        console.error('Error filtering class:', err, cls);
        return false;
      }
    })
    .sort((a, b) => {
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
          dateA = new Date(0); // Default to epoch if no date
        }
        
        if (b.createdAt && b.createdAt.toDate) {
          dateB = b.createdAt.toDate();
        } else if (b.createdAt instanceof Date) {
          dateB = b.createdAt;
        } else if (b.createdAt) {
          dateB = new Date(b.createdAt);
        } else {
          dateB = new Date(0); // Default to epoch if no date
        }
        
        return dateB.getTime() - dateA.getTime(); // Descending order (newest first)
      } catch (err) {
        console.error('Error sorting classes:', err);
        return 0;
      }
    });

  return (
    <div className="user-management-container">
      {/* Add Class Section */}
      <div className="add-user-section">
        <h2>{editingClass ? 'Edit Class' : 'Add New Class'}</h2>
        
        <form onSubmit={editingClass ? handleUpdateClass : handleAddClass} className="add-user-form">
          <div className="form-row">
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
              <label>School*</label>
              <select
                name="school"
                value={newClass.school}
                onChange={handleClassChange}
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
              <label>Assigned Trainer*</label>
              <select
                name="assignedTrainer"
                value={newClass.assignedTrainer}
                onChange={handleClassChange}
                required
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

          <div className="form-row">
            <div className="form-group">
              <label>Syllabus File</label>
              <input
                type="file"
                name="syllabus"
                onChange={handleClassChange}
                accept="*/*"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px dashed #e6e6e6',
                  borderRadius: '6px',
                  fontSize: '13px',
                  backgroundColor: '#faf8f1',
                  color: '#333333',
                  boxSizing: 'border-box',
                  height: '42px',
                  cursor: 'pointer',
                  lineHeight: '1.2',
                  display: 'flex',
                  alignItems: 'center'
                }}
              />
              {editingClass && newClass.syllabus && (
                <div className="current-file-info">
                  <small style={{ color: '#666', fontSize: '11px' }}>
                    Current: <a href={newClass.syllabus} target="_blank" rel="noopener noreferrer" style={{ color: '#5e3c8f' }}>
                      View Current Syllabus
                    </a>
                  </small>
                </div>
              )}
              {selectedFile && (
                <div className="selected-file-info">
                  <small style={{ color: '#5e3c8f', fontSize: '11px' }}>
                    Selected: {selectedFile.name}
                  </small>
                </div>
              )}
            </div>
            
            <div className="form-group">
              <label>Students</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={openStudentsModal}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#5e3c8f',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}
                  disabled={studentsLoading}
                >
                  {studentsLoading ? 'Loading...' : 'CHOOSE'}
                </button>
                <span style={{ fontSize: '12px', color: '#666' }}>
                  {selectedStudents.length > 0 
                    ? `${selectedStudents.length} student(s) selected` 
                    : 'No students selected'}
                </span>
              </div>
            </div>
          </div>

          <div className="form-actions">
            {editingClass ? (
              <>
                <div className="edit-mode-info">
                  <div className="edit-indicator">
                    ✏️ Edit Mode
                  </div>
                  <div className="edit-description">
                    You are currently editing this class. Make your changes and click Save, or Cancel to discard changes.
                  </div>
                </div>
                <div className="edit-buttons-row">
                  <button 
                    type="submit" 
                    className="save-button"
                    disabled={loading || fileUploading}
                  >
                    {loading || fileUploading ? (fileUploading ? 'Uploading...' : 'Saving...') : 'Save Changes'}
                  </button>
                  <button 
                    type="button" 
                    className="cancel-button"
                    onClick={handleCancelEdit}
                    disabled={loading || fileUploading}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <button 
                type="submit" 
                className="add-button"
                disabled={loading || fileUploading}
              >
                {loading || fileUploading ? (fileUploading ? 'Uploading...' : 'Adding...') : 'Add Class'}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Classes List Section */}
      <div className="user-list-section">
        <div className="users-list-header">
          <h3>Classes List ({filteredClasses.length})</h3>
          <div className="users-search-container">
            <div className="users-search-filter-row">
              <select
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="users-filter-select"
              >
                <option value="all">All Fields</option>
                <option value="className">Class Name</option>
                <option value="school">School</option>
                <option value="level">Level</option>
                <option value="trainer">Assigned Trainer</option>
                <option value="added">Added Date</option>
              </select>
              
              <input
                type="text"
                placeholder={`Search ${searchFilter === 'all' ? 'all fields' : 
                  searchFilter === 'className' ? 'class name' :
                  searchFilter === 'school' ? 'school' :
                  searchFilter === 'level' ? 'level' :
                  searchFilter === 'trainer' ? 'trainer' :
                  searchFilter === 'added' ? 'date' : 'classes'}...`}
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
                if (typeof fetchClasses === 'function') {
                  fetchClasses();
                } else {
                  console.warn('fetchClasses function is not available');
                }
                fetchSchools(); // Also refresh schools
                fetchStudents(); // Also refresh students
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
            Showing {filteredClasses.length} of {(classes || []).length} classes
            {searchQuery && ` matching "${searchQuery}"`}
            {searchFilter !== 'all' && ` in ${
              searchFilter === 'className' ? 'class name' :
              searchFilter === 'school' ? 'school' :
              searchFilter === 'level' ? 'level' :
              searchFilter === 'trainer' ? 'assigned trainer' :
              searchFilter === 'added' ? 'added date' : searchFilter
            }`}
          </div>
        )}
        
        {loading ? (
          <div className="loading-users">Loading classes...</div>
        ) : (
          <div className="users-table-wrapper">
            {filteredClasses.length > 0 ? (
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Class Name</th>
                    <th>School</th>
                    <th>Level</th>
                    <th>Assigned Trainer</th>
                    <th>Added</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClasses.map(cls => {
                    const assignedTrainer = cls.assignedTrainer && users && Array.isArray(users)
                      ? users.find(u => u.id === cls.assignedTrainer)
                      : null;
                    
                    return (
                      <tr key={cls.id}>
                        <td>{cls.className}</td>
                        <td>{cls.school || '-'}</td>
                        <td>
                          <span className={`role-badge ${cls.level}`}>
                            {cls.level}
                          </span>
                        </td>
                        <td>
                          {assignedTrainer 
                            ? `${assignedTrainer.firstName} ${assignedTrainer.lastName}` 
                            : '-'}
                        </td>
                        <td>{formatDate(cls.createdAt)}</td>
                        <td>
                          <div className="table-actions">
                            <button 
                              className="edit-button"
                              onClick={() => handleEditClass(cls)}
                              disabled={loading}
                            >
                              Edit
                            </button>
                            <button 
                              className="delete-button"
                              onClick={() => handleDeleteClass(cls.id)}
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
                  ? `No classes match your search criteria.` 
                  : 'No classes found. Add your first class.'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Students Selection Modal */}
      {showStudentsModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '20px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
          }}>
            <h3 style={{
              marginBottom: '15px',
              color: '#5e3c8f',
              borderBottom: '2px solid #e9c44c',
              paddingBottom: '8px'
            }}>
              Select Students
            </h3>
            
            {studentsLoading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>Loading students...</div>
            ) : students.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                No students found in database.
              </div>
            ) : (
              <div style={{ maxHeight: '300px', overflow: 'auto', marginBottom: '15px' }}>
                {students.map(student => (
                  <div key={student.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px',
                    borderBottom: '1px solid #eee',
                    cursor: 'pointer',
                    backgroundColor: selectedStudents.includes(student.id) ? '#f7eac5' : 'transparent'
                  }} onClick={() => handleStudentToggle(student.id)}>
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student.id)}
                      onChange={() => handleStudentToggle(student.id)}
                      style={{ marginRight: '10px', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '14px', color: '#333' }}>
                      {student.fullName}
                    </span>
                  </div>
                ))}
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={closeStudentsModal}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f5f5f5',
                  color: '#333',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600'
                }}
              >
                Cancel
              </button>
              <button
                onClick={saveSelectedStudents}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#5e3c8f',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600'
                }}
              >
                Save ({selectedStudents.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageClasses;