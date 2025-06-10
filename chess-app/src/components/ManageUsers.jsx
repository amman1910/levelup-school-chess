import React, { useState } from 'react';
import { db, auth, functions } from '../firebase';
import { doc, setDoc, updateDoc, deleteDoc, collection, query, where, getDocs, arrayRemove } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import './ManageUsers.css';

const ManageUsers = ({ users, setUsers, loading, setLoading, error, success, fetchUsers }) => {
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
        error('Please fill all required fields');
        setLoading(false);
        return;
      }

      if (isEditing) {
        await updateDoc(doc(db, "users", newUser.id), {
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          age: Number(newUser.age) || 0,
          role: newUser.role,
          updatedAt: new Date()
        });
        success('User updated successfully!');
      } else {
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
        success('User added successfully!');
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

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    setLoading(true);
    
    try {
      // מציאת המשתמש במטרה לקבל את האימייל והרול שלו
      const userToDelete = users.find(user => user.id === userId);
      if (!userToDelete) {
        error('User not found');
        setLoading(false);
        return;
      }

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
      success('User deleted successfully');
      fetchUsers();
    } catch (err) {
      console.error("Error deleting user:", err);
      error('Failed to delete user: ' + err.message);
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
        <h2>{isEditing ? 'Edit User' : 'Add New User'}</h2>
        <form onSubmit={handleAddUser} className="add-user-form">
          <div className="form-row">
            <div className="form-group">
              <label>ID Number*</label>
              <input
                type="text"
                name="id"
                value={newUser.id}
                onChange={handleUserChange}
                placeholder="User ID"
                required
                disabled={isEditing}
              />
            </div>
            
            <div className="form-group">
              <label>Email*</label>
              <input
                type="email"
                name="email"
                value={newUser.email}
                onChange={handleUserChange}
                placeholder="Email"
                required
              />
            </div>
          </div>

          {!isEditing && (
            <div className="form-row">
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  value={newUser.password}
                  onChange={handleUserChange}
                  placeholder="Temporary Password"
                />
              </div>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>First Name*</label>
              <input
                type="text"
                name="firstName"
                value={newUser.firstName}
                onChange={handleUserChange}
                placeholder="First Name"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Last Name*</label>
              <input
                type="text"
                name="lastName"
                value={newUser.lastName}
                onChange={handleUserChange}
                placeholder="Last Name"
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
                value={newUser.age}
                onChange={handleUserChange}
                placeholder="Age"
                min="10"
                max="99"
              />
            </div>
            
            <div className="form-group">
              <label>Role*</label>
              <select
                name="role"
                value={newUser.role}
                onChange={handleUserChange}
                required
              >
                <option value="">Select Role</option>
                <option value="admin">Admin</option>
                <option value="trainer">Trainer</option>
              </select>
            </div>
          </div>

          <div className="form-actions">
            {isEditing ? (
              <>
                <div className="edit-mode-info">
                  <span className="edit-indicator">✏️ Editing Mode:</span>
                  <span className="edit-description">You are currently editing user data. Make changes and click "Save Changes" to update.</span>
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
                {loading ? 'Adding...' : 'Add User'}
              </button>
            )}
          </div>
        </form>
      </div>
      
      <div className="user-list-section">
        <div className="users-list-header">
          <h3>Registered Users</h3>
          <div className="users-search-container">
            <div className="users-search-filter-row">
              <select
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="users-filter-select"
              >
                <option value="all">All Fields</option>
                <option value="id">ID</option>
                <option value="name">Name</option>
                <option value="email">Email</option>
                <option value="age">Age</option>
                <option value="role">Role</option>
              </select>
              
              <input
                type="text"
                placeholder={`Search ${searchFilter === 'all' ? 'users' : searchFilter}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="users-search-input"
              />
              
              {(searchQuery || searchFilter !== 'all') && (
                <button
                  onClick={handleClearSearch}
                  className="users-clear-search-button"
                  title="Clear search"
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
              {loading ? 'Refreshing...' : '↻ Refresh List'}
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="loading-users">Loading users...</div>
        ) : (
          <div className="users-table-wrapper">
            {filteredUsers.length > 0 ? (
              <>
                {(searchQuery || searchFilter !== 'all') && (
                  <div className="search-results-info">
                    Found {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} 
                    {searchFilter !== 'all' ? ` in ${searchFilter}` : ''}
                    {searchQuery ? ` matching "${searchQuery}"` : ''}
                  </div>
                )}
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Age</th>
                      <th>Role</th>
                      <th>Added</th>
                      <th>Actions</th>
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
                            {user.role}
                          </span>
                        </td>
                        <td>{formatDate(user.createdAt)}</td>
                        <td>
                          <div className="table-actions">
                            <button
                              className="edit-button"
                              onClick={() => handleEditUser(user)}
                            >
                              Edit
                            </button>
                            <button
                              className="delete-button"
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              Delete
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
                  ? `No users found matching your search criteria.` 
                  : 'No users found. Start by adding your first user.'
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