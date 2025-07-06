import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next'; // הוספת useTranslation
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
  const { t } = useTranslation(); // הוספת hook לתרגום
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
    grade: '',
    contact_number: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loadingSyllabus, setLoadingSyllabus] = useState(false);
  const [showSchoolDetails, setShowSchoolDetails] = useState(false);
  const [selectedSchoolDetails, setSelectedSchoolDetails] = useState(null);
  const [loadingSchoolDetails, setLoadingSchoolDetails] = useState(false);
  const navigate = useNavigate();

  // Grade options A-L
  const gradeOptions = [
    'Grade A', 'Grade B', 'Grade C', 'Grade D', 'Grade E', 'Grade F',
    'Grade G', 'Grade H', 'Grade I', 'Grade J', 'Grade K', 'Grade L'
  ];

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
        const studentCount = Math.max(0, (data.studentsId?.length || 0) - 1);

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
    setNewStudent({ id: '', fullName: '', grade: '', contact_number: '' });
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
        
        // Count total sessions for this class
        const sessionsQuery = query(collection(db, 'sessions'), where('classId', '==', classData.classId));
        const sessionsSnapshot = await getDocs(sessionsQuery);
        const totalSessions = sessionsSnapshot.size;
        
        // Add totalSessions to each student data
        const studentsWithSessionData = studentsData.map(student => ({
          ...student,
          totalSessions
        }));
        
        setStudents(studentsWithSessionData);
        setFilteredStudents(studentsWithSessionData); // Initialize filtered list
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
    
    if (!newStudent.id || !newStudent.fullName || !newStudent.contact_number) {
      alert(t('trainerSchools.fillRequiredFields'));
      return;
    }

    setAddingStudent(true);
    
    try {
      // Check if student ID already exists
      const existingStudent = await getDoc(doc(db, 'students', newStudent.id));
      if (existingStudent.exists()) {
        alert(t('trainerSchools.studentIdExists'));
        setAddingStudent(false);
        return;
      }

      // Create the student document
      const studentData = {
        fullName: newStudent.fullName,
        grade: newStudent.grade,
        contact_number: newStudent.contact_number,
        classId: selectedClass.classId,
        school: selectedSchool.schoolName,
        sessions_attended: 0,
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
        totalSessions: 0 // Initialize with 0 total sessions for new students
      };
      
      setStudents(prev => [...prev, newStudentData]);
      setFilteredStudents(prev => [...prev, newStudentData]);

      // Reset form
      setNewStudent({ id: '', fullName: '', grade: '', contact_number: '' });
      setShowAddStudentForm(false);
      
      alert(t('trainerSchools.studentAddedSuccess'));
      
    } catch (error) {
      console.error('Error adding student:', error);
      alert(t('trainerSchools.errorAddingStudent'));
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
          alert(t('trainerSchools.noSyllabusFound'));
          setLoadingSyllabus(false);
          return;
        }

        // Open the syllabus URL directly in a new tab
        window.open(syllabusUrl, '_blank');
      } else {
        alert(t('trainerSchools.classNotFound'));
      }
    } catch (error) {
      console.error('Error opening syllabus:', error);
      alert(t('trainerSchools.errorOpeningSyllabus'));
    } finally {
      setLoadingSyllabus(false);
    }
  };

  // פונקציה לטעינת פרטי בית ספר
  const handleViewSchoolDetails = async (schoolName) => {
    setLoadingSchoolDetails(true);
    setShowSchoolDetails(true);
    
    try {
      const schoolQuery = query(collection(db, 'schools'), where('name', '==', schoolName));
      const schoolSnapshot = await getDocs(schoolQuery);
      
      if (!schoolSnapshot.empty) {
        const schoolDoc = schoolSnapshot.docs[0];
        const schoolData = schoolDoc.data();
        setSelectedSchoolDetails({
          name: schoolName,
          address: schoolData.address || 'No address available',
          contact_person: schoolData.contact_person || 'No contact person available',
          phone: schoolData.phone || 'No phone available'
        });
      } else {
        setSelectedSchoolDetails({
          name: schoolName,
          address: 'School details not found',
          contact_person: 'N/A',
          phone: 'N/A'
        });
      }
    } catch (error) {
      console.error('Error fetching school details:', error);
      setSelectedSchoolDetails({
        name: schoolName,
        address: 'Error loading details',
        contact_person: 'N/A',
        phone: 'N/A'
      });
    } finally {
      setLoadingSchoolDetails(false);
    }
  };

  // פונקציה לסגירת חלונית פרטי בית הספר
  const handleCloseSchoolDetails = () => {
    setShowSchoolDetails(false);
    setSelectedSchoolDetails(null);
  };

  // Schools View
  if (viewMode === 'schools') {
    return (
      <div className="schools-page">
        <div className="page-header">
          <h2>{t('trainerSchools.mySchoolsOverview')}</h2>
          <p>{t('trainerSchools.clickSchoolToView')}</p>
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
                      <p><BookOpen size={16} /> {t('trainerSchools.classes')}: {school.classes.length}</p>
                      <p><Users size={16} /> {t('trainerSchools.students')}: {school.totalStudents}</p>
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
                      <h4>{t('trainerSchools.classesPreview')}:</h4>
                      <div className="classes-preview-list">
                        {school.classes.slice(0, 3).map(cls => (
                          <div key={cls.classId} className="class-preview-item">
                            <span className="class-name">{cls.className}</span>
                            <span className="class-students">{cls.studentCount} {t('trainerSchools.students')}</span>
                          </div>
                        ))}
                        {school.classes.length > 3 && (
                          <div className="more-classes">
                            +{school.classes.length - 3} {t('trainerSchools.moreClasses')}
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
                      {t('trainerSchools.viewClassesDetails')}
                    </button>
                    <button
                      className="view-school-details-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewSchoolDetails(school.schoolName);
                      }}
                    >
                      {t('trainerSchools.viewSchoolDetails')}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* School Details Modal */}
        {showSchoolDetails && (
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
              padding: '30px',
              borderRadius: '10px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto',
              position: 'relative'
            }}>
              <button
                onClick={handleCloseSchoolDetails}
                style={{
                  position: 'absolute',
                  top: '15px',
                  right: '15px',
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                <X size={24} />
              </button>

              {loadingSchoolDetails ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <div>{t('trainerSchools.loadingSchoolDetails')}...</div>
                </div>
              ) : selectedSchoolDetails ? (
                <div>
                  <h2 style={{ 
                    color: '#5e3c8f', 
                    marginBottom: '20px',
                    marginTop: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <School size={24} />
                    {selectedSchoolDetails.name}
                  </h2>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <strong style={{ color: '#333', display: 'block', marginBottom: '5px' }}>{t('trainerSchools.address')}:</strong>
                    <p style={{ margin: 0, color: '#666', fontSize: '16px' }}>
                      {selectedSchoolDetails.address}
                    </p>
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <strong style={{ color: '#333', display: 'block', marginBottom: '5px' }}>{t('trainerSchools.contactPerson')}:</strong>
                    <p style={{ margin: 0, color: '#666', fontSize: '16px' }}>
                      {selectedSchoolDetails.contact_person}
                    </p>
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <strong style={{ color: '#333', display: 'block', marginBottom: '5px' }}>{t('forms.phone')}:</strong>
                    <p style={{ margin: 0, color: '#666', fontSize: '16px' }}>
                      {selectedSchoolDetails.phone}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
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
            {t('trainerSchools.backToClasses')}
          </button>
          <div className="class-info">
            <h2><BookOpen size={24} /> {selectedClass?.className}</h2>
            <p>{selectedSchool?.schoolName} • {filteredStudents.length} {t('trainerSchools.of')} {Math.max(0, students.length - 1)} {t('trainerSchools.students')}</p>
          </div>
          <button 
            onClick={() => setShowAddStudentForm(true)} 
            className="add-student-btn"
            disabled={showAddStudentForm}
          >
            <Plus size={20} />
            {t('trainerSchools.addNewStudent')}
          </button>
        </div>

        {/* Add Student Form */}
        {showAddStudentForm && (
          <div className="add-student-form-container">
            <div className="add-student-form">
              <div className="form-header">
                <h3>{t('trainerSchools.addNewStudent')}</h3>
                <button 
                  onClick={() => {
                    setShowAddStudentForm(false);
                    setNewStudent({ id: '', fullName: '', grade: '', contact_number: '' });
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
                      {t('trainerSchools.studentId')}
                    </label>
                    <input
                      type="text"
                      id="studentId"
                      value={newStudent.id}
                      onChange={(e) => handleInputChange('id', e.target.value)}
                      placeholder={t('trainerSchools.enterStudentId')}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="fullName">
                      <User size={16} />
                      {t('trainerProfile.fullName')}
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      value={newStudent.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      placeholder={t('trainerSchools.enterFullName')}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="grade">
                      <Users size={16} />
                      {t('forms.grade')}
                    </label>
                    <select
                      id="grade"
                      value={newStudent.grade}
                      onChange={(e) => handleInputChange('grade', e.target.value)}
                    >
                      <option value="">{t('trainerSchools.selectGrade')}</option>
                      {gradeOptions.map(grade => (
                        <option key={grade} value={grade}>
                          {grade}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="contactNumber">
                      <Phone size={16} />
                      {t('trainerSchools.contactNumber')}
                    </label>
                    <input
                      type="tel"
                      id="contactNumber"
                      value={newStudent.contact_number}
                      onChange={(e) => handleInputChange('contact_number', e.target.value)}
                      placeholder={t('trainerSchools.enterContactNumber')}
                      required
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowAddStudentForm(false);
                      setNewStudent({ id: '', fullName: '', grade: '', contact_number: '' });
                    }}
                    className="cancel-btn"
                    disabled={addingStudent}
                  >
                    {t('common.cancel')}
                  </button>
                  <button 
                    type="submit" 
                    className="submit-btn"
                    disabled={addingStudent}
                  >
                    {addingStudent ? t('trainerSchools.adding') + '...' : t('trainerSchools.addStudent')}
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
                placeholder={t('trainerSchools.searchStudentsByName')}
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
              {t('trainerSchools.found')} {filteredStudents.length} {filteredStudents.length !== 1 ? t('trainerSchools.students') : t('trainerSchools.student')} 
              {searchTerm && ` ${t('trainerSchools.matching')} "${searchTerm}"`}
            </div>
          )}
        </div>

        {loadingStudents ? (
          <div className="loading-container">
            <div className="loading-spinner">{t('common.loading')}</div>
          </div>
        ) : filteredStudents.length === 0 && students.length > 0 ? (
          <div className="no-students">
            <div className="no-students-icon">🔍</div>
            <h3>{t('trainerSchools.noStudentsFound')}</h3>
            <p>{t('trainerSchools.noStudentsMatchSearch')} "{searchTerm}". {t('trainerSchools.tryDifferentSearch')}.</p>
            <button onClick={handleClearSearch} className="clear-search-action-btn">
              {t('trainerSchools.showAllStudents')}
            </button>
          </div>
        ) : students.length === 0 ? (
          <div className="no-students">
            <div className="no-students-icon">👥</div>
            <h3>{t('trainerSchools.noStudentsFound')}</h3>
            <p>{t('trainerSchools.noStudentsInClass')} "{t('trainerSchools.addNewStudent')}" {t('trainerSchools.toGetStarted')}!</p>
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
                    <h3><User size={20} /> {student.fullName || t('trainerSchools.noName')}</h3>
                  </div>
                  <div className="student-details">
                    <div className="detail-item">
                      <Hash size={16} />
                      <span className="detail-label">{t('trainerSchools.studentId')}:</span>
                      <span className="detail-value">{student.id}</span>
                    </div>
                    <div className="detail-item">
                      <Users size={16} />
                      <span className="detail-label">{t('forms.grade')}:</span>
                      <span className="detail-value">{student.grade || t('trainerProfile.notSpecified')}</span>
                    </div>
                    <div className="detail-item">
                      <Phone size={16} />
                      <span className="detail-label">{t('trainerSchools.contact')}:</span>
                      <span className="detail-value">{student.contact_number || t('trainerSchools.noContact')}</span>
                    </div>
                    <div className="detail-item">
                      <Clock size={16} />
                      <span className="detail-label">{t('trainerSessions.attendance')}:</span>
                      <span className="detail-value">
                        {(student.sessions_attended || 0)}/{student.totalSessions || 0} {t('trainerSchools.sessions')}
                      </span>
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
          {t('trainerSchools.backToSchools')}
        </button>
        <div className="school-info">
          <h2><School size={24} /> {selectedSchool?.schoolName}</h2>
          <p>{selectedSchool?.classes.length} {t('trainerSchools.classes')} • {selectedSchool?.totalStudents} {t('trainerSchools.students')}</p>
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
                <span>{cls.studentCount} {t('trainerSchools.students')}</span>
              </div>
              <div className="stat-item">
                <Clock size={16} />
                <span>{cls.sessionCount} {t('trainerSchools.sessions')}</span>
              </div>
              <div className="stat-item">
                <BarChart size={16} />
                <span>{cls.progress}% {t('trainerSchools.progress')}</span>
              </div>
            </div>

            <div className="class-actions">
              <button
                className="view-sessions-btn"
                onClick={() => navigate(`/trainer-area/sessions?searchClass=${encodeURIComponent(cls.className)}`)}
              >
                {t('trainerSchools.viewSessions')}
              </button>
              <button
                className="view-students-btn"
                onClick={() => handleViewStudents(cls)}
                disabled={loadingStudents}
              >
                {loadingStudents ? t('common.loading') + '...' : t('trainerSchools.viewStudents')}
              </button>
              <button
                className="view-syllabus-btn"
                onClick={() => handleViewSyllabus(cls)}
                disabled={loadingSyllabus}
              >
                <FileText size={16} />
                {loadingSyllabus ? t('common.loading') + '...' : t('trainerSchools.viewSyllabus')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrainerSchools;