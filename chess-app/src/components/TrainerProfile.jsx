// Import necessary React hooks and libraries
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next'; // Import translation hook for internationalization
import { User, Mail, Calendar, Hash, Shield, Phone, Edit, X, Lock } from 'lucide-react'; // Import icons from Lucide React
import { 
  collection, 
  query, 
  where, 
  getDocs,
  doc,
  getDoc,
  updateDoc
} from 'firebase/firestore'; // Import Firestore functions
import { getAuth, updateEmail, reauthenticateWithCredential, EmailAuthProvider, verifyBeforeUpdateEmail, updatePassword } from 'firebase/auth'; // Import Firebase Authentication functions
import { useNavigate } from 'react-router-dom'; // Import navigation hook
import { db } from '../firebase'; // Import Firebase database instance
import './TrainerProfile.css'; // Import component-specific styles

// Define the TrainerProfile component, receiving currentUser as a prop
const TrainerProfile = ({ currentUser }) => {
  const { t } = useTranslation(); // Initialize translation hook
  const [userProfile, setUserProfile] = useState(null); // State for user profile data
  const [loading, setLoading] = useState(true); // State for loading status
  const [showEmailModal, setShowEmailModal] = useState(false); // State for email change modal visibility
  const [showPasswordModal, setShowPasswordModal] = useState(false); // State for password change modal visibility
  const [newEmail, setNewEmail] = useState(''); // State for new email input
  const [confirmEmail, setConfirmEmail] = useState(''); // State for confirm email input
  const [currentPassword, setCurrentPassword] = useState(''); // State for current password input
  const [newPassword, setNewPassword] = useState(''); // State for new password input
  const [confirmPassword, setConfirmPassword] = useState(''); // State for confirm password input
  const [emailError, setEmailError] = useState(''); // State for email change error messages
  const [passwordError, setPasswordError] = useState(''); // State for password change error messages
  const [emailLoading, setEmailLoading] = useState(false); // State for email change loading status
  const [passwordLoading, setPasswordLoading] = useState(false); // State for password change loading status
  const navigate = useNavigate(); // Hook for programmatic navigation

  // Fetch user profile data on component mount or when currentUser changes
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        if (!currentUser || !currentUser.uid) {
          setLoading(false);
          return;
        }

        console.log('Current user from props:', currentUser);
        
        // Fetch user data from Firestore
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const fullUserData = userDoc.data();
          console.log('Full user data from database:', fullUserData);
          
          // Merge localStorage data with Firestore data
          const completeUserProfile = {
            ...currentUser,
            ...fullUserData,
            uid: currentUser.uid // Ensure UID is preserved
          };
          
          console.log('Complete user profile:', completeUserProfile);
          setUserProfile(completeUserProfile);
        } else {
          console.error('User document not found in database');
          // Fallback to localStorage data if no document exists
          setUserProfile(currentUser);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // Fallback to localStorage data on error
        setUserProfile(currentUser);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [currentUser]);

  // Display loading state
  if (loading) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner">{t('trainerProfile.loadingProfile')}</div>
      </div>
    );
  }

  // Display error if no user profile is available
  if (!userProfile) {
    return (
      <div className="profile-error">
        <div className="error-message">
          <h3>{t('trainerProfile.profileNotFound')}</h3>
          <p>{t('trainerProfile.unableToLoad')}</p>
        </div>
      </div>
    );
  }

  // Debug logging for profile data
  console.log('Final user profile data:', userProfile);
  console.log('firstName:', userProfile.firstName);
  console.log('lastName:', userProfile.lastName);
  console.log('age:', userProfile.age);
  console.log('mobileNumber:', userProfile.mobileNumber);

  // Construct full name from first and last name
  const fullName = `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim() || t('trainerProfile.notSpecified');
  
  // Get user initials for avatar
  const getInitials = (firstName, lastName) => {
    const first = firstName ? firstName.charAt(0).toUpperCase() : '';
    const last = lastName ? lastName.charAt(0).toUpperCase() : '';
    return first + last || 'TR'; // Default to 'TR' if no names available
  };

  const initials = getInitials(userProfile.firstName, userProfile.lastName);

  // Handle email change submission
  const handleEmailChange = async (e) => {
    e.preventDefault();
    setEmailError('');
    
    console.log('Starting email change process...');
    
    // Validate input fields
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

      // Check if the new email is already registered
      console.log('Checking if new email already exists...');
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", newEmail));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        setEmailError('This email is already registered in the system');
        return;
      }
      console.log('New email is available');

      // Re-authenticate user with current password
      console.log('Re-authenticating user...');
      const credential = EmailAuthProvider.credential(userProfile.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      console.log('Re-authentication successful');

      // Send verification email for new email
      console.log('Sending verification email for new email...');
      await verifyBeforeUpdateEmail(user, newEmail);
      console.log('Verification email sent successfully');

      // Close modal and clear fields
      setShowEmailModal(false);
      setNewEmail('');
      setConfirmEmail('');
      setCurrentPassword('');
      
      alert('A verification email has been sent to ' + newEmail + '. Please verify your new email address. Your email will be updated automatically after verification.');
      
    } catch (error) {
      console.error('Detailed error changing email:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      // Handle specific Firebase error cases
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

  // Close email change modal and reset fields
  const closeEmailModal = () => {
    setShowEmailModal(false);
    setNewEmail('');
    setConfirmEmail('');
    setCurrentPassword('');
    setEmailError('');
  };

  // Close password change modal and reset fields
  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
  };

  // Open password change modal
  const handleChangePassword = () => {
    setShowPasswordModal(true);
  };

  // Handle password change submission
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    
    console.log('Starting password change process...');
    
    // Validate input fields
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

      // Re-authenticate user with current password
      console.log('Re-authenticating user...');
      const credential = EmailAuthProvider.credential(userProfile.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      console.log('Re-authentication successful');

      // Update password in Firebase Authentication
      console.log('Updating password...');
      await updatePassword(user, newPassword);
      console.log('Password updated successfully');

      // Close modal and clear fields
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      alert('Password changed successfully!');
      
    } catch (error) {
      console.error('Detailed error changing password:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      // Handle specific Firebase error cases
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

  // Render the profile page
  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* Profile Header */}
        <div className="profile-header">
          <div className="profile-header-bg">
            <div className="header-pattern"></div>
          </div>
          <div className="profile-avatar-section">
            <div className="profile-avatar">
              <span className="avatar-initials">{initials}</span>
            </div>
            <div className="profile-title">
              <h1>{fullName}</h1>
              <span className="profile-role">
                <Shield size={16} />
                {userProfile.role?.charAt(0).toUpperCase() + userProfile.role?.slice(1) || t('trainerProfile.trainer')}
              </span>
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="profile-content">
          <div className="profile-info-card">
            <h2 className="card-title">{t('trainerProfile.profileInformation')}</h2>
            
            <div className="profile-fields">
              <div className="profile-field">
                <div className="field-icon">
                  <User size={20} />
                </div>
                <div className="field-content">
                  <label className="field-label">{t('trainerProfile.fullName')}</label>
                  <span className="field-value">{fullName}</span>
                </div>
              </div>

              <div className="profile-field">
                <div className="field-icon">
                  <Mail size={20} />
                </div>
                <div className="field-content">
                  <label className="field-label">{t('trainerProfile.emailAddress')}</label>
                  <span className="field-value">{userProfile.email || t('trainerProfile.notSpecified')}</span>
                </div>
                <button 
                  className="change-email-btn"
                  onClick={() => setShowEmailModal(true)}
                  title={t('trainerProfile.changeEmail')}
                >
                  <Edit size={16} />
                </button>
              </div>

              <div className="profile-field">
                <div className="field-icon">
                  <Phone size={20} />
                </div>
                <div className="field-content">
                  <label className="field-label">{t('trainerProfile.mobileNumber')}</label>
                  <span className="field-value">{userProfile.mobileNumber || t('trainerProfile.notSpecified')}</span>
                </div>
              </div>

              <div className="profile-field">
                <div className="field-icon">
                  <Calendar size={20} />
                </div>
                <div className="field-content">
                  <label className="field-label">{t('trainerProfile.age')}</label>
                  <span className="field-value">{userProfile.age || t('trainerProfile.notSpecified')}</span>
                </div>
              </div>

              <div className="profile-field">
                <div className="field-icon">
                  <Hash size={20} />
                </div>
                <div className="field-content">
                  <label className="field-label">{t('trainerProfile.userId')}</label>
                  <span className="field-value field-id">{userProfile.uid || userProfile.id || t('trainerProfile.notAvailableId')}</span>
                </div>
              </div>

              <div className="profile-field">
                <div className="field-icon">
                  <Shield size={20} />
                </div>
                <div className="field-content">
                  <label className="field-label">{t('trainerProfile.role')}</label>
                  <span className="field-value role-badge">
                    {userProfile.role?.charAt(0).toUpperCase() + userProfile.role?.slice(1) || t('trainerProfile.trainer')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Security Actions Card */}
          <div className="profile-stats-card">
            <h2 className="card-title">{t('trainerProfile.securitySettings')}</h2>
            <div className="security-actions">
              <button 
                className="change-password-btn"
                onClick={handleChangePassword}
                title={t('trainerProfile.changePassword')}
              >
                <div className="action-icon">
                  <Lock size={20} />
                </div>
                <div className="action-content">
                  <span className="action-label">{t('trainerProfile.changePassword')}</span>
                  <span className="action-desc">{t('trainerProfile.updatePassword')}</span>
                </div>
              </button>
            </div>
          </div>

          {/* Additional Info Card */}
          <div className="profile-stats-card">
            <h2 className="card-title">{t('trainerProfile.accountInformation')}</h2>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-icon">
                  <User size={24} />
                </div>
                <div className="stat-content">
                  <span className="stat-label">{t('trainerProfile.accountType')}</span>
                  <span className="stat-value">{t('trainerProfile.professionalTrainer')}</span>
                </div>
              </div>
              
              <div className="stat-item">
                <div className="stat-icon">
                  <Shield size={24} />
                </div>
                <div className="stat-content">
                  <span className="stat-label">{t('trainerProfile.accessLevel')}</span>
                  <span className="stat-value">{t('trainerProfile.trainerDashboard')}</span>
                </div>
              </div>

              <div className="stat-item">
                <div className="stat-icon">
                  <Calendar size={24} />
                </div>
                <div className="stat-content">
                  <span className="stat-label">{t('trainerProfile.memberSince')}</span>
                  <span className="stat-value">
                    {userProfile.createdAt ? 
                      new Date(userProfile.createdAt.seconds * 1000).toLocaleDateString('he-IL') : 
                      t('trainerProfile.unknown')
                    }
                  </span>
                </div>
              </div>

              <div className="stat-item">
                <div className="stat-icon">
                  <Phone size={24} />
                </div>
                <div className="stat-content">
                  <span className="stat-label">{t('trainerProfile.contactStatus')}</span>
                  <span className="stat-value">
                    {userProfile.mobileNumber ? t('trainerProfile.available') : t('trainerProfile.notAvailable')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Email Change Modal */}
        {showEmailModal && (
          <div className="modal-overlay">
            <div className="email-modal">
              <div className="modal-header">
                <h3>{t('trainerProfile.changeEmailAddress')}</h3>
                <button className="close-btn" onClick={closeEmailModal}>
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleEmailChange} className="modal-body">
                {emailError && <div className="error-message">{emailError}</div>}
                
                <div className="form-group">
                  <label htmlFor="currentPassword">{t('trainerProfile.currentPassword')}:</label>
                  <input
                    type="password"
                    id="currentPassword"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder={t('trainerProfile.currentPasswordPlaceholder')}
                    required
                    disabled={emailLoading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="newEmail">{t('trainerProfile.newEmail')}:</label>
                  <input
                    type="email"
                    id="newEmail"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder={t('trainerProfile.newEmailPlaceholder')}
                    required
                    disabled={emailLoading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirmEmail">{t('trainerProfile.confirmNewEmail')}:</label>
                  <input
                    type="email"
                    id="confirmEmail"
                    value={confirmEmail}
                    onChange={(e) => setConfirmEmail(e.target.value)}
                    placeholder={t('trainerProfile.confirmEmailPlaceholder')}
                    required
                    disabled={emailLoading}
                  />
                </div>

                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="cancel-btn" 
                    onClick={closeEmailModal}
                    disabled={emailLoading}
                  >
                    {t('trainerNotifications.cancel')}
                  </button>
                  <button 
                    type="submit" 
                    className="change-btn"
                    disabled={emailLoading}
                  >
                    {emailLoading ? t('trainerProfile.changing') : t('trainerProfile.changeEmail')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Password Change Modal */}
        {showPasswordModal && (
          <div className="modal-overlay">
            <div className="password-modal">
              <div className="modal-header">
                <h3>{t('trainerProfile.changePassword')}</h3>
                <button className="close-btn" onClick={closePasswordModal}>
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handlePasswordChange} className="modal-body">
                {passwordError && <div className="error-message">{passwordError}</div>}
                
                <div className="form-group">
                  <label htmlFor="currentPasswordChange">{t('trainerProfile.currentPassword')}:</label>
                  <input
                    type="password"
                    id="currentPasswordChange"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder={t('trainerProfile.currentPasswordPlaceholder')}
                    required
                    disabled={passwordLoading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="newPasswordChange">{t('trainerProfile.newPassword')}:</label>
                  <input
                    type="password"
                    id="newPasswordChange"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t('trainerProfile.newPasswordPlaceholder')}
                    required
                    disabled={passwordLoading}
                    minLength="6"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPasswordChange">{t('trainerProfile.confirmNewPassword')}:</label>
                  <input
                    type="password"
                    id="confirmPasswordChange"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('trainerProfile.confirmPasswordPlaceholder')}
                    required
                    disabled={passwordLoading}
                    minLength="6"
                  />
                </div>

                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="cancel-btn" 
                    onClick={closePasswordModal}
                    disabled={passwordLoading}
                  >
                    {t('trainerNotifications.cancel')}
                  </button>
                  <button 
                    type="submit" 
                    className="change-btn"
                    disabled={passwordLoading}
                  >
                    {passwordLoading ? t('trainerProfile.changing') : t('trainerProfile.changePassword')}
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

export default TrainerProfile;