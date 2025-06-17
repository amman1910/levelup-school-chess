import React, { useEffect, useState } from 'react';
import { User, Mail, Calendar, Hash, Shield, Phone, Edit, X, Lock } from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  doc,
  getDoc,
  updateDoc
} from 'firebase/firestore';
import { getAuth, updateEmail, reauthenticateWithCredential, EmailAuthProvider, verifyBeforeUpdateEmail, updatePassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import './AdminProfile.css';

const AdminProfile = ({ currentUser }) => {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        if (!currentUser || !currentUser.uid) {
          setLoading(false);
          return;
        }

        console.log('Current user from props:', currentUser);
        
        // שלוף את הנתונים המלאים מהדטה בייס
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const fullUserData = userDoc.data();
          console.log('Full user data from database:', fullUserData);
          
          // שלב את הנתונים מה-localStorage עם הנתונים מהדטה בייס
          const completeUserProfile = {
            ...currentUser,
            ...fullUserData,
            uid: currentUser.uid // וודא שה-uid נשמר
          };
          
          console.log('Complete user profile:', completeUserProfile);
          setUserProfile(completeUserProfile);
        } else if (error.code === 'auth/operation-not-allowed') {
        setEmailError('Email verification is required. Please check your Firebase settings or contact support.');
      } else {
          console.error('User document not found in database');
          // אם אין מסמך, השתמש בנתונים מה-localStorage
          setUserProfile(currentUser);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // במקרה של שגיאה, השתמש בנתונים מה-localStorage
        setUserProfile(currentUser);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner">Loading profile...</div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="profile-error">
        <div className="error-message">
          <h3>Profile Not Found</h3>
          <p>Unable to load your profile information. Please try logging in again.</p>
        </div>
      </div>
    );
  }

  // Debug: הדפס את הנתונים כדי לראות מה יש
  console.log('Final user profile data:', userProfile);
  console.log('firstName:', userProfile.firstName);
  console.log('lastName:', userProfile.lastName);
  console.log('age:', userProfile.age);
  console.log('mobileNumber:', userProfile.mobileNumber);

  // Construct full name
  const fullName = `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim() || 'Not specified';
  
  // Get user initials for avatar
  const getInitials = (firstName, lastName) => {
    const first = firstName ? firstName.charAt(0).toUpperCase() : '';
    const last = lastName ? lastName.charAt(0).toUpperCase() : '';
    return first + last || 'AD';
  };

  const initials = getInitials(userProfile.firstName, userProfile.lastName);

  // פונקציה לשינוי האימייל
  const handleEmailChange = async (e) => {
    e.preventDefault();
    setEmailError('');
    
    console.log('Starting email change process...');
    
    if (!newEmail || !confirmEmail || !currentPassword) {
      setEmailError('Please fill in all fields');
      return;
    }
    
    if (newEmail !== confirmEmail) {
      setEmailError('New emails do not match');
      return;
    }
    
    if (newEmail === userProfile.email) {
      setEmailError('New email must be different from current email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    try {
      setEmailLoading(true);
      const auth = getAuth();
      const user = auth.currentUser;

      console.log('Current auth user:', user);
      console.log('Current email:', user?.email);
      console.log('New email:', newEmail);

      if (!user) {
        setEmailError('User not authenticated');
        return;
      }

      // בדוק אם האימייל החדש כבר קיים במערכת
      console.log('Checking if new email already exists...');
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", newEmail));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        setEmailError('This email is already registered in the system');
        return;
      }
      console.log('New email is available');

      // אימות מחדש של המשתמש עם הסיסמה הנוכחית
      console.log('Re-authenticating user...');
      const credential = EmailAuthProvider.credential(userProfile.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      console.log('Re-authentication successful');

      // עדכון האימייל ב-Firebase Authentication עם אימות
      console.log('Sending verification email for new email...');
      await verifyBeforeUpdateEmail(user, newEmail);
      console.log('Verification email sent successfully');

      // הודעה למשתמש על צורך באימות
      setShowEmailModal(false);
      setNewEmail('');
      setConfirmEmail('');
      setCurrentPassword('');
      
      alert('A verification email has been sent to ' + newEmail + '. Please verify your new email address. Your email will be updated automatically after verification.');
      
      // לא נעדכן את הדטה בייס כאן - זה יקרה אוטומטית אחרי האימות
      
    } catch (error) {
      console.error('Detailed error changing email:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      if (error.code === 'auth/wrong-password') {
        setEmailError('Current password is incorrect');
      } else if (error.code === 'auth/email-already-in-use') {
        setEmailError('This email is already in use');
      } else if (error.code === 'auth/invalid-email') {
        setEmailError('Invalid email format');
      } else if (error.code === 'auth/requires-recent-login') {
        setEmailError('Please log out and log back in before changing your email');
      } else if (error.code === 'auth/user-not-found') {
        setEmailError('User not found. Please log in again.');
      } else if (error.code === 'auth/invalid-credential') {
        setEmailError('Invalid credentials. Please check your password.');
      } else if (error.code === 'auth/too-many-requests') {
        setEmailError('Too many failed attempts. Please try again later.');
      } else {
        setEmailError(`Failed to change email: ${error.message}`);
      }
    } finally {
      setEmailLoading(false);
    }
  };

  const closeEmailModal = () => {
    setShowEmailModal(false);
    setNewEmail('');
    setConfirmEmail('');
    setCurrentPassword('');
    setEmailError('');
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
  };

  const handleChangePassword = () => {
    setShowPasswordModal(true);
  };

  // פונקציה לשינוי הסיסמה
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    
    console.log('Starting password change process...');
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Please fill in all fields');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }

    if (newPassword === currentPassword) {
      setPasswordError('New password must be different from current password');
      return;
    }

    try {
      setPasswordLoading(true);
      const auth = getAuth();
      const user = auth.currentUser;

      console.log('Current auth user:', user);

      if (!user) {
        setPasswordError('User not authenticated');
        return;
      }

      // אימות מחדש של המשתמש עם הסיסמה הנוכחית
      console.log('Re-authenticating user...');
      const credential = EmailAuthProvider.credential(userProfile.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      console.log('Re-authentication successful');

      // עדכון הסיסמה ב-Firebase Authentication
      console.log('Updating password...');
      await updatePassword(user, newPassword);
      console.log('Password updated successfully');

      // סגירת המודל וניקוי השדות
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      alert('Password changed successfully!');
      
    } catch (error) {
      console.error('Detailed error changing password:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      if (error.code === 'auth/wrong-password') {
        setPasswordError('Current password is incorrect');
      } else if (error.code === 'auth/weak-password') {
        setPasswordError('New password is too weak. Please choose a stronger password.');
      } else if (error.code === 'auth/user-not-found') {
        setPasswordError('User not found. Please log in again.');
      } else if (error.code === 'auth/invalid-credential') {
        setPasswordError('Invalid credentials. Please check your current password.');
      } else if (error.code === 'auth/too-many-requests') {
        setPasswordError('Too many failed attempts. Please try again later.');
      } else if (error.code === 'auth/requires-recent-login') {
        setPasswordError('Please log out and log back in before changing your password');
      } else {
        setPasswordError(`Failed to change password: ${error.message}`);
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="admin-profile-page">
      <div className="admin-profile-container">
        {/* Profile Header */}
        <div className="admin-profile-header">
          <div className="admin-profile-header-bg">
            <div className="admin-header-pattern"></div>
          </div>
          <div className="admin-profile-avatar-section">
            <div className="admin-profile-avatar">
              <span className="admin-avatar-initials">{initials}</span>
            </div>
            <div className="admin-profile-title">
              <h1>{fullName}</h1>
              <span className="admin-profile-role">
                <Shield size={16} />
                {userProfile.role?.charAt(0).toUpperCase() + userProfile.role?.slice(1) || 'Administrator'}
              </span>
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="admin-profile-content">
          <div className="admin-profile-info-card">
            <h2 className="admin-card-title">Profile Information</h2>
            
            <div className="admin-profile-fields">
              <div className="admin-profile-field">
                <div className="admin-field-icon">
                  <User size={20} />
                </div>
                <div className="admin-field-content">
                  <label className="admin-field-label">Full Name</label>
                  <span className="admin-field-value">{fullName}</span>
                </div>
              </div>

              <div className="admin-profile-field">
                <div className="admin-field-icon">
                  <Mail size={20} />
                </div>
                <div className="admin-field-content">
                  <label className="admin-field-label">Email Address</label>
                  <span className="admin-field-value">{userProfile.email || 'Not specified'}</span>
                </div>
                <button 
                  className="admin-change-email-btn"
                  onClick={() => setShowEmailModal(true)}
                  title="Change Email"
                >
                  <Edit size={16} />
                </button>
              </div>

              <div className="admin-profile-field">
                <div className="admin-field-icon">
                  <Phone size={20} />
                </div>
                <div className="admin-field-content">
                  <label className="admin-field-label">Mobile Number</label>
                  <span className="admin-field-value">{userProfile.mobileNumber || 'Not specified'}</span>
                </div>
              </div>

              <div className="admin-profile-field">
                <div className="admin-field-icon">
                  <Calendar size={20} />
                </div>
                <div className="admin-field-content">
                  <label className="admin-field-label">Age</label>
                  <span className="admin-field-value">{userProfile.age || 'Not specified'}</span>
                </div>
              </div>

              <div className="admin-profile-field">
                <div className="admin-field-icon">
                  <Hash size={20} />
                </div>
                <div className="admin-field-content">
                  <label className="admin-field-label">User ID</label>
                  <span className="admin-field-value admin-field-id">{userProfile.uid || userProfile.id || 'Not available'}</span>
                </div>
              </div>

              <div className="admin-profile-field">
                <div className="admin-field-icon">
                  <Shield size={20} />
                </div>
                <div className="admin-field-content">
                  <label className="admin-field-label">Role</label>
                  <span className="admin-field-value admin-role-badge">
                    {userProfile.role?.charAt(0).toUpperCase() + userProfile.role?.slice(1) || 'Administrator'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Security Actions Card */}
          <div className="admin-profile-stats-card">
            <h2 className="admin-card-title">Security Settings</h2>
            <div className="admin-security-actions">
              <button 
                className="admin-change-password-btn"
                onClick={handleChangePassword}
                title="Change Password"
              >
                <div className="admin-action-icon">
                  <Lock size={20} />
                </div>
                <div className="admin-action-content">
                  <span className="admin-action-label">Change Password</span>
                  <span className="admin-action-desc">Update your account password</span>
                </div>
              </button>
            </div>
          </div>

          {/* Additional Info Card */}
          <div className="admin-profile-stats-card">
            <h2 className="admin-card-title">Account Information</h2>
            <div className="admin-stats-grid">
              <div className="admin-stat-item">
                <div className="admin-stat-icon">
                  <User size={24} />
                </div>
                <div className="admin-stat-content">
                  <span className="admin-stat-label">Account Type</span>
                  <span className="admin-stat-value">Administrative Account</span>
                </div>
              </div>
              
              <div className="admin-stat-item">
                <div className="admin-stat-icon">
                  <Shield size={24} />
                </div>
                <div className="admin-stat-content">
                  <span className="admin-stat-label">Access Level</span>
                  <span className="admin-stat-value">Full Administrative Access</span>
                </div>
              </div>

              <div className="admin-stat-item">
                <div className="admin-stat-icon">
                  <Calendar size={24} />
                </div>
                <div className="admin-stat-content">
                  <span className="admin-stat-label">Member Since</span>
                  <span className="admin-stat-value">
                    {userProfile.createdAt ? 
                      new Date(userProfile.createdAt.seconds * 1000).toLocaleDateString('he-IL') : 
                      'Unknown'
                    }
                  </span>
                </div>
              </div>

              <div className="admin-stat-item">
                <div className="admin-stat-icon">
                  <Phone size={24} />
                </div>
                <div className="admin-stat-content">
                  <span className="admin-stat-label">Contact Status</span>
                  <span className="admin-stat-value">
                    {userProfile.mobileNumber ? 'Available' : 'Not Available'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Email Change Modal */}
        {showEmailModal && (
          <div className="admin-modal-overlay">
            <div className="admin-email-modal">
              <div className="admin-modal-header">
                <h3>Change Email Address</h3>
                <button className="admin-close-btn" onClick={closeEmailModal}>
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleEmailChange} className="admin-modal-body">
                {emailError && <div className="admin-error-message">{emailError}</div>}
                
                <div className="admin-form-group">
                  <label htmlFor="currentPassword">Current Password:</label>
                  <input
                    type="password"
                    id="currentPassword"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                    required
                    disabled={emailLoading}
                  />
                </div>

                <div className="admin-form-group">
                  <label htmlFor="newEmail">New Email:</label>
                  <input
                    type="email"
                    id="newEmail"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Enter new email address"
                    required
                    disabled={emailLoading}
                  />
                </div>

                <div className="admin-form-group">
                  <label htmlFor="confirmEmail">Confirm New Email:</label>
                  <input
                    type="email"
                    id="confirmEmail"
                    value={confirmEmail}
                    onChange={(e) => setConfirmEmail(e.target.value)}
                    placeholder="Confirm new email address"
                    required
                    disabled={emailLoading}
                  />
                </div>

                <div className="admin-modal-footer">
                  <button 
                    type="button" 
                    className="admin-cancel-btn" 
                    onClick={closeEmailModal}
                    disabled={emailLoading}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="admin-change-btn"
                    disabled={emailLoading}
                  >
                    {emailLoading ? 'Changing...' : 'Change Email'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Password Change Modal */}
        {showPasswordModal && (
          <div className="admin-modal-overlay">
            <div className="admin-password-modal">
              <div className="admin-modal-header">
                <h3>Change Password</h3>
                <button className="admin-close-btn" onClick={closePasswordModal}>
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handlePasswordChange} className="admin-modal-body">
                {passwordError && <div className="admin-error-message">{passwordError}</div>}
                
                <div className="admin-form-group">
                  <label htmlFor="currentPasswordChange">Current Password:</label>
                  <input
                    type="password"
                    id="currentPasswordChange"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                    required
                    disabled={passwordLoading}
                  />
                </div>

                <div className="admin-form-group">
                  <label htmlFor="newPasswordChange">New Password:</label>
                  <input
                    type="password"
                    id="newPasswordChange"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 characters)"
                    required
                    disabled={passwordLoading}
                    minLength="6"
                  />
                </div>

                <div className="admin-form-group">
                  <label htmlFor="confirmPasswordChange">Confirm New Password:</label>
                  <input
                    type="password"
                    id="confirmPasswordChange"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                    disabled={passwordLoading}
                    minLength="6"
                  />
                </div>

                <div className="admin-modal-footer">
                  <button 
                    type="button" 
                    className="admin-cancel-btn" 
                    onClick={closePasswordModal}
                    disabled={passwordLoading}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="admin-change-btn"
                    disabled={passwordLoading}
                  >
                    {passwordLoading ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProfile;