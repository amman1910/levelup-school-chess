import React, { useState } from 'react';
import { useTranslation } from 'react-i18next'; // הוספת useTranslation
import { db, auth, functions } from '../firebase';
import { doc, setDoc, updateDoc, deleteDoc, collection, query, where, getDocs, arrayRemove } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import './ManageUsers.css';
import { logAdminAction } from '../utils/adminLogger';

const ManageUsers = ({ users, setUsers, loading, setLoading, error, success, fetchUsers }) => {
  const { t } = useTranslation(); // הוספת hook לתרגום
  
  const [isEditing, setIsEditing] = useState(false);
  const [newUser, setNewUser] = useState({
    id: '',
    firstName: '',
    lastName: '',
    email: '',
    age: '',
    role: '',
    password: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState('all');

  const handleUserChange = (e) => {
    setNewUser({ ...newUser, [e.target.name]: e.target.value });
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    error('');
    success('');
    
    try {
      if (!newUser.id || !newUser.email || !newUser.firstName || !newUser.lastName || !newUser.role) {
        error(t('adminUsers.fillAllRequiredFields'));
        setLoading(false);
        return;
      }
       const currentAdmin = JSON.parse(localStorage.getItem('user'));

      if (isEditing) {
        await updateDoc(doc(db, "users", newUser.id), {
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          age: Number(newUser.age) || 0,
          role: newUser.role,
          updatedAt: new Date()
        });
        await logAdminAction({
          admin: currentAdmin,
          actionType: 'update-user',
          targetType: 'user',
          targetId: newUser.id,
          description: `Updated user ${newUser.firstName} ${newUser.lastName} (${newUser.email})`
      });
        success(t('adminUsers.userUpdatedSuccessfully'));
      } else {
        // בדיקה אם יוזר עם ID זה כבר קיים
        const existingUser = (users || []).find(user => user.id === newUser.id);
        if (existingUser) {
          error(t('adminUsers.userIdExists', { id: newUser.id }));
          setLoading(false);
          return;
        }

        // בדיקה אם יוזר עם אימייל זה כבר קיים
        const existingEmailUser = (users || []).find(user => user.email === newUser.email);
        if (existingEmailUser) {
          error(t('adminUsers.userEmailExists', { email: newUser.email }));
          setLoading(false);
          return;
        }

        // יצירת משתמש ב-Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, newUser.email, newUser.password);
        const uid = userCredential.user.uid; // שמירת ה-UID
        
        // יצירת מסמך ב-Firestore עם ה-UID
        await setDoc(doc(db, "users", newUser.id), {
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          age: Number(newUser.age) || 0,
          role: newUser.role,
          uid: uid, // שמירת ה-UID מ-Authentication
          createdAt: new Date(),
          firstLogin: true
        });
              
      await logAdminAction({
        admin: currentAdmin,
        actionType: 'add-user',
        targetType: 'user',
        targetId: newUser.id,
        description: `Added user ${newUser.firstName} ${newUser.lastName} (${newUser.email})`
      });
        success(t('adminUsers.userAddedSuccessfully'));
      }

      setNewUser({
        id: '',
        firstName: '',
        lastName: '',
        email: '',
        age: '',
        role: '',
        password: ''
      });
      setIsEditing(false);
      fetchUsers();
    } catch (err) {
      console.error("Error:", err);
      error(err.message);
    }
    setLoading(false);
  };

  // פונקציה לעדכון classes כשמוחקים trainer
  const updateClassesOnTrainerDelete = async (trainerId) => {
    try {
      console.log(`Updating classes for trainer deletion: ${trainerId}`);
      
      // שליפת כל המסמכים מ-classes שיש להם את ה-trainer ID ב-assignedTrainer
      const classesQuery = query(collection(db, 'classes'), where('assignedTrainer', '==', trainerId));
      const classesSnapshot = await getDocs(classesQuery);
      
      // עדכון כל המסמכים - הגדרת assignedTrainer ל-null
      const updatePromises = classesSnapshot.docs.map(docRef => 
        updateDoc(docRef.ref, { assignedTrainer: null })
      );
      
      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
        console.log(`Updated ${updatePromises.length} classes - set assignedTrainer to null`);
        return updatePromises.length;
      } else {
        console.log("No classes found with this trainer ID");
        return 0;
      }
      
    } catch (error) {
      console.error("Error updating classes:", error);
      throw error;
    }
  };

  // פונקציה לעדכון learningMaterials כשמוחקים trainer
  const updateLearningMaterialsOnTrainerDelete = async (trainerId) => {
    try {
      console.log(`Updating learningMaterials for trainer deletion: ${trainerId}`);
      
      // שליפת כל המסמכים מ-learningMaterials שיש להם את ה-trainer ID ב-trainerIdAccess array
      const learningMaterialsQuery = query(collection(db, 'learningMaterials'), where('trainerIdAccess', 'array-contains', trainerId));
      const learningMaterialsSnapshot = await getDocs(learningMaterialsQuery);
      
      // עדכון כל המסמכים - הסרת trainerId מהמערך trainerIdAccess
      const updatePromises = learningMaterialsSnapshot.docs.map(docRef => 
        updateDoc(docRef.ref, {
          trainerIdAccess: arrayRemove(trainerId)
        })
      );
      
      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
        console.log(`Updated ${updatePromises.length} learning materials - removed trainer from trainerIdAccess array`);
        return updatePromises.length;
      } else {
        console.log("No learning materials found with this trainer ID");
        return 0;
      }
      
    } catch (error) {
      console.error("Error updating learning materials:", error);
      throw error;
    }
  };

  // פונקציה למחיקת notifications כשמוחקים trainer
  const deleteNotificationsOnTrainerDelete = async (trainerId) => {
    try {
      console.log(`Deleting notifications for trainer deletion: ${trainerId}`);
      
      // שליפת כל המסמכים מ-notifications שיש להם את ה-trainer ID ב-recieverId
      const notificationsQuery = query(collection(db, 'notifications'), where('recieverId', '==', trainerId));
      const notificationsSnapshot = await getDocs(notificationsQuery);
      
      // מחיקת כל המסמכים
      const deletePromises = notificationsSnapshot.docs.map(docRef => 
        deleteDoc(docRef.ref)
      );
      
      if (deletePromises.length > 0) {
        await Promise.all(deletePromises);
        console.log(`Deleted ${deletePromises.length} notifications with recieverId = ${trainerId}`);
        return deletePromises.length;
      } else {
        console.log("No notifications found with this trainer ID");
        return 0;
      }
      
    } catch (error) {
      console.error("Error deleting notifications:", error);
      throw error;
    }
  };

  // פונקציה למחיקת adminLogs כשמוחקים יוזר
  const deleteAdminLogsOnUserDelete = async (userName) => {
    try {
      console.log(`Deleting adminLogs for user deletion: ${userName}`);
      
      // שליפת כל המסמכים מ-adminLogs שיש להם את שם היוזר ב-adminName
      const adminLogsQuery = query(collection(db, 'adminLogs'), where('adminName', '==', userName));
      const adminLogsSnapshot = await getDocs(adminLogsQuery);
      
      // מחיקת כל המסמכים
      const deletePromises = adminLogsSnapshot.docs.map(docRef => 
        deleteDoc(docRef.ref)
      );
      
      if (deletePromises.length > 0) {
        await Promise.all(deletePromises);
        console.log(`Deleted ${deletePromises.length} admin logs with adminName = ${userName}`);
        return deletePromises.length;
      } else {
        console.log("No admin logs found with this user name");
        return 0;
      }
      
    } catch (error) {
      console.error("Error deleting admin logs:", error);
      throw error;
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm(t('adminUsers.confirmDeleteUser'))) return;
    setLoading(true);
    const currentAdmin = JSON.parse(localStorage.getItem('user'));

    
    try {
      // מציאת המשתמש במטרה לקבל את האימייל והרול שלו
      const userToDelete = users.find(user => user.id === userId);
      if (!userToDelete) {
        error(t('adminUsers.userNotFound'));
        setLoading(false);
        return;
      }

      // בניית השם המלא של היוזר
      const userFullName = `${userToDelete.firstName} ${userToDelete.lastName}`.trim();

      // מחיקת כל הlogs של היוזר מקולקשן adminLogs
      await deleteAdminLogsOnUserDelete(userFullName);

      // אם זה trainer, עדכן את כל ה-collections קודם
      if (userToDelete.role === 'trainer') {
        console.log("User is a trainer, updating all related collections...");
        
        // עדכון classes
        await updateClassesOnTrainerDelete(userId);
        
        // עדכון learningMaterials
        await updateLearningMaterialsOnTrainerDelete(userId);
        
        // מחיקת notifications
        await deleteNotificationsOnTrainerDelete(userId);
      }

      // קריאה ל-Cloud Function למחיקת המשתמש מ-Authentication
      const deleteUserFromAuth = httpsCallable(functions, 'deleteUserFromAuth');
      await deleteUserFromAuth({ email: userToDelete.email });

      // מחיקת המסמך מ-Firestore
      await deleteDoc(doc(db, "users", userId));
      
      // הודעת הצלחה פשוטה
      await logAdminAction({
  admin: currentAdmin,
  actionType: 'delete-user',
  targetType: 'user',
  targetId: userId,
  description: `Deleted user ${userToDelete.firstName} ${userToDelete.lastName} (${userToDelete.email})`
});

      success(t('adminUsers.userDeletedSuccessfully'));
      fetchUsers();
    } catch (err) {
      console.error("Error deleting user:", err);
      error(t('adminUsers.failedToDeleteUser') + ': ' + err.message);
    }
    setLoading(false);
  };

  const handleEditUser = (userData) => {
    setNewUser({
      id: userData.id,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      age: userData.age,
      role: userData.role,
      password: ''
    });
    setIsEditing(true);

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

  const handleCancelEdit = () => {
    setNewUser({
      id: '',
      firstName: '',
      lastName: '',
      email: '',
      age: '',
      role: '',
      password: ''
    });
    setIsEditing(false);
  };

  // פונקציה לפורמט התאריך
  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-GB'); // DD/MM/YYYY
    } catch (err) {
      return '-';
    }
  };

  // Enhanced filter function with category-specific search
  const filteredUsers = (users || []).filter(user => {
    try {
      if (!searchQuery.trim()) return true;
      
      const query = searchQuery.toLowerCase();
      
      switch (searchFilter) {
        case 'id':
          return (user.id || '').toLowerCase().includes(query);
        case 'name':
          return `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase().includes(query);
        case 'email':
          return (user.email || '').toLowerCase().includes(query);
        case 'age':
          return (user.age || '').toString().includes(query);
        case 'role':
          return (user.role || '').toLowerCase().includes(query);
        case 'all':
        default:
          return (
            (user.id || '').toLowerCase().includes(query) ||
            `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase().includes(query) ||
            (user.email || '').toLowerCase().includes(query) ||
            (user.age || '').toString().includes(query) ||
            (user.role || '').toLowerCase().includes(query)
          );
      }
    } catch (err) {
      console.error('Error filtering user:', err, user);
      return false;
    }
  }).sort((a, b) => {
    // מיון לפי תאריך יצירה - החדש ביותר ראשון
    const dateA = a.createdAt ? (a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt)) : new Date(0);
    const dateB = b.createdAt ? (b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt)) : new Date(0);
    return dateB - dateA;
  });

  // Clear search function
  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchFilter('all');
  };

  return (
    <div className="user-management-container">
      <div className="add-user-section">
        <h2>{isEditing ? t('adminUsers.editUser') : t('adminUsers.addNewUser')}</h2>
        <form onSubmit={handleAddUser} className="add-user-form">
          <div className="form-row">
            <div className="form-group">
              <label>{t('adminUsers.idNumberRequired')}</label>
              <input
                type="text"
                name="id"
                value={newUser.id}
                onChange={handleUserChange}
                placeholder={t('adminUsers.idNumberPlaceholder')}
                required
                disabled={isEditing}
              />
            </div>
            
            <div className="form-group">
              <label>{t('adminUsers.emailRequired')}</label>
              <input
                type="email"
                name="email"
                value={newUser.email}
                onChange={handleUserChange}
                placeholder={t('adminUsers.emailPlaceholder')}
                required
              />
            </div>
          </div>

          {!isEditing && (
            <div className="form-row">
              <div className="form-group">
                <label>{t('adminUsers.password')}</label>
                <input
                  type="password"
                  name="password"
                  value={newUser.password}
                  onChange={handleUserChange}
                  placeholder={t('adminUsers.passwordPlaceholder')}
                />
              </div>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>{t('adminUsers.firstNameRequired')}</label>
              <input
                type="text"
                name="firstName"
                value={newUser.firstName}
                onChange={handleUserChange}
                placeholder={t('adminUsers.firstNamePlaceholder')}
                required
              />
            </div>
            
            <div className="form-group">
              <label>{t('adminUsers.lastNameRequired')}</label>
              <input
                type="text"
                name="lastName"
                value={newUser.lastName}
                onChange={handleUserChange}
                placeholder={t('adminUsers.lastNamePlaceholder')}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>{t('adminUsers.age')}</label>
              <input
                type="number"
                name="age"
                value={newUser.age}
                onChange={handleUserChange}
                placeholder={t('adminUsers.agePlaceholder')}
                min="10"
                max="99"
              />
            </div>
            
            <div className="form-group">
              <label>{t('adminUsers.roleRequired')}</label>
              <select
                name="role"
                value={newUser.role}
                onChange={handleUserChange}
                required
              >
                <option value="">{t('adminUsers.selectRole')}</option>
                <option value="admin">{t('adminUsers.admin')}</option>
                <option value="trainer">{t('adminUsers.trainer')}</option>
              </select>
            </div>
          </div>

          <div className="form-actions">
            {isEditing ? (
              <>
                <div className="edit-mode-info">
                  <span className="edit-indicator">✏️ {t('adminUsers.editingMode')}</span>
                  <span className="edit-description">{t('adminUsers.editingDescription')}</span>
                </div>
                <div className="edit-buttons-row">
                  <button 
                    type="submit" 
                    className="save-button"
                    disabled={loading}
                  >
                    {loading ? t('adminUsers.saving') + '...' : t('adminUsers.saveChanges')}
                  </button>
                  <button
                    type="button"
                    className="cancel-button"
                    onClick={handleCancelEdit}
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
                {loading ? t('adminUsers.adding') + '...' : t('adminUsers.addUser')}
              </button>
            )}
          </div>
        </form>
      </div>
      
      <div className="user-list-section">
        <div className="users-list-header">
          <h3>{t('adminUsers.registeredUsers')}</h3>
          <div className="users-search-container">
            <div className="users-search-filter-row">
              <select
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="users-filter-select"
              >
                <option value="all">{t('adminUsers.allFields')}</option>
                <option value="id">{t('adminUsers.id')}</option>
                <option value="name">{t('adminUsers.name')}</option>
                <option value="email">{t('adminUsers.email')}</option>
                <option value="age">{t('forms.age')}</option>
                <option value="role">{t('adminUsers.role')}</option>
              </select>
              
              <input
                type="text"
                placeholder={t('adminUsers.searchPlaceholder', { 
                  field: searchFilter === 'all' ? t('adminUsers.allFields').toLowerCase() : 
                    searchFilter === 'id' ? t('adminUsers.id').toLowerCase() :
                    searchFilter === 'name' ? t('adminUsers.name').toLowerCase() :
                    searchFilter === 'email' ? t('adminUsers.email').toLowerCase() :
                    searchFilter === 'age' ? t('forms.age').toLowerCase() :
                    searchFilter === 'role' ? t('adminUsers.role').toLowerCase() : searchFilter
                })}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="users-search-input"
              />
              
              {(searchQuery || searchFilter !== 'all') && (
                <button
                  onClick={handleClearSearch}
                  className="users-clear-search-button"
                  title={t('adminUsers.clearSearch')}
                >
                  ✕
                </button>
              )}
            </div>
            
            <button 
              onClick={fetchUsers} 
              className="refresh-button"
              disabled={loading}
            >
              {loading ? t('adminUsers.refreshing') + '...' : '↻ ' + t('adminUsers.refreshList')}
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="loading-users">{t('adminUsers.loadingUsers')}</div>
        ) : (
          <div className="users-table-wrapper">
            {filteredUsers.length > 0 ? (
              <>
                {(searchQuery || searchFilter !== 'all') && (
                  <div className="search-results-info">
                    {t('adminUsers.foundResults', { count: filteredUsers.length })}
                    {searchFilter !== 'all' ? ` ${t('adminUsers.inField', { field: searchFilter })}` : ''}
                    {searchQuery ? ` ${t('adminUsers.matching', { query: searchQuery })}` : ''}
                  </div>
                )}
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>{t('adminUsers.id')}</th>
                      <th>{t('adminUsers.name')}</th>
                      <th>{t('adminUsers.email')}</th>
                      <th>{t('forms.age')}</th>
                      <th>{t('adminUsers.role')}</th>
                      <th>{t('adminUsers.added')}</th>
                      <th>{t('adminUsers.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(user => (
                      <tr key={user.id}>
                        <td>{user.id}</td>
                        <td>{`${user.firstName} ${user.lastName}`}</td>
                        <td>{user.email}</td>
                        <td>{user.age || '-'}</td>
                        <td>
                          <span className={`role-badge ${user.role}`}>
                            {user.role === 'admin' ? t('adminUsers.admin') : t('adminUsers.trainer')}
                          </span>
                        </td>
                        <td>{formatDate(user.createdAt)}</td>
                        <td>
                          <div className="table-actions">
                            <button
                              className="edit-button"
                              onClick={() => handleEditUser(user)}
                            >
                              {t('common.edit')}
                            </button>
                            <button
                              className="delete-button"
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              {t('common.delete')}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : (
              <div className="no-users">
                {searchQuery || searchFilter !== 'all' 
                  ? t('adminUsers.noUsersMatchSearch')
                  : t('adminUsers.noUsersFound')
                }
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageUsers;