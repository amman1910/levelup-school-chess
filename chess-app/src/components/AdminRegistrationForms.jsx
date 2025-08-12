import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next'; 
import { 
  collection, 
  getDocs, 
  updateDoc, 
  doc, 
  orderBy, 
  query,
  serverTimestamp,
  addDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import './AdminRegistrationForms.css';

const AdminRegistrationForms = ({ loading, setLoading, error, success }) => {
  const { t } = useTranslation(); 
  const [registrationForms, setRegistrationForms] = useState([]);
  const [filteredForms, setFilteredForms] = useState([]);
  const [selectedForm, setSelectedForm] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); 
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState(null);

 
  const logAdminAction = async (actionType, description, targetType, targetId = null) => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const adminName = `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.email || 'Unknown Admin';

      const logEntry = {
        actionType,
        adminName,
        description,
        targetType,
        timestamp: new Date(),
        targetId: targetId || null,
        adminId: currentUser.uid || currentUser.id || null
      };

      await addDoc(collection(db, 'adminLogs'), logEntry);
      console.log('Admin action logged:', logEntry);
    } catch (err) {
      console.error('Error logging admin action:', err);
    }
  };

  const fetchRegistrationForms = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'registrationForm'), orderBy('submittedAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const forms = [];
      
      querySnapshot.forEach((doc) => {
        forms.push({ id: doc.id, ...doc.data() });
      });
      
      const sortedForms = forms.sort((a, b) => {
        const aIsPending = isFormPending(a);
        const bIsPending = isFormPending(b);
        
        if (aIsPending && !bIsPending) return -1;
        if (!aIsPending && bIsPending) return 1;
        
        const dateA = a.submittedAt?.toDate() || new Date(0);
        const dateB = b.submittedAt?.toDate() || new Date(0);
        return dateB - dateA;
      });
      
      setRegistrationForms(sortedForms);
      console.log('Fetched registration forms:', sortedForms.length);
    } catch (err) {
      console.error('Error fetching registration forms:', err);
      error(t('adminRegistration.failedToLoadForms'));
    } finally {
      setLoading(false);
    }
  };

  const isFormPending = (form) => {
    const status = form.status?.toLowerCase() || 'pending';
    return status === 'pending' || !form.status;
  };

  const getStatusDisplay = (form) => {
    return isFormPending(form) ? t('adminRegistration.pendingReview') : t('adminRegistration.completed');
  };

  const getStatusClass = (form) => {
    return isFormPending(form) ? 'pending' : 'completed';
  };

  useEffect(() => {
    let filtered = registrationForms;

    if (filterStatus !== 'all') {
      filtered = filtered.filter(form => {
        const formStatus = form.status?.toLowerCase() || 'pending';
        return formStatus === filterStatus.toLowerCase();
      });
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter(form => 
        form.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        form.parentContact?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        form.studentSchool?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredForms(filtered);
  }, [registrationForms, filterStatus, searchQuery]);

  useEffect(() => {
    fetchRegistrationForms();
  }, []);

  const processForm = async (formId) => {
    if (!adminNote.trim()) {
      error(t('adminRegistration.pleaseAddNote'));
      return;
    }

    setProcessingId(formId);
    try {
      await updateDoc(doc(db, 'registrationForm', formId), {
        status: 'COMPLETED',
        adminNote: adminNote,
        processedAt: serverTimestamp(),
        processedBy: JSON.parse(localStorage.getItem('user'))?.email || 'Unknown Admin'
      });

      const formToProcess = registrationForms.find(form => form.id === formId);
      if (formToProcess) {
        await logAdminAction(
          'process-registration',
          `Processed registration form for student "${formToProcess.studentName}"`,
          'registration',
          formId
        );
      }

      setRegistrationForms(prev => 
        prev.map(form => 
          form.id === formId 
            ? { 
                ...form, 
                status: 'COMPLETED', 
                adminNote: adminNote,
                processedAt: new Date(),
                processedBy: JSON.parse(localStorage.getItem('user'))?.email || 'Unknown Admin'
              }
            : form
        )
      );

      setSelectedForm(null);
      setAdminNote('');
      success(t('adminRegistration.formProcessedSuccessfully'));
    } catch (err) {
      console.error('Error processing form:', err);
      error(t('adminRegistration.failedToProcessForm'));
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return t('adminRegistration.unknownDate');
    
    let date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
    }
    
    return date.toLocaleDateString('he-IL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const pendingFormsCount = registrationForms.filter(form => isFormPending(form)).length;

  const clearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className="admin-registration-forms-container">
      {!selectedForm ? (
        <div className="registration-forms-list">
          {/* Header with stats */}
          <div className="forms-header">
            <div className="forms-stats">
              <div className="stat-card total">
                <div className="stat-number">{registrationForms.length}</div>
                <div className="stat-label">{t('adminRegistration.totalForms')}</div>
              </div>
              <div className="stat-card pending">
                <div className="stat-number">{pendingFormsCount}</div>
                <div className="stat-label">{t('adminRegistration.pendingReview')}</div>
              </div>
              <div className="stat-card completed">
                <div className="stat-number">{registrationForms.length - pendingFormsCount}</div>
                <div className="stat-label">{t('adminRegistration.completed')}</div>
              </div>
            </div>

            <button 
              onClick={fetchRegistrationForms}
              className="refresh-forms-btn"
              disabled={loading}
            >
              {loading ? t('adminRegistration.refreshing') + '...' : '↻ ' + t('adminRegistration.refresh')}
            </button>
          </div>

          <div className="forms-controls">
            <div className="filter-tabs">
              <button 
                className={`filter-tab ${filterStatus === 'all' ? 'active' : ''}`}
                onClick={() => setFilterStatus('all')}
              >
                {t('adminRegistration.allForms')} ({registrationForms.length})
              </button>
              <button 
                className={`filter-tab ${filterStatus === 'pending' ? 'active' : ''}`}
                onClick={() => setFilterStatus('pending')}
              >
                {t('adminRegistration.pending')} ({pendingFormsCount})
              </button>
              <button 
                className={`filter-tab ${filterStatus === 'completed' ? 'active' : ''}`}
                onClick={() => setFilterStatus('completed')}
              >
                {t('adminRegistration.completed')} ({registrationForms.length - pendingFormsCount})
              </button>
            </div>

            <div className="search-container">
              <div className="search-bar">
                <input
                  type="text"
                  placeholder={t('adminRegistration.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                {searchQuery && (
                  <button 
                    className="search-clear"
                    onClick={clearSearch}
                    title={t('adminRegistration.clearSearch')}
                  >
                    ×
                  </button>
                )}
                <div className="search-icon">🔍</div>
              </div>
              {searchQuery && (
                <div className="search-results-info">
                  {filteredForms.length === 0 
                    ? t('adminRegistration.noFormsFound')
                    : t('adminRegistration.foundForms', { count: filteredForms.length })
                  }
                </div>
              )}
            </div>
          </div>

          {/* Forms List */}
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>{t('adminRegistration.loadingForms')}</p>
            </div>
          ) : filteredForms.length === 0 ? (
            <div className="empty-state">
              {searchQuery ? (
                <>
                  <h3>{t('adminRegistration.noFormsFound')}</h3>
                  <p>{t('adminRegistration.noFormsMatchSearch')}</p>
                  <button onClick={clearSearch} className="clear-search-btn">
                    {t('adminRegistration.clearSearch')}
                  </button>
                </>
              ) : (
                <>
                  <h3>{t('adminRegistration.noRegistrationForms')}</h3>
                  <p>{t('adminRegistration.noFormsSubmitted')}</p>
                </>
              )}
            </div>
          ) : (
            <div className="forms-grid">
              {filteredForms.map((form) => (
                <div 
                  key={form.id}
                  className={`form-card ${getStatusClass(form)} ${isFormPending(form) ? 'urgent-pending' : ''}`}
                  onClick={() => setSelectedForm(form)}
                >
                  {isFormPending(form) && (
                    <div className="pending-indicator">
                      <span className="pending-dot"></span>
                    </div>
                  )}
                  <div className="form-card-header">
                    <h3 className="student-name">{form.studentName || t('adminRegistration.unknownStudent')}</h3>
                    <span className={`status-badge ${getStatusClass(form)}`}>
                      {getStatusDisplay(form)}
                    </span>
                  </div>
                  
                  <div className="form-card-details">
                    <div className="detail-row">
                      <span className="detail-label">{t('adminRegistration.school')}:</span>
                      <span className="detail-value">{form.studentSchool || t('adminRegistration.notProvided')}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">{t('adminRegistration.parentContact')}:</span>
                      <span className="detail-value">{form.parentContact || t('adminRegistration.notProvided')}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">{t('adminRegistration.submitted')}:</span>
                      <span className="detail-value">{formatDate(form.submittedAt)}</span>
                    </div>
                  </div>

                  <div className="form-card-footer">
                    <button className="view-details-btn">
                      {t('adminRegistration.viewDetailsAndProcess')} →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Form Details View */
        <div className="form-details-view">
          <div className="form-details-header">
            <button 
              className="back-btn"
              onClick={() => {
                setSelectedForm(null);
                setAdminNote('');
              }}
            >
              ← {t('adminRegistration.backToFormsList')}
            </button>
            <h2>{t('adminRegistration.registrationFormDetails')}</h2>
          </div>

          <div className="form-details-content">
            <div className="form-details-card">
              <div className="form-details-header-info">
                <h3>{selectedForm.studentName || t('adminRegistration.unknownStudent')}</h3>
                <span className={`status-badge ${getStatusClass(selectedForm)}`}>
                  {getStatusDisplay(selectedForm)}
                </span>
              </div>

              <div className="form-details-grid">
                <div className="detail-section">
                  <h4>{t('adminRegistration.studentInformation')}</h4>
                  <div className="detail-item">
                    <span className="label">{t('adminRegistration.fullName')}:</span>
                    <span className="value">{selectedForm.studentName || t('adminRegistration.notProvided')}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">{t('adminRegistration.school')}:</span>
                    <span className="value">{selectedForm.studentSchool || t('adminRegistration.notProvided')}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>{t('adminRegistration.contactInformation')}</h4>
                  <div className="detail-item">
                    <span className="label">{t('adminRegistration.parentContact')}:</span>
                    <span className="value">{selectedForm.parentContact || t('adminRegistration.notProvided')}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>{t('adminRegistration.submissionDetails')}</h4>
                  <div className="detail-item">
                    <span className="label">{t('adminRegistration.submittedDate')}:</span>
                    <span className="value">{formatDate(selectedForm.submittedAt)}</span>
                  </div>
                  {selectedForm.processedAt && (
                    <>
                      <div className="detail-item">
                        <span className="label">{t('adminRegistration.processedDate')}:</span>
                        <span className="value">{formatDate(selectedForm.processedAt)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">{t('adminRegistration.processedBy')}:</span>
                        <span className="value">{selectedForm.processedBy || t('adminRegistration.unknown')}</span>
                      </div>
                    </>
                  )}
                </div>

                {selectedForm.adminNote && (
                  <div className="detail-section">
                    <h4>{t('adminRegistration.adminNotes')}</h4>
                    <div className="admin-note-display">
                      {selectedForm.adminNote}
                    </div>
                  </div>
                )}
              </div>

              {isFormPending(selectedForm) && (
                <div className="process-form-section">
                  <h4>{t('adminRegistration.processRegistrationForm')}</h4>
                  <div className="admin-note-input">
                    <label htmlFor="adminNote">{t('adminRegistration.adminNotesRequired')}:</label>
                    <textarea
                      id="adminNote"
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder={t('adminRegistration.adminNotesPlaceholder')}
                      rows="4"
                      className="note-textarea"
                    />
                  </div>
                  
                  <div className="process-actions">
                    <button 
                      onClick={() => processForm(selectedForm.id)}
                      disabled={!adminNote.trim() || processingId === selectedForm.id}
                      className="process-btn"
                    >
                      {processingId === selectedForm.id ? t('adminRegistration.processing') + '...' : t('adminRegistration.markAsCompleted')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRegistrationForms;