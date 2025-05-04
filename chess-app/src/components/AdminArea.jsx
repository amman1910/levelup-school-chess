import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, doc, setDoc, getDocs, deleteDoc, updateDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import './AdminArea.css';

const AdminArea = () => {
  const [user, setUser] = useState(null);
  const [section, setSection] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
  const [newUser, setNewUser] = useState({
    id: '',
    firstName: '',
    secondName: '',
    email: '',
    age: '',
    role: '',
    password: '' // Added for user creation in authentication
  });
  
  const navigate = useNavigate();
  
  useEffect(() => {
    const loggedInUser = localStorage.getItem('user');
    if (!loggedInUser) {
      navigate('/login');
      return;
    }
    
    const userData = JSON.parse(loggedInUser);
    // Verify user is admin
    if (userData.role !== 'admin') {
      navigate('/login');
      return;
    }
    
    setUser(userData);
    
    // Fetch users automatically when component mounts
    if (section === 'manageUsers') {
      fetchUsers();
    }
  }, [navigate, section]);
  
  // Effect to fetch users when section changes to manageUsers
  useEffect(() => {
    if (section === 'manageUsers') {
      fetchUsers();
    }
  }, [section]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const usersSnapshot = await getDocs(collection(db, "users"));
      const usersList = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersList);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to load users. Please try again.");
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setNewUser({ ...newUser, [e.target.name]: e.target.value });
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Validation
      if (!newUser.id || !newUser.email || !newUser.firstName || !newUser.secondName || !newUser.role) {
        setError('Please fill all required fields');
        setLoading(false);
        return;
      }
      
      if (isEditing) {
        // Update existing user
        await updateDoc(doc(db, "users", newUser.id), {
          firstName: newUser.firstName,
          secondName: newUser.secondName,
          email: newUser.email,
          age: Number(newUser.age) || 0,
          role: newUser.role,
          updatedAt: new Date()
        });
        
        setSuccess('User updated successfully!');
      } else {
        // For new users, create authentication account if password is provided
        if (newUser.password) {
          try {
            const auth = getAuth();
            await createUserWithEmailAndPassword(auth, newUser.email, newUser.password);
          } catch (authError) {
            console.error("Authentication error:", authError);
            setError(`Authentication Error: ${authError.message}`);
            setLoading(false);
            return;
          }
        }
        
        // Add to Firestore
        await setDoc(doc(db, "users", newUser.id), {
          firstName: newUser.firstName,
          secondName: newUser.secondName,
          email: newUser.email,
          age: Number(newUser.age) || 0,
          role: newUser.role,
          createdAt: new Date()
        });
        
        setSuccess('User added successfully!');
      }
      
      // Reset form after successful operation
      setNewUser({
        id: '',
        firstName: '',
        secondName: '',
        email: '',
        age: '',
        role: '',
        password: ''
      });
      
      setIsEditing(false);
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error("Error with user operation:", error);
      setError(`Error: ${error.message}`);
    }
    
    setLoading(false);
  };

  const handleEditUser = (userData) => {
    setNewUser({
      id: userData.id,
      firstName: userData.firstName || '',
      secondName: userData.secondName || '',
      email: userData.email || '',
      age: userData.age || '',
      role: userData.role || '',
      password: '' // Don't populate password for editing
    });
    setIsEditing(true);
    setSection('manageUsers');
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) {
      return;
    }
    
    setLoading(true);
    try {
      await deleteDoc(doc(db, "users", userId));
      setSuccess('User deleted successfully');
      fetchUsers(); // Refresh the list
    } catch (err) {
      console.error("Error deleting user:", err);
      setError('Failed to delete user');
    }
    setLoading(false);
  };

  const handleCancelEdit = () => {
    setNewUser({
      id: '',
      firstName: '',
      secondName: '',
      email: '',
      age: '',
      role: '',
      password: ''
    });
    setIsEditing(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="admin-area">
      <div className="admin-sidebar">
        <div className="logo-wrapper">
          <h2>LEVEL UP</h2>
          <div className="subtitle">Chess Club Management</div>
        </div>
        
        <nav className="admin-nav">
          <button 
            className={section === 'dashboard' ? 'active' : ''} 
            onClick={() => setSection('dashboard')}
          >
            Dashboard
          </button>
          <button 
            className={section === 'manageUsers' ? 'active' : ''} 
            onClick={() => {
              setSection('manageUsers');
            }}
          >
            Manage Users
          </button>
        </nav>
        
        <div className="admin-footer">
          <div className="user-info">
            <div className="user-email">{user.email}</div>
            <div className="user-role">Administrator</div>
          </div>
          <button onClick={handleLogout} className="logout-button">Logout</button>
        </div>
      </div>
      
      <div className="admin-content">
        <div className="admin-header">
          <h1>{section === 'dashboard' ? 'Admin Dashboard' : 'User Management'}</h1>
        </div>
        
        <div className="admin-main">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          
          {section === 'dashboard' && (
            <div className="dashboard-content">
              <div className="welcome-card">
                <h2>Welcome, Administrator!</h2>
                <p>This is your control panel for managing the LEVEL UP Chess Club system.</p>
                <p>Use the sidebar navigation to access different administrative functions.</p>
              </div>
              
              <div className="quick-actions">
                <h3>Quick Actions</h3>
                <div className="action-buttons">
                  <button onClick={() => {
                    setSection('manageUsers');
                  }} className="action-button">
                    Manage Users
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {section === 'manageUsers' && (
            <div className="user-management-container">
              <div className="add-user-section">
                <h2>{isEditing ? 'Edit User' : 'Add New User'}</h2>
                <form onSubmit={handleAddUser} className="add-user-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="id">ID Number*</label>
                      <input
                        type="text"
                        name="id"
                        id="id"
                        value={newUser.id}
                        onChange={handleChange}
                        placeholder="ID Number"
                        required
                        disabled={isEditing}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="email">Email*</label>
                      <input
                        type="email"
                        name="email"
                        id="email"
                        value={newUser.email}
                        onChange={handleChange}
                        placeholder="Email"
                        required
                      />
                    </div>
                  </div>
                  
                  {!isEditing && (
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                          type="password"
                          name="password"
                          id="password"
                          value={newUser.password}
                          onChange={handleChange}
                          placeholder="Password for authentication"
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="firstName">First Name*</label>
                      <input
                        type="text"
                        name="firstName"
                        id="firstName"
                        value={newUser.firstName}
                        onChange={handleChange}
                        placeholder="First Name"
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="secondName">Last Name*</label>
                      <input
                        type="text"
                        name="secondName"
                        id="secondName"
                        value={newUser.secondName}
                        onChange={handleChange}
                        placeholder="Last Name"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="age">Age</label>
                      <input
                        type="number"
                        name="age"
                        id="age"
                        value={newUser.age}
                        onChange={handleChange}
                        placeholder="Age"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="role">Role*</label>
                      <select
                        name="role"
                        id="role"
                        value={newUser.role}
                        onChange={handleChange}
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
                        <button type="submit" className="save-button" disabled={loading}>
                          {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button type="button" className="cancel-button" onClick={handleCancelEdit}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button type="submit" className="add-button" disabled={loading}>
                        {loading ? 'Adding...' : 'Add User'}
                      </button>
                    )}
                  </div>
                </form>
              </div>
              
              <div className="user-list-section">
                <div className="users-list-header">
                  <h3>User List</h3>
                  <button onClick={fetchUsers} className="refresh-button" disabled={loading}>
                    {loading ? 'Loading...' : 'Refresh List'}
                  </button>
                </div>
                
                {loading ? (
                  <div className="loading-users">Loading users...</div>
                ) : (
                  <div className="users-table-wrapper">
                    {users.length > 0 ? (
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
                          {users.map((user) => (
                            <tr key={user.id}>
                              <td>{user.id}</td>
                              <td>{`${user.firstName || ''} ${user.secondName || ''}`}</td>
                              <td>{user.email}</td>
                              <td>{user.age || '-'}</td>
                              <td>
                                <span className={`role-badge ${user.role}`}>
                                  {user.role}
                                </span>
                              </td>
                              <td>
                                <div className="table-actions">
                                  <button onClick={() => handleEditUser(user)} className="edit-button">
                                    Edit
                                  </button>
                                  <button onClick={() => handleDeleteUser(user.id)} className="delete-button">
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="no-users">No users found. Add your first user to get started.</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminArea;