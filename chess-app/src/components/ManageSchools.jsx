import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, addDoc, deleteDoc, updateDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { logAdminAction } from '../utils/adminLogger';

const ManageSchools = ({ schools, setSchools, loading, setLoading, error, success, setError, setSuccess, fetchSchools }) => {
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
        errorFunction('Please fill the required field: School Name');
        setLoading(false);
        return;
      }

      // Check if school name already exists (case insensitive)
      const existingSchoolByName = (schools || []).find(school => 
        school.name.toLowerCase().trim() === newSchool.name.toLowerCase().trim()
      );
      if (existingSchoolByName && (!isEditing || existingSchoolByName.id !== editingSchool)) {
        console.log('School name exists - calling error function');
        errorFunction(`A school with the name "${newSchool.name}" already exists. Please choose a different name.`);
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
        successFunction('School updated successfully!');
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
        successFunction('School added successfully!');
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
      errorFunction('School not found');
      return;
    }

    const schoolName = schoolToDelete.name;
    
    if (!window.confirm(`Are you sure you want to delete "${schoolName}"?\n\nThis will also delete:\n- All classes associated with this school\n- All sessions associated with this school\n\nThis action cannot be undone.`)) {
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
      successFunction(`School "${schoolName}" deleted successfully`);
      
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
      errorFunction('Failed to delete school: ' + err.message);
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
        <h2>{isEditing ? 'Edit School' : 'Add New School'}</h2>
        
        <form onSubmit={handleAddSchool} className="add-user-form">
          <div className="form-row">
            <div className="form-group">
              <label>School Name*</label>
              <input
                type="text"
                name="name"
                value={newSchool.name}
                onChange={handleSchoolChange}
                placeholder="School Name"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Address</label>
              <input
                type="text"
                name="address"
                value={newSchool.address}
                onChange={handleSchoolChange}
                placeholder="School Address"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Contact Person</label>
              <input
                type="text"
                name="contact_person"
                value={newSchool.contact_person}
                onChange={handleSchoolChange}
                placeholder="Contact Person Name"
              />
            </div>
            
            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                name="phone"
                value={newSchool.phone}
                onChange={handleSchoolChange}
                placeholder="Phone Number"
              />
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
                    You are currently editing this school. Make your changes and click Save, or Cancel to discard changes.
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
                {loading ? 'Adding...' : 'Add School'}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Schools List Section */}
      <div className="user-list-section">
        <div className="users-list-header">
          <h3>Schools List ({filteredSchools.length})</h3>
          <div className="users-search-container">
            <div className="users-search-filter-row">
              <select
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="users-filter-select"
              >
                <option value="all">All Fields</option>
                <option value="name">School Name</option>
                <option value="address">Address</option>
                <option value="contact">Contact Person</option>
                <option value="phone">Phone</option>
                <option value="added">Added Date</option>
              </select>
              
              <input
                type="text"
                placeholder={`Search ${searchFilter === 'all' ? 'all fields' : 
                  searchFilter === 'name' ? 'school name' :
                  searchFilter === 'address' ? 'address' :
                  searchFilter === 'contact' ? 'contact person' :
                  searchFilter === 'phone' ? 'phone' :
                  searchFilter === 'added' ? 'date' : 'schools'}...`}
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
                if (typeof fetchSchools === 'function') {
                  fetchSchools();
                } else {
                  console.warn('fetchSchools function is not available');
                }
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
            Showing {filteredSchools.length} of {(schools || []).length} schools
            {searchQuery && ` matching "${searchQuery}"`}
            {searchFilter !== 'all' && ` in ${
              searchFilter === 'name' ? 'school name' :
              searchFilter === 'address' ? 'address' :
              searchFilter === 'contact' ? 'contact person' :
              searchFilter === 'phone' ? 'phone' :
              searchFilter === 'added' ? 'added date' : searchFilter
            }`}
          </div>
        )}
        
        {loading ? (
          <div className="loading-users">Loading schools...</div>
        ) : (
          <div className="users-table-wrapper">
            {filteredSchools.length > 0 ? (
              <table className="users-table">
                <thead>
                  <tr>
                    <th>School Name</th>
                    <th>Address</th>
                    <th>Contact Person</th>
                    <th>Phone</th>
                    <th>Added</th>
                    <th>Actions</th>
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
                            Edit
                          </button>
                          <button 
                            className="delete-button"
                            onClick={() => handleDeleteSchool(school.id)}
                            disabled={loading}
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
                {searchQuery || searchFilter !== 'all' 
                  ? `No schools match your search criteria.` 
                  : 'No schools found. Add your first school.'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageSchools;