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
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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

  const [newClass, setNewClass] = useState({
    id: '',
    className: '',
    school: '',
    level: 'beginner',
    assignedTrainer: ''
  });

  const navigate = useNavigate();

  useEffect(() => {
    const loggedInUser = localStorage.getItem('user');
    if (!loggedInUser) {
      navigate('/login');
      return;
    }

    const userData = JSON.parse(loggedInUser);
    if (userData.role !== 'admin') {
      navigate('/login');
      return;
    }

    setUser(userData);

    if (section === 'manageUsers') fetchUsers();
    if (section === 'manageClasses') fetchClasses();
  }, [navigate, section]);

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
      setError("Failed to load users");
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const classesSnapshot = await getDocs(collection(db, "classes"));
      const classesList = classesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setClasses(classesList);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching classes:", err);
      setError("Failed to load classes");
      setLoading(false);
    }
  };

  const handleUserChange = (e) => {
    setNewUser({ ...newUser, [e.target.name]: e.target.value });
  };

  const handleClassChange = (e) => {
    setNewClass({ ...newClass, [e.target.name]: e.target.value });
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      if (!newUser.id || !newUser.email || !newUser.firstName || !newUser.lastName || !newUser.role) {
        setError('Please fill all required fields');
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
        setSuccess('User updated successfully!');
      } else {
        const auth = getAuth();
        await createUserWithEmailAndPassword(auth, newUser.email, newUser.password);
        
        await setDoc(doc(db, "users", newUser.id), {
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          age: Number(newUser.age) || 0,
          role: newUser.role,
          createdAt: new Date()
        });
        setSuccess('User added successfully!');
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
    } catch (error) {
      console.error("Error:", error);
      setError(error.message);
    }
    setLoading(false);
  };

  const handleAddClass = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      if (!newClass.id || !newClass.className) {
        setError('Please fill required fields');
        setLoading(false);
        return;
      }

      await setDoc(doc(db, "classes", newClass.id), {
        className: newClass.className,
        school: newClass.school,
        level: newClass.level,
        assignedTrainer: newClass.assignedTrainer,
        createdAt: new Date()
      });

      setSuccess('Class added successfully!');
      setNewClass({
        id: '',
        className: '',
        school: '',
        level: 'beginner',
        assignedTrainer: ''
      });
      fetchClasses();
    } catch (error) {
      console.error("Error:", error);
      setError(error.message);
    }
    setLoading(false);
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, "users", userId));
      setSuccess('User deleted successfully');
      fetchUsers();
    } catch (err) {
      setError('Failed to delete user');
    }
    setLoading(false);
  };

  const handleDeleteClass = async (classId) => {
    if (!window.confirm("Are you sure you want to delete this class?")) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, "classes", classId));
      setSuccess('Class deleted successfully');
      fetchClasses();
    } catch (err) {
      setError('Failed to delete class');
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

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) return <div className="loading">Loading...</div>;

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
            onClick={() => setSection('manageUsers')}
          >
            Manage Users
          </button>
          <button 
            className={section === 'manageClasses' ? 'active' : ''} 
            onClick={() => setSection('manageClasses')}
          >
            Manage Classes
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
          <h1>
            {section === 'dashboard' && 'Admin Dashboard'}
            {section === 'manageUsers' && 'User Management'}
            {section === 'manageClasses' && 'Class Management'}
          </h1>
        </div>
        
        <div className="admin-main">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          
          {section === 'dashboard' && (
            <div className="dashboard-content">
              <div className="welcome-card">
                <h2>Welcome, Administrator!</h2>
                <p>This is your control panel for managing the LEVEL UP Chess Club system.</p>
              </div>
              
              <div className="quick-actions">
                <h3>Quick Actions</h3>
                <div className="action-buttons">
                  <button onClick={() => setSection('manageUsers')} className="action-button">
                    Manage Users
                  </button>
                  <button onClick={() => setSection('manageClasses')} className="action-button">
                    Manage Classes
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
                  <button 
                    onClick={fetchUsers} 
                    className="refresh-button"
                    disabled={loading}
                  >
                    {loading ? 'Refreshing...' : '↻ Refresh List'}
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
                          {users.map(user => (
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
                        No users found. Start by adding your first user.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {section === 'manageClasses' && (
            <div className="class-management-container">
              <div className="add-user-section">
                <h2>Add New Class</h2>
                <form onSubmit={handleAddClass} className="add-user-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Class ID*</label>
                      <input
                        type="text"
                        name="id"
                        value={newClass.id}
                        onChange={handleClassChange}
                        placeholder="Class ID"
                        required
                      />
                    </div>
                    
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
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>School</label>
                      <input
                        type="text"
                        name="school"
                        value={newClass.school}
                        onChange={handleClassChange}
                        placeholder="School Name"
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
                      <label>Assigned Trainer</label>
                      <select
                        name="assignedTrainer"
                        value={newClass.assignedTrainer}
                        onChange={handleClassChange}
                      >
                        <option value="">Select Trainer</option>
                        {users
                          .filter(u => u.role === 'trainer')
                          .map(trainer => (
                            <option key={trainer.id} value={trainer.id}>
                              {trainer.firstName} {trainer.lastName}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button 
                      type="submit" 
                      className="add-button"
                      disabled={loading}
                    >
                      {loading ? 'Adding...' : 'Add Class'}
                    </button>
                  </div>
                </form>
              </div>

              <div className="user-list-section">
                <div className="users-list-header">
                  <h3>Class List</h3>
                  <button 
                    onClick={fetchClasses} 
                    className="refresh-button"
                    disabled={loading}
                  >
                    {loading ? 'Refreshing...' : '↻ Refresh List'}
                  </button>
                </div>
                
                {loading ? (
                  <div className="loading-users">Loading classes...</div>
                ) : (
                  <div className="users-table-wrapper">
                    {classes.length > 0 ? (
                      <table className="users-table">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Class Name</th>
                            <th>School</th>
                            <th>Level</th>
                            <th>Trainer</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {classes.map(cls => (
                            <tr key={cls.id}>
                              <td>{cls.id}</td>
                              <td>{cls.className}</td>
                              <td>{cls.school || '-'}</td>
                              <td>{cls.level}</td>
                              <td>
                                {cls.assignedTrainer ? 
                                  users.find(u => u.id === cls.assignedTrainer)?.firstName + ' ' +
                                  users.find(u => u.id === cls.assignedTrainer)?.lastName : '-'}
                              </td>
                              <td>
                                <div className="table-actions">
                                  <button 
                                    className="delete-button"
                                    onClick={() => handleDeleteClass(cls.id)}
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
                        No classes found. Add your first class.
                      </div>
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