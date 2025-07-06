import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next'; // הוספת useTranslation
import { db } from '../firebase';
import { doc, addDoc, deleteDoc, updateDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { logAdminAction } from '../utils/adminLogger';

const ManageSchools = ({ schools, setSchools, loading, setLoading, error, success, setError, setSuccess, fetchSchools }) => {
  const { t } = useTranslation(); // הוספת hook לתרגום
  
  // Debug logs
  console.log('ManageSchools props:', { 
    schools: Array.isArray(schools) ? `Array(${schools.length})` : schools,
    setSchools: typeof setSchools,
    loading,
    setLoading: typeof setLoading,
    error: typeof error,
    success: typeof success,
    setError: typeof setError,
    setSuccess: typeof setSuccess,
    fetchSchools: typeof fetchSchools
  });

  // Use the correct error and success functions
  const errorFunction = typeof setError === 'function' ? setError : (typeof error === 'function' ? error : () => {});
  const successFunction = typeof setSuccess === 'function' ? setSuccess : (typeof success === 'function' ? success : () => {});

  const [newSchool, setNewSchool] = useState({
    name: '',
    address: '',
    contact_person: '',
    phone: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState('all');
  const [editingSchool, setEditingSchool] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

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

  // Generate unique school ID
  const handleSchoolChange = (e) => {
    const { name, value } = e.target;
    setNewSchool({ ...newSchool, [name]: value });
  };

  const handleAddSchool = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    console.log('handleAddSchool called - errorFunction:', typeof errorFunction);
    console.log('handleAddSchool called - successFunction:', typeof successFunction);
    
    errorFunction('');
    successFunction('');
    
    try {
      if (!newSchool.name.trim()) {
        console.log('Validation failed - calling error function');
        errorFunction(t('adminSchools.fillRequiredField'));
        setLoading(false);
        return;
      }

      // Check if school name already exists (case insensitive)
      const existingSchoolByName = (schools || []).find(school => 
        school.name.toLowerCase().trim() === newSchool.name.toLowerCase().trim()
      );
      if (existingSchoolByName && (!isEditing || existingSchoolByName.id !== editingSchool)) {
        console.log('School name exists - calling error function');
        errorFunction(t('adminSchools.schoolNameExists', { name: newSchool.name }));
        setLoading(false);
        return;
      }

      if (isEditing) {
        await updateDoc(doc(db, "schools", editingSchool), {
          name: newSchool.name.trim(),
          address: newSchool.address.trim(),
          contact_person: newSchool.contact_person.trim(),
          phone: newSchool.phone.trim(),
          updatedAt: new Date()
        });
        
        const currentAdmin = JSON.parse(localStorage.getItem('user'));
        await logAdminAction({
          admin: currentAdmin,
          actionType: 'update-school',
          targetType: 'school',
          targetId: editingSchool,
          description: `Updated school ${newSchool.name}`
        });
        
        console.log('School updated successfully - calling success function');
        successFunction(t('adminSchools.schoolUpdatedSuccessfully'));
      } else {
        const docRef = await addDoc(collection(db, "schools"), {
          name: newSchool.name.trim(),
          address: newSchool.address.trim(),
          contact_person: newSchool.contact_person.trim(),
          phone: newSchool.phone.trim(),
          createdAt: new Date()
        });
        
        const currentAdmin = JSON.parse(localStorage.getItem('user'));
        await logAdminAction({
          admin: currentAdmin,
          actionType: 'add-school',
          targetType: 'school',
          targetId: docRef.id,
          description: `Added school ${newSchool.name}`
        });
        
        console.log('School added successfully - calling success function');
        successFunction(t('adminSchools.schoolAddedSuccessfully'));
      }

      // Update local state
      if (setSchools && Array.isArray(schools)) {
        if (isEditing) {
          setSchools(schools.map(school => 
            school.id === editingSchool 
              ? { 
                  ...school, 
                  name: newSchool.name.trim(),
                  address: newSchool.address.trim(),
                  contact_person: newSchool.contact_person.trim(),
                  phone: newSchool.phone.trim(),
                  updatedAt: new Date() 
                }
              : school
          ));
        } else {
          // For new schools, we'll refresh the data instead of trying to update local state
          // since we don't have the ID immediately
        }
      }

      setNewSchool({
        name: '',
        address: '',
        contact_person: '',
        phone: ''
      });
      setIsEditing(false);
      setEditingSchool(null);
      
      // קריאה ל-fetchSchools רק אם היא קיימת
      if (typeof fetchSchools === 'function') {
        fetchSchools();
      }
    } catch (err) {
      console.error("Error:", err);
      console.log('Caught error - calling error function');
      errorFunction(err.message);
    }
    setLoading(false);
  };

  const handleDeleteSchool = async (schoolId) => {
    // קבלת פרטי בית הספר לפני המחיקה
    const schoolToDelete = schools.find(school => school.id === schoolId);
    if (!schoolToDelete) {
      errorFunction(t('adminSchools.schoolNotFound'));
      return;
    }

    const schoolName = schoolToDelete.name;
    
    if (!window.confirm(t('adminSchools.confirmDeleteSchool', { schoolName }))) {
      return;
    }
    
    setLoading(true);
    
    console.log('handleDeleteSchool called - errorFunction:', typeof errorFunction);
    console.log('handleDeleteSchool called - successFunction:', typeof successFunction);
    
    errorFunction('');
    successFunction('');
    
    try {
      console.log(`Starting cascade delete for school: ${schoolName}`);
      
      // שלב 1: מחיקת כל הכיתות הקשורות לבית ספר זה
      console.log('Step 1: Deleting classes...');
      const classesQuery = query(
        collection(db, 'classes'),
        where('school', '==', schoolName)
      );
      const classesSnapshot = await getDocs(classesQuery);
      
      console.log(`Found ${classesSnapshot.size} classes to delete`);
      
      // מחיקת כל הכיתות
      const classDeletePromises = classesSnapshot.docs.map(classDoc => 
        deleteDoc(doc(db, 'classes', classDoc.id))
      );
      await Promise.all(classDeletePromises);
      
      // שלב 2: מחיקת כל הsessions הקשורים לבית ספר זה
      console.log('Step 2: Deleting sessions...');
      const sessionsQuery = query(
        collection(db, 'sessions'),
        where('schoolId', '==', schoolName)
      );
      const sessionsSnapshot = await getDocs(sessionsQuery);
      
      console.log(`Found ${sessionsSnapshot.size} sessions to delete`);
      
      // מחיקת כל הsessions
      const sessionDeletePromises = sessionsSnapshot.docs.map(sessionDoc => 
        deleteDoc(doc(db, 'sessions', sessionDoc.id))
      );
      await Promise.all(sessionDeletePromises);
      
      // שלב 3: מחיקת בית הספר עצמו
      console.log('Step 3: Deleting school...');
      await deleteDoc(doc(db, "schools", schoolId));
      
      // רישום פעילות אדמין - הודעה פשוטה
      const currentAdmin = JSON.parse(localStorage.getItem('user'));
      await logAdminAction({
        admin: currentAdmin,
        actionType: 'delete-school',
        targetType: 'school',
        targetId: schoolId,
        description: `Deleted school "${schoolName}"`
      });

      console.log('School deleted successfully - calling success function');
      // הודעת הצלחה פשוטה
      successFunction(t('adminSchools.schoolDeletedSuccessfully', { name: schoolName }));
      
      // Update local state
      if (setSchools && Array.isArray(schools)) {
        setSchools(schools.filter(school => school.id !== schoolId));
      }
      
      // קריאה ל-fetchSchools רק אם היא קיימת
      if (typeof fetchSchools === 'function') {
        fetchSchools();
      }

    } catch (err) {
      console.error("Error deleting school:", err);
      console.log('Caught delete error - calling error function');
      errorFunction(t('adminSchools.failedToDeleteSchool') + ': ' + err.message);
    }
    setLoading(false);
  };

  const handleEditSchool = (schoolData) => {
    setNewSchool({
      name: schoolData.name,
      address: schoolData.address || '',
      contact_person: schoolData.contact_person || '',
      phone: schoolData.phone || ''
    });
    setIsEditing(true);
    setEditingSchool(schoolData.id);

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
    setNewSchool({
      name: '',
      address: '',
      contact_person: '',
      phone: ''
    });
    setIsEditing(false);
    setEditingSchool(null);
    
    // Clear messages
    errorFunction('');
    successFunction('');
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchFilter('all');
  };

  // Enhanced filter function with category-specific search
  const filteredSchools = (schools || []).filter(school => {
    try {
      if (!searchQuery.trim()) return true;
      
      const query = searchQuery.toLowerCase();
      
      switch (searchFilter) {
        case 'name':
          return (school.name || '').toLowerCase().includes(query);
        case 'address':
          return (school.address || '').toLowerCase().includes(query);
        case 'contact':
          return (school.contact_person || '').toLowerCase().includes(query);
        case 'phone':
          return (school.phone || '').toLowerCase().includes(query);
        case 'added':
          const dateStr = formatDate(school.createdAt).toLowerCase();
          return dateStr.includes(query);
        case 'all':
        default:
          const dateStr2 = formatDate(school.createdAt).toLowerCase();
          
          return (
            (school.name || '').toLowerCase().includes(query) ||
            (school.address || '').toLowerCase().includes(query) ||
            (school.contact_person || '').toLowerCase().includes(query) ||
            (school.phone || '').toLowerCase().includes(query) ||
            dateStr2.includes(query)
          );
      }
    } catch (err) {
      console.error('Error filtering school:', err, school);
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
      console.error('Error sorting schools:', err);
      return 0;
    }
  });

  console.log('ManageSchools props:', { schools, searchQuery, filteredSchools });

  return (
    <div className="user-management-container">
      {/* Add School Section */}
      <div className="add-user-section">
        <h2>{isEditing ? t('adminSchools.editSchool') : t('adminSchools.addNewSchool')}</h2>
        
        <form onSubmit={handleAddSchool} className="add-user-form">
          <div className="form-row">
            <div className="form-group">
              <label>{t('adminSchools.schoolNameRequired')}</label>
              <input
                type="text"
                name="name"
                value={newSchool.name}
                onChange={handleSchoolChange}
                placeholder={t('adminSchools.schoolNamePlaceholder')}
                required
              />
            </div>
            
            <div className="form-group">
              <label>{t('adminSchools.address')}</label>
              <input
                type="text"
                name="address"
                value={newSchool.address}
                onChange={handleSchoolChange}
                placeholder={t('adminSchools.schoolAddressPlaceholder')}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>{t('adminSchools.contactPerson')}</label>
              <input
                type="text"
                name="contact_person"
                value={newSchool.contact_person}
                onChange={handleSchoolChange}
                placeholder={t('adminSchools.contactPersonPlaceholder')}
              />
            </div>
            
            <div className="form-group">
              <label>{t('adminSchools.phone')}</label>
              <input
                type="tel"
                name="phone"
                value={newSchool.phone}
                onChange={handleSchoolChange}
                placeholder={t('adminSchools.phoneNumberPlaceholder')}
              />
            </div>
          </div>

          <div className="form-actions">
            {isEditing ? (
              <>
                <div className="edit-mode-info">
                  <div className="edit-indicator">
                    ✏️ {t('adminSchools.editMode')}
                  </div>
                  <div className="edit-description">
                    {t('adminSchools.editModeDescription')}
                  </div>
                </div>
                <div className="edit-buttons-row">
                  <button 
                    type="submit" 
                    className="save-button"
                    disabled={loading}
                  >
                    {loading ? t('adminSchools.saving') + '...' : t('adminSchools.saveChanges')}
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
                {loading ? t('adminSchools.adding') + '...' : t('adminSchools.addSchool')}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Schools List Section */}
      <div className="user-list-section">
        <div className="users-list-header">
          <h3>{t('adminSchools.schoolsList', { count: filteredSchools.length })}</h3>
          <div className="users-search-container">
            <div className="users-search-filter-row">
              <select
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="users-filter-select"
              >
                <option value="all">{t('adminSchools.allFields')}</option>
                <option value="name">{t('adminSchools.schoolName')}</option>
                <option value="address">{t('adminSchools.address')}</option>
                <option value="contact">{t('adminSchools.contactPerson')}</option>
                <option value="phone">{t('adminSchools.phone')}</option>
                <option value="added">{t('adminSchools.addedDate')}</option>
              </select>
              
              <input
                type="text"
                placeholder={t('adminSchools.searchPlaceholder', { 
                  field: searchFilter === 'all' ? t('adminSchools.allFields').toLowerCase() : 
                    searchFilter === 'name' ? t('adminSchools.schoolName').toLowerCase() :
                    searchFilter === 'address' ? t('adminSchools.address').toLowerCase() :
                    searchFilter === 'contact' ? t('adminSchools.contactPerson').toLowerCase() :
                    searchFilter === 'phone' ? t('adminSchools.phone').toLowerCase() :
                    searchFilter === 'added' ? t('adminSchools.addedDate').toLowerCase() : 'schools'
                })}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="users-search-input"
              />
              
              {(searchQuery || searchFilter !== 'all') && (
                <button 
                  onClick={clearSearch}
                  className="users-clear-search-button"
                  title={t('adminSchools.clearSearch')}
                >
                  ×
                </button>
              )}
            </div>
            
            <button 
              onClick={() => {
                if (typeof fetchSchools === 'function') {
                  fetchSchools();
                } else {
                  console.warn('fetchSchools function is not available');
                }
              }} 
              className="refresh-button"
              disabled={loading}
            >
              {loading ? t('adminSchools.refreshing') + '...' : '↻ ' + t('adminSchools.refresh')}
            </button>
          </div>
        </div>

        {(searchQuery || searchFilter !== 'all') && (
          <div className="search-results-info">
            {t('adminSchools.showingResults', { 
              filtered: filteredSchools.length, 
              total: (schools || []).length,
              query: searchQuery,
              field: searchFilter !== 'all' ? (
                searchFilter === 'name' ? t('adminSchools.schoolName').toLowerCase() :
                searchFilter === 'address' ? t('adminSchools.address').toLowerCase() :
                searchFilter === 'contact' ? t('adminSchools.contactPerson').toLowerCase() :
                searchFilter === 'phone' ? t('adminSchools.phone').toLowerCase() :
                searchFilter === 'added' ? t('adminSchools.addedDate').toLowerCase() : searchFilter
              ) : ''
            })}
          </div>
        )}
        
        {loading ? (
          <div className="loading-users">{t('adminSchools.loadingSchools')}</div>
        ) : (
          <div className="users-table-wrapper">
            {filteredSchools.length > 0 ? (
              <table className="users-table">
                <thead>
                  <tr>
                    <th>{t('adminSchools.schoolName')}</th>
                    <th>{t('adminSchools.address')}</th>
                    <th>{t('adminSchools.contactPerson')}</th>
                    <th>{t('adminSchools.phone')}</th>
                    <th>{t('adminSchools.added')}</th>
                    <th>{t('adminSchools.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSchools.map(school => (
                    <tr key={school.id}>
                      <td style={{ fontWeight: '600', color: '#5e3c8f' }}>{school.name}</td>
                      <td>{school.address || '-'}</td>
                      <td>{school.contact_person || '-'}</td>
                      <td>{school.phone || '-'}</td>
                      <td>{formatDate(school.createdAt)}</td>
                      <td>
                        <div className="table-actions">
                          <button 
                            className="edit-button"
                            onClick={() => handleEditSchool(school)}
                            disabled={loading}
                          >
                            {t('common.edit')}
                          </button>
                          <button 
                            className="delete-button"
                            onClick={() => handleDeleteSchool(school.id)}
                            disabled={loading}
                          >
                            {t('common.delete')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="no-users">
                {searchQuery || searchFilter !== 'all' 
                  ? t('adminSchools.noSchoolsMatchSearch')
                  : t('adminSchools.noSchoolsFound')}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageSchools;