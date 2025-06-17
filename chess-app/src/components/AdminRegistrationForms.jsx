import React, { useEffect, useState } from 'react';
import { 
  collection, 
  getDocs, 
  updateDoc, 
  doc, 
  orderBy, 
  query,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import './AdminRegistrationForms.css';

const AdminRegistrationForms = ({ loading, setLoading, error, success }) => {
  const [registrationForms, setRegistrationForms] = useState([]);
  const [filteredForms, setFilteredForms] = useState([]);
  const [selectedForm, setSelectedForm] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, pending, completed
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState(null);

  // Fetch registration forms from Firebase with smart sorting
  const fetchRegistrationForms = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'registrationForm'), orderBy('submittedAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const forms = [];
      
      querySnapshot.forEach((doc) => {
        forms.push({ id: doc.id, ...doc.data() });
      });
      
      // Sort with PENDING forms first, then by date (newest first within each status)
      const sortedForms = forms.sort((a, b) => {
        const aIsPending = isFormPending(a);
        const bIsPending = isFormPending(b);
        
        // If one is pending and other is not, pending comes first
        if (aIsPending && !bIsPending) return -1;
        if (!aIsPending && bIsPending) return 1;
        
        // If both have same status, sort by date (newest first)
        const dateA = a.submittedAt?.toDate() || new Date(0);
        const dateB = b.submittedAt?.toDate() || new Date(0);
        return dateB - dateA;
      });
      
      setRegistrationForms(sortedForms);
      console.log('Fetched registration forms:', sortedForms.length);
    } catch (err) {
      console.error('Error fetching registration forms:', err);
      error('Failed to load registration forms');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to check if form is pending
  const isFormPending = (form) => {
    const status = form.status?.toLowerCase() || 'pending';
    return status === 'pending' || !form.status;
  };

  // Helper function to get status display text
  const getStatusDisplay = (form) => {
    return isFormPending(form) ? 'Pending Review' : 'Completed';
  };

  // Helper function to get status class
  const getStatusClass = (form) => {
    return isFormPending(form) ? 'pending' : 'completed';
  };

  // Filter forms based on status and search query
  useEffect(() => {
    let filtered = registrationForms;

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(form => {
        const formStatus = form.status?.toLowerCase() || 'pending';
        return formStatus === filterStatus.toLowerCase();
      });
    }

    // Filter by search query (student name or parent contact)
    if (searchQuery.trim()) {
      filtered = filtered.filter(form => 
        form.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        form.parentContact?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        form.studentSchool?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredForms(filtered);
  }, [registrationForms, filterStatus, searchQuery]);

  // Load data on component mount
  useEffect(() => {
    fetchRegistrationForms();
  }, []);

  // Process registration form (mark as completed with admin note)
  const processForm = async (formId) => {
    if (!adminNote.trim()) {
      error('Please add a note before processing the form');
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

      // Update local state
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
      success('Registration form processed successfully');
    } catch (err) {
      console.error('Error processing form:', err);
      error('Failed to process registration form');
    } finally {
      setProcessingId(null);
    }
  };

  // Format date for display
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    
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

  // Get pending forms count (for local display only - count is now managed by AdminArea)
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
                <div className="stat-label">Total Forms</div>
              </div>
              <div className="stat-card pending">
                <div className="stat-number">{pendingFormsCount}</div>
                <div className="stat-label">Pending Review</div>
              </div>
              <div className="stat-card completed">
                <div className="stat-number">{registrationForms.length - pendingFormsCount}</div>
                <div className="stat-label">Completed</div>
              </div>
            </div>

            <button 
              onClick={fetchRegistrationForms}
              className="refresh-forms-btn"
              disabled={loading}
            >
              {loading ? 'Refreshing...' : '↻ Refresh'}
            </button>
          </div>

          {/* Filters and Search */}
          <div className="forms-controls">
            <div className="filter-tabs">
              <button 
                className={`filter-tab ${filterStatus === 'all' ? 'active' : ''}`}
                onClick={() => setFilterStatus('all')}
              >
                All Forms ({registrationForms.length})
              </button>
              <button 
                className={`filter-tab ${filterStatus === 'pending' ? 'active' : ''}`}
                onClick={() => setFilterStatus('pending')}
              >
                Pending ({pendingFormsCount})
              </button>
              <button 
                className={`filter-tab ${filterStatus === 'completed' ? 'active' : ''}`}
                onClick={() => setFilterStatus('completed')}
              >
                Completed ({registrationForms.length - pendingFormsCount})
              </button>
            </div>

            <div className="search-container">
              <div className="search-bar">
                <input
                  type="text"
                  placeholder="Search by student name, parent contact, or school..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                {searchQuery && (
                  <button 
                    className="search-clear"
                    onClick={clearSearch}
                    title="Clear search"
                  >
                    ×
                  </button>
                )}
                <div className="search-icon">🔍</div>
              </div>
              {searchQuery && (
                <div className="search-results-info">
                  {filteredForms.length === 0 
                    ? "No forms found matching your search" 
                    : `Found ${filteredForms.length} form${filteredForms.length === 1 ? '' : 's'}`
                  }
                </div>
              )}
            </div>
          </div>

          {/* Forms List */}
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading registration forms...</p>
            </div>
          ) : filteredForms.length === 0 ? (
            <div className="empty-state">
              {searchQuery ? (
                <>
                  <h3>No forms found</h3>
                  <p>No registration forms match your search criteria.</p>
                  <button onClick={clearSearch} className="clear-search-btn">
                    Clear search
                  </button>
                </>
              ) : (
                <>
                  <h3>No registration forms</h3>
                  <p>No registration forms have been submitted yet.</p>
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
                    <h3 className="student-name">{form.studentName || 'Unknown Student'}</h3>
                    <span className={`status-badge ${getStatusClass(form)}`}>
                      {getStatusDisplay(form)}
                    </span>
                  </div>
                  
                  <div className="form-card-details">
                    <div className="detail-row">
                      <span className="detail-label">School:</span>
                      <span className="detail-value">{form.studentSchool || 'Not provided'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Parent Contact:</span>
                      <span className="detail-value">{form.parentContact || 'Not provided'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Submitted:</span>
                      <span className="detail-value">{formatDate(form.submittedAt)}</span>
                    </div>
                  </div>

                  <div className="form-card-footer">
                    <button className="view-details-btn">
                      View Details & Process →
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
              ← Back to Forms List
            </button>
            <h2>Registration Form Details</h2>
          </div>

          <div className="form-details-content">
            <div className="form-details-card">
              <div className="form-details-header-info">
                <h3>{selectedForm.studentName || 'Unknown Student'}</h3>
                <span className={`status-badge ${getStatusClass(selectedForm)}`}>
                  {getStatusDisplay(selectedForm)}
                </span>
              </div>

              <div className="form-details-grid">
                <div className="detail-section">
                  <h4>Student Information</h4>
                  <div className="detail-item">
                    <span className="label">Full Name:</span>
                    <span className="value">{selectedForm.studentName || 'Not provided'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">School:</span>
                    <span className="value">{selectedForm.studentSchool || 'Not provided'}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Contact Information</h4>
                  <div className="detail-item">
                    <span className="label">Parent Contact:</span>
                    <span className="value">{selectedForm.parentContact || 'Not provided'}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Submission Details</h4>
                  <div className="detail-item">
                    <span className="label">Submitted Date:</span>
                    <span className="value">{formatDate(selectedForm.submittedAt)}</span>
                  </div>
                  {selectedForm.processedAt && (
                    <>
                      <div className="detail-item">
                        <span className="label">Processed Date:</span>
                        <span className="value">{formatDate(selectedForm.processedAt)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Processed By:</span>
                        <span className="value">{selectedForm.processedBy || 'Unknown'}</span>
                      </div>
                    </>
                  )}
                </div>

                {selectedForm.adminNote && (
                  <div className="detail-section">
                    <h4>Admin Notes</h4>
                    <div className="admin-note-display">
                      {selectedForm.adminNote}
                    </div>
                  </div>
                )}
              </div>

              {isFormPending(selectedForm) && (
                <div className="process-form-section">
                  <h4>Process Registration Form</h4>
                  <div className="admin-note-input">
                    <label htmlFor="adminNote">Admin Notes (Required):</label>
                    <textarea
                      id="adminNote"
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="Add your notes about how this registration was processed..."
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
                      {processingId === selectedForm.id ? 'Processing...' : 'Mark as Completed'}
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