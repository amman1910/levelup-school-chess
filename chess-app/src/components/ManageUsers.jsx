import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

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
        const auth = getAuth();
        await createUserWithEmailAndPassword(auth, newUser.email, newUser.password);
        
        await setDoc(doc(db, "users", newUser.id), {
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          age: Number(newUser.age) || 0,
          role: newUser.role,
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

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, "users", userId));
      success('User deleted successfully');
      fetchUsers();
    } catch (err) {
      error('Failed to delete user');
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

  // Filter users based on search query with error handling
  const filteredUsers = (users || []).filter(user => {
    try {
      return (
        `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.role || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    } catch (err) {
      console.error('Error filtering user:', err, user);
      return false;
    }
  });

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
          <div className="search-container">
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
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
              <table className="users-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Age</th>
                    <th>Role</th>
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
            ) : (
              <div className="no-users">
                {searchQuery ? 'No users match your search.' : 'No users found. Start by adding your first user.'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageUsers;