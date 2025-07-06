import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next'; // הוספת useTranslation
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
import './TrainerProfile.css';

const TrainerProfile = ({ currentUser }) => {
  const { t } = useTranslation(); // הוספת hook לתרגום
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
        <div className="loading-spinner">{t('trainerProfile.loadingProfile')}</div>
      </div>
    );
  }

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

  // Debug: הדפס את הנתונים כדי לראות מה יש
  console.log('Final user profile data:', userProfile);
  console.log('firstName:', userProfile.firstName);
  console.log('lastName:', userProfile.lastName);
  console.log('age:', userProfile.age);
  console.log('mobileNumber:', userProfile.mobileNumber);

  // Construct full name
  const fullName = `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim() || t('trainerProfile.notSpecified');
  
  // Get user initials for avatar
  const getInitials = (firstName, lastName) => {
    const first = firstName ? firstName.charAt(0).toUpperCase() : '';
    const last = lastName ? lastName.charAt(0).toUpperCase() : '';
    return first + last || 'TR';
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