import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where, doc, getDoc, setDoc, updateDoc, arrayUnion, serverTimestamp, addDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import './TrainerSchools.css';
import {
  School, Users, BookOpen, Clock,
  BarChart, ChevronDown, ChevronUp, ArrowLeft, Phone, User, Hash, Plus, X, Search, FileText
} from 'lucide-react';
import {
  CircularProgressbar,
  buildStyles
} from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

const TrainerSchools = () => {
  const [schoolsData, setSchoolsData] = useState([]);
  const [expandedSchool, setExpandedSchool] = useState(null);
  const [viewMode, setViewMode] = useState('schools'); // 'schools', 'classes', 'students'
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [showAddStudentForm, setShowAddStudentForm] = useState(false);
  const [addingStudent, setAddingStudent] = useState(false);
  const [newStudent, setNewStudent] = useState({
    id: '',
    fullName: '',
    age: '',
    contact_number: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loadingSyllabus, setLoadingSyllabus] = useState(false);
  const navigate = useNavigate();

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
        targetType: 'student', // עבור הוספת תלמיד
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

  useEffect(() => {
    const fetchSchoolsData = async () => {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user?.uid) return;

      const q = query(collection(db, 'classes'), where('assignedTrainer', '==', user.uid));
      const snapshot = await getDocs(q);

      const schoolMap = {};

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const schoolName = data.school || 'Unknown School';
        const classId = docSnap.id;
        const studentCount = data.studentsId?.length || 0;

        if (!schoolMap[schoolName]) {
          schoolMap[schoolName] = {
            schoolName,
            classes: [],
            totalStudents: 0,
          };
        }

        const sessionQuery = query(collection(db, 'sessions'), where('classesId', '==', classId));
        const sessionSnapshot = await getDocs(sessionQuery);
        const sessionCount = sessionSnapshot.size;

        const classObj = {
          className: data.className,
          classId,
          studentCount,
          sessionCount,
          progress: sessionCount * 10,
        };

        schoolMap[schoolName].classes.push(classObj);
        schoolMap[schoolName].totalStudents += studentCount;
      }

      const schoolsArray = Object.values(schoolMap);
      setSchoolsData(schoolsArray);
    };

    fetchSchoolsData();
  }, []);

  const toggleExpand = (schoolName) => {
    setExpandedSchool(prev => (prev === schoolName ? null : schoolName));
  };

  const handleSchoolClick = (school) => {
    setSelectedSchool(school);
    setViewMode('classes');
  };

  const handleBackToSchools = () => {
    setViewMode('schools');
    setSelectedSchool(null);
    setSelectedClass(null);
    setStudents([]);
    setSearchTerm('');
    setFilteredStudents([]);
  };

  const handleBackToClasses = () => {
    setViewMode('classes');
    setSelectedClass(null);
    setStudents([]);
    setShowAddStudentForm(false);
    setNewStudent({ id: '', fullName: '', age: '', contact_number: '' });
    setSearchTerm('');
    setFilteredStudents([]);
  };

  const handleViewStudents = async (classData) => {
    setLoadingStudents(true);
    setSelectedClass(classData);
    
    try {
      // Get class document to retrieve studentsId array
      const classQuery = query(collection(db, 'classes'), where('className', '==', classData.className));
      const classSnapshot = await getDocs(classQuery);
      
      if (!classSnapshot.empty) {
        const classDoc = classSnapshot.docs[0];
        const studentsIds = classDoc.data().studentsId || [];
        
        // Fetch each student's data
        const studentsData = [];
        for (const studentId of studentsIds) {
          try {
            const studentDoc = await getDoc(doc(db, 'students', studentId));
            if (studentDoc.exists()) {
              studentsData.push({
                id: studentDoc.id,
                ...studentDoc.data()
              });
            }
          } catch (error) {
            console.error(`Error fetching student ${studentId}:`, error);
          }
        }
        
        setStudents(studentsData);
        setFilteredStudents(studentsData); // Initialize filtered list
        setViewMode('students');
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleAddNewStudent = async (e) => {
    e.preventDefault();
    
    if (!newStudent.id || !newStudent.fullName || !newStudent.age || !newStudent.contact_number) {
      alert('Please fill in all fields');
      return;
    }

    setAddingStudent(true);
    
    try {
      // Check if student ID already exists
      const existingStudent = await getDoc(doc(db, 'students', newStudent.id));
      if (existingStudent.exists()) {
        alert('A student with this ID already exists');
        setAddingStudent(false);
        return;
      }

      // Create the student document
      const studentData = {
        fullName: newStudent.fullName,
        age: parseInt(newStudent.age),
        contact_number: newStudent.contact_number,
        classId: selectedClass.classId,
        school: selectedSchool.schoolName,
        createdAt: serverTimestamp()
      };

      // Add student to students collection with custom ID
      await setDoc(doc(db, 'students', newStudent.id), studentData);

      // Update the class document to add student ID to studentsId array
      const classQuery = query(collection(db, 'classes'), where('className', '==', selectedClass.className));
      const classSnapshot = await getDocs(classQuery);
      
      if (!classSnapshot.empty) {
        const classDocRef = classSnapshot.docs[0].ref;
        await updateDoc(classDocRef, {
          studentsId: arrayUnion(newStudent.id)
        });
      }

      // רישום פעולה ב-adminLogs
      await logTrainerAction(
        'add-student',
        `added student ${newStudent.fullName} to class ${selectedClass.className}`,
        newStudent.id
      );

      // Add the new student to the local state
      const newStudentData = {
        id: newStudent.id,
        ...studentData,
        age: parseInt(newStudent.age)
      };
      
      setStudents(prev => [...prev, newStudentData]);
      setFilteredStudents(prev => [...prev, newStudentData]);

      // Reset form
      setNewStudent({ id: '', fullName: '', age: '', contact_number: '' });
      setShowAddStudentForm(false);
      
      alert('Student added successfully!');
      
    } catch (error) {
      console.error('Error adding student:', error);
      alert('Error adding student. Please try again.');
    } finally {
      setAddingStudent(false);
    }
  };

  const handleInputChange = (field, value) => {
    setNewStudent(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setFilteredStudents(students);
      return;
    }
    
    const filtered = students.filter(student => 
      student.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredStudents(filtered);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setFilteredStudents(students);
  };

  // Auto-search when search term changes
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter(student => 
        student.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredStudents(filtered);
    }
  }, [searchTerm, students]);

  const handleViewSyllabus = async (classData) => {
    setLoadingSyllabus(true);
    
    try {
      // Get the class document to find the syllabus URL
      const classQuery = query(collection(db, 'classes'), where('className', '==', classData.className));
      const classSnapshot = await getDocs(classQuery);
      
      if (!classSnapshot.empty) {
        const classDoc = classSnapshot.docs[0];
        const syllabusUrl = classDoc.data().syllabus;
        
        if (!syllabusUrl) {
          alert('No syllabus found for this class');
          setLoadingSyllabus(false);
          return;
        }

        // Open the syllabus URL directly in a new tab
        window.open(syllabusUrl, '_blank');
      } else {
        alert('Class not found');
      }
    } catch (error) {
      console.error('Error opening syllabus:', error);
      alert('Error opening syllabus. Please try again.');
    } finally {
      setLoadingSyllabus(false);
    }
  };

  // Schools View
  if (viewMode === 'schools') {
    return (
      <div className="schools-page">
        <div className="page-header">
          <h2>My Schools Overview</h2>
          <p>Click on any school to view its classes and details</p>
        </div>
        
        <div className="school-cards">
          {schoolsData.map(school => {
            const totalProgress = Math.floor(
              school.classes.reduce((sum, c) => sum + c.progress, 0) / (school.classes.length || 1)
            );

            const isExpanded = expandedSchool === school.schoolName;

            return (
              <div key={school.schoolName} className="school-card clickable">
                <div className="school-inner">
                  <div className="card-header">
                    <div className="header-top">
                      <h3><School size={20} /> {school.schoolName}</h3>
                      <div className="expand-controls">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(school.schoolName);
                          }}
                          className="expand-btn"
                        >
                          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>
                      </div>
                    </div>
                    <div className="school-stats">
                      <p><BookOpen size={16} /> Classes: {school.classes.length}</p>
                      <p><Users size={16} /> Students: {school.totalStudents}</p>
                    </div>
                    <div className="progress-circle">
                      <CircularProgressbar
                        value={totalProgress}
                        text={`${totalProgress}%`}
                        styles={buildStyles({
                          textColor: '#5e3c8f',
                          pathColor: '#e9c44c',
                          trailColor: '#f5f5f5'
                        })}
                      />
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="school-preview">
                      <h4>Classes Preview:</h4>
                      <div className="classes-preview-list">
                        {school.classes.slice(0, 3).map(cls => (
                          <div key={cls.classId} className="class-preview-item">
                            <span className="class-name">{cls.className}</span>
                            <span className="class-students">{cls.studentCount} students</span>
                          </div>
                        ))}
                        {school.classes.length > 3 && (
                          <div className="more-classes">
                            +{school.classes.length - 3} more classes
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="card-actions">
                    <button
                      className="view-details-btn"
                      onClick={() => handleSchoolClick(school)}
                    >
                      View Classes Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Students View
  if (viewMode === 'students') {
    return (
      <div className="schools-page">
        <div className="page-header with-back">
          <button onClick={handleBackToClasses} className="back-btn">
            <ArrowLeft size={20} />
            Back to Classes
          </button>
          <div className="class-info">
            <h2><BookOpen size={24} /> {selectedClass?.className}</h2>
            <p>{selectedSchool?.schoolName} • {filteredStudents.length} of {students.length} students</p>
          </div>
          <button 
            onClick={() => setShowAddStudentForm(true)} 
            className="add-student-btn"
            disabled={showAddStudentForm}
          >
            <Plus size={20} />
            Add New Student
          </button>
        </div>

        {/* Add Student Form */}
        {showAddStudentForm && (
          <div className="add-student-form-container">
            <div className="add-student-form">
              <div className="form-header">
                <h3>Add New Student</h3>
                <button 
                  onClick={() => {
                    setShowAddStudentForm(false);
                    setNewStudent({ id: '', fullName: '', age: '', contact_number: '' });
                  }}
                  className="close-form-btn"
                >
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleAddNewStudent}>
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="studentId">
                      <Hash size={16} />
                      Student ID
                    </label>
                    <input
                      type="text"
                      id="studentId"
                      value={newStudent.id}
                      onChange={(e) => handleInputChange('id', e.target.value)}
                      placeholder="Enter student ID"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="fullName">
                      <User size={16} />
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      value={newStudent.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      placeholder="Enter full name"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="age">
                      <Users size={16} />
                      Age
                    </label>
                    <input
                      type="number"
                      id="age"
                      value={newStudent.age}
                      onChange={(e) => handleInputChange('age', e.target.value)}
                      placeholder="Enter age"
                      min="1"
                      max="100"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="contactNumber">
                      <Phone size={16} />
                      Contact Number
                    </label>
                    <input
                      type="tel"
                      id="contactNumber"
                      value={newStudent.contact_number}
                      onChange={(e) => handleInputChange('contact_number', e.target.value)}
                      placeholder="Enter contact number"
                      required
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowAddStudentForm(false);
                      setNewStudent({ id: '', fullName: '', age: '', contact_number: '' });
                    }}
                    className="cancel-btn"
                    disabled={addingStudent}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="submit-btn"
                    disabled={addingStudent}
                  >
                    {addingStudent ? 'Adding...' : 'Add Student'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="search-container">
          <div className="search-bar">
            <div className="search-input-group">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search students by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              {searchTerm && (
                <button onClick={handleClearSearch} className="clear-search-icon-btn">
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
          {searchTerm && (
            <div className="search-results-info">
              Found {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} 
              {searchTerm && ` matching "${searchTerm}"`}
            </div>
          )}
        </div>

        {loadingStudents ? (
          <div className="loading-container">
            <div className="loading-spinner">Loading students...</div>
          </div>
        ) : filteredStudents.length === 0 && students.length > 0 ? (
          <div className="no-students">
            <div className="no-students-icon">🔍</div>
            <h3>No Students Found</h3>
            <p>No students match your search "{searchTerm}". Try a different search term.</p>
            <button onClick={handleClearSearch} className="clear-search-action-btn">
              Show All Students
            </button>
          </div>
        ) : students.length === 0 ? (
          <div className="no-students">
            <div className="no-students-icon">👥</div>
            <h3>No Students Found</h3>
            <p>This class doesn't have any students yet. Click "Add New Student" to get started!</p>
          </div>
        ) : (
          <div className="students-list">
            {filteredStudents.map((student, index) => (
              <div key={student.id} className="student-card">
                <div className="student-number">
                  {index + 1}
                </div>
                <div className="student-info">
                  <div className="student-header">
                    <h3><User size={20} /> {student.fullName || 'No Name'}</h3>
                    <span className="student-age">Age: {student.age || 'N/A'}</span>
                  </div>
                  <div className="student-details">
                    <div className="detail-item">
                      <Hash size={16} />
                      <span className="detail-label">Student ID:</span>
                      <span className="detail-value">{student.id}</span>
                    </div>
                    <div className="detail-item">
                      <Phone size={16} />
                      <span className="detail-label">Contact:</span>
                      <span className="detail-value">{student.contact_number || 'No contact'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Classes View
  return (
    <div className="schools-page">
      <div className="page-header with-back">
        <button onClick={handleBackToSchools} className="back-btn">
          <ArrowLeft size={20} />
          Back to Schools
        </button>
        <div className="school-info">
          <h2><School size={24} /> {selectedSchool?.schoolName}</h2>
          <p>{selectedSchool?.classes.length} classes • {selectedSchool?.totalStudents} students</p>
        </div>
      </div>

      <div className="classes-grid">
        {selectedSchool?.classes.map(cls => (
          <div key={cls.classId} className="class-card">
            <div className="class-header">
              <h3><BookOpen size={20} /> {cls.className}</h3>
              <div className="class-progress">
                <CircularProgressbar
                  value={cls.progress}
                  text={`${cls.progress}%`}
                  styles={buildStyles({
                    textColor: '#5e3c8f',
                    pathColor: '#e9c44c',
                    trailColor: '#f5f5f5'
                  })}
                />
              </div>
            </div>

            <div className="class-stats">
              <div className="stat-item">
                <Users size={16} />
                <span>{cls.studentCount} Students</span>
              </div>
              <div className="stat-item">
                <Clock size={16} />
                <span>{cls.sessionCount} Sessions</span>
              </div>
              <div className="stat-item">
                <BarChart size={16} />
                <span>{cls.progress}% Progress</span>
              </div>
            </div>

            <div className="class-actions">
              <button
                className="view-sessions-btn"
                onClick={() => navigate(`/trainer-area/sessions?searchClass=${encodeURIComponent(cls.className)}`)}
              >
                View Sessions
              </button>
              <button
                className="view-students-btn"
                onClick={() => handleViewStudents(cls)}
                disabled={loadingStudents}
              >
                {loadingStudents ? 'Loading...' : 'View Students'}
              </button>
              <button
                className="view-syllabus-btn"
                onClick={() => handleViewSyllabus(cls)}
                disabled={loadingSyllabus}
              >
                <FileText size={16} />
                {loadingSyllabus ? 'Loading...' : 'View Syllabus'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrainerSchools;