import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next'; // הוספת useTranslation
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  getDocs,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from '../firebase';
import './TrainerNotifications.css';

const NotificationsMessages = ({ currentUser }) => {
  const { t } = useTranslation(); // הוספת hook לתרגום
  const [conversations, setConversations] = useState([]);
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showNewMessageForm, setShowNewMessageForm] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [filteredAdmins, setFilteredAdmins] = useState([]);
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [selectedAdmins, setSelectedAdmins] = useState([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  
  // File handling states
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedNewMessageFile, setSelectedNewMessageFile] = useState(null);
  const [fileUploading, setFileUploading] = useState(false);
  
  const messagesEndRef = React.useRef(null);

  // Auto scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Filter conversations based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredConversations(conversations);
    } else {
      const filtered = conversations.filter(conversation => {
        const adminDisplayName = getAdminDisplayName(conversation.admin).toLowerCase();
        return adminDisplayName.includes(searchQuery.toLowerCase());
      });
      setFilteredConversations(filtered);
    }
  }, [conversations, searchQuery]);

  // Filter admins for new message modal based on search query
  useEffect(() => {
    if (!adminSearchQuery.trim()) {
      setFilteredAdmins(admins);
    } else {
      const filtered = admins.filter(admin => {
        const adminDisplayName = getAdminDisplayName(admin).toLowerCase();
        return adminDisplayName.includes(adminSearchQuery.toLowerCase());
      });
      setFilteredAdmins(filtered);
    }
  }, [admins, adminSearchQuery]);

  // Get admin display name
  const getAdminDisplayName = (admin) => {
    return `${admin.firstName || ''} ${admin.lastName || ''}`.trim() || admin.email;
  };

  // Upload file to Firebase Storage
  const uploadMessageFile = async (file, messageId) => {
    if (!file) return null;
    
    try {
      setFileUploading(true);
      const timestamp = Date.now();
      const fileName = `${messageId}_${timestamp}_${file.name}`;
      const storageRef = ref(storage, `message-files/${fileName}`);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    } finally {
      setFileUploading(false);
    }
  };

  // Get file name from URL
  const getFileNameFromUrl = (url) => {
    try {
      const urlParts = url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const decodedFileName = decodeURIComponent(fileName);
      // Remove the timestamp and messageId prefix
      const parts = decodedFileName.split('_');
      if (parts.length >= 3) {
        return parts.slice(2).join('_').split('?')[0];
      }
      return decodedFileName.split('?')[0];
    } catch (error) {
      console.error('Error parsing file name:', error);
      return 'Download File';
    }
  };

  // Clear search functions
  const clearSearch = () => {
    setSearchQuery('');
  };

  const clearAdminSearch = () => {
    setAdminSearchQuery('');
  };

  // Fetch all admins
  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'admin'));
        const querySnapshot = await getDocs(q);
        const adminsList = [];
        querySnapshot.forEach((doc) => {
          adminsList.push({ id: doc.id, ...doc.data() });
        });
        // Sort admins by name
        adminsList.sort((a, b) => {
          const nameA = getAdminDisplayName(a);
          const nameB = getAdminDisplayName(b);
          return nameA.localeCompare(nameB);
        });
        setAdmins(adminsList);
      } catch (error) {
        console.error('Error fetching admins:', error);
      }
    };
    fetchAdmins();
  }, []);

  // Fetch conversations (grouped by admin)
  useEffect(() => {
    if (!currentUser?.id) {
      console.log('No current user ID found');
      setLoading(false);
      return;
    }

    console.log('Setting up notifications listener for user ID:', currentUser.id);

    // Query for messages where trainer is RECEIVER
    const qReceived = query(
      collection(db, 'notifications'),
      where('receiverId', '==', currentUser.id)
    );

    // Query for messages where trainer is SENDER
    const qSent = query(
      collection(db, 'notifications'),
      where('senderId', '==', currentUser.id)
    );

    let receivedMessages = [];
    let sentMessages = [];
    let listenersReady = 0;

    const updateConversations = async () => {
      const messagesByAdmin = {};

      // Process received messages
      for (const messageData of receivedMessages) {
        const adminId = messageData.senderId;
        
        let adminData = null;
        if (adminId) {
          try {
            const adminDoc = await getDoc(doc(db, 'users', adminId));
            if (adminDoc.exists()) {
              const userData = { id: adminDoc.id, ...adminDoc.data() };
              if (userData.role === 'admin') {
                adminData = userData;
              }
            }
          } catch (error) {
            console.error('Error fetching admin:', error);
          }
        }

        if (adminData) {
          const adminKey = adminData.id;
          if (!messagesByAdmin[adminKey]) {
            messagesByAdmin[adminKey] = {
              admin: adminData,
              messages: [],
              unreadCount: 0,
              lastMessage: null
            };
          }
          
          messagesByAdmin[adminKey].messages.push(messageData);
          
          // Count unread messages only for received messages
          if (!messageData.read) {
            messagesByAdmin[adminKey].unreadCount++;
          }
          
          if (!messagesByAdmin[adminKey].lastMessage || 
              messageData.sentAt?.toDate() > messagesByAdmin[adminKey].lastMessage.sentAt?.toDate()) {
            messagesByAdmin[adminKey].lastMessage = messageData;
          }
        }
      }

      // Process sent messages
      for (const messageData of sentMessages) {
        const adminId = messageData.receiverId;
        
        let adminData = null;
        if (adminId) {
          try {
            const adminDoc = await getDoc(doc(db, 'users', adminId));
            if (adminDoc.exists()) {
              const userData = { id: adminDoc.id, ...adminDoc.data() };
              if (userData.role === 'admin') {
                adminData = userData;
              }
            }
          } catch (error) {
            console.error('Error fetching admin:', error);
          }
        }

        if (adminData) {
          const adminKey = adminData.id;
          if (!messagesByAdmin[adminKey]) {
            messagesByAdmin[adminKey] = {
              admin: adminData,
              messages: [],
              unreadCount: 0,
              lastMessage: null
            };
          }
          
          messagesByAdmin[adminKey].messages.push(messageData);
          
          // Don't count sent messages as unread
          
          if (!messagesByAdmin[adminKey].lastMessage || 
              messageData.sentAt?.toDate() > messagesByAdmin[adminKey].lastMessage.sentAt?.toDate()) {
            messagesByAdmin[adminKey].lastMessage = messageData;
          }
        }
      }

      // Sort messages within each conversation
      Object.values(messagesByAdmin).forEach(conversation => {
        conversation.messages.sort((a, b) => {
          const timeA = a.sentAt?.toDate() || new Date(0);
          const timeB = b.sentAt?.toDate() || new Date(0);
          return timeB - timeA;
        });
      });

      const conversationsList = Object.values(messagesByAdmin).sort((a, b) => {
        const dateA = a.lastMessage?.sentAt?.toDate() || new Date(0);
        const dateB = b.lastMessage?.sentAt?.toDate() || new Date(0);
        return dateB - dateA;
      });

      console.log('Final conversations with sent and received:', conversationsList.length);
      setConversations(conversationsList);
      setLoading(false);
    };

    // Listen to received messages
    const unsubscribe1 = onSnapshot(qReceived, (querySnapshot) => {
      receivedMessages = [];
      querySnapshot.forEach((docSnapshot) => {
        const messageData = { id: docSnapshot.id, ...docSnapshot.data() };
        receivedMessages.push(messageData);
      });
      
      console.log(`Found ${receivedMessages.length} received messages`);
      listenersReady++;
      
      if (listenersReady >= 2) {
        updateConversations();
      }
    }, (error) => {
      console.error('Error in received messages listener:', error);
      setLoading(false);
    });

    // Listen to sent messages
    const unsubscribe2 = onSnapshot(qSent, (querySnapshot) => {
      sentMessages = [];
      querySnapshot.forEach((docSnapshot) => {
        const messageData = { id: docSnapshot.id, ...docSnapshot.data() };
        sentMessages.push(messageData);
      });
      
      console.log(`Found ${sentMessages.length} sent messages`);
      listenersReady++;
      
      if (listenersReady >= 2) {
        updateConversations();
      }
    }, (error) => {
      console.error('Error in sent messages listener:', error);
      setLoading(false);
    });

    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  }, [currentUser]);

  // Fetch messages for selected conversation
  useEffect(() => {
    if (!selectedConversation || !currentUser?.id) return;

    const adminId = selectedConversation.admin.id;
    const trainerId = currentUser.id;

    console.log('Setting up real-time chat listener between:', trainerId, 'and', adminId);

    // Query messages where either:
    // 1. Sender is admin and receiver is trainer
    // 2. Sender is trainer and receiver is admin
    const q1 = query(
      collection(db, 'notifications'),
      where('senderId', '==', adminId),
      where('receiverId', '==', trainerId)
    );

    const q2 = query(
      collection(db, 'notifications'),
      where('senderId', '==', trainerId),
      where('receiverId', '==', adminId)
    );

    let messagesList1 = [];
    let messagesList2 = [];
    let listenersReady = 0;

    const updateMessages = () => {
      // Combine and sort all messages
      const allMessages = [...messagesList1, ...messagesList2].sort((a, b) => {
        const timeA = a.sentAt?.toDate() || new Date(0);
        const timeB = b.sentAt?.toDate() || new Date(0);
        return timeA - timeB;
      });
      
      console.log('Chat messages updated:', allMessages.length);
      setMessages(allMessages);
    };

    // Listen to messages from admin to trainer
    const unsubscribe1 = onSnapshot(q1, (querySnapshot) => {
      messagesList1 = [];
      querySnapshot.forEach((doc) => {
        messagesList1.push({ id: doc.id, ...doc.data() });
      });
      
      listenersReady++;
      if (listenersReady >= 1) { // Update as soon as we have at least one listener ready
        updateMessages();
      }
    }, (error) => {
      console.error('Error in admin->trainer messages listener:', error);
    });

    // Listen to messages from trainer to admin
    const unsubscribe2 = onSnapshot(q2, (querySnapshot) => {
      messagesList2 = [];
      querySnapshot.forEach((doc) => {
        messagesList2.push({ id: doc.id, ...doc.data() });
      });
      
      listenersReady++;
      if (listenersReady >= 1) { // Update as soon as we have at least one listener ready
        updateMessages();
      }
    }, (error) => {
      console.error('Error in trainer->admin messages listener:', error);
    });

    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  }, [selectedConversation, currentUser]);

  const markAsRead = async (messageId) => {
    try {
      await updateDoc(doc(db, 'notifications', messageId), {
        read: true
      });
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const sendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || !selectedConversation) return;

    try {
      let fileUrl = null;
      
      // Generate message ID for file naming
      const tempMessageId = doc(collection(db, "notifications")).id;
      
      // Upload file if selected
      if (selectedFile) {
        fileUrl = await uploadMessageFile(selectedFile, tempMessageId);
        if (!fileUrl) {
          console.error('Failed to upload file');
          return;
        }
      }

      const messageData = {
        senderId: currentUser.id,
        receiverId: selectedConversation.admin.id,
        sentAt: serverTimestamp(),
        read: false
      };

      // Add message text if provided
      if (newMessage.trim()) {
        messageData.message = newMessage;
      }

      // Add file URL if uploaded
      if (fileUrl) {
        messageData.fileUrl = fileUrl;
        messageData.fileName = selectedFile.name;
      }

      await addDoc(collection(db, 'notifications'), messageData);
      
      setNewMessage('');
      setSelectedFile(null);
      
      // Reset file input
      const fileInput = document.querySelector('.chat-file-input');
      if (fileInput) fileInput.value = '';
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const sendNewMessage = async () => {
    if ((!newMessageText.trim() && !selectedNewMessageFile) || selectedAdmins.length === 0) return;

    try {
      let fileUrl = null;
      
      // Generate message ID for file naming
      const tempMessageId = doc(collection(db, "notifications")).id;
      
      // Upload file if selected
      if (selectedNewMessageFile) {
        fileUrl = await uploadMessageFile(selectedNewMessageFile, tempMessageId);
        if (!fileUrl) {
          console.error('Failed to upload file');
          return;
        }
      }

      const promises = selectedAdmins.map(adminId => {
        const messageData = {
          senderId: currentUser.id,
          receiverId: adminId,
          sentAt: serverTimestamp(),
          read: false
        };

        // Add message text if provided
        if (newMessageText.trim()) {
          messageData.message = newMessageText;
        }

        // Add file URL if uploaded
        if (fileUrl) {
          messageData.fileUrl = fileUrl;
          messageData.fileName = selectedNewMessageFile.name;
        }

        return addDoc(collection(db, 'notifications'), messageData);
      });

      await Promise.all(promises);
      setNewMessageText('');
      setSelectedAdmins([]);
      setSelectedNewMessageFile(null);
      setShowNewMessageForm(false);
      
      // Reset file input
      const fileInput = document.querySelector('.new-message-file-input');
      if (fileInput) fileInput.value = '';
    } catch (error) {
      console.error('Error sending new message:', error);
    }
  };

  const openConversation = (conversation) => {
    setSelectedConversation(conversation);
    // Mark unread messages as read (only messages received by trainer)
    conversation.messages.forEach(message => {
      if (!message.read && message.receiverId === currentUser.id) {
        markAsRead(message.id);
      }
    });
  };

  if (loading) {
    return <div className="loading">{t('trainerNotifications.loadingNotifications')}</div>;
  }

  return (
    <div className="notifications-container">
      {!selectedConversation ? (
        <div className="notifications-list">
          <div className="notifications-header">
            <h2>{t('trainerNotifications.messagesNotifications')}</h2>
            <button 
              className="new-message-btn"
              onClick={() => setShowNewMessageForm(true)}
            >
              + {t('trainerNotifications.newMessage')}
            </button>
          </div>

          {/* Search Bar */}
          <div className="search-container">
            <div className="search-bar">
              <input
                type="text"
                placeholder={t('trainerNotifications.searchConversations')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              {searchQuery && (
                <button 
                  className="search-clear"
                  onClick={clearSearch}
                  title={t('trainerNotifications.clearSearch')}
                >
                  ×
                </button>
              )}
              <div className="search-icon">🔍</div>
            </div>
            {searchQuery && (
              <div className="search-results-info">
                {filteredConversations.length === 0 
                  ? t('trainerNotifications.noConversationsFound')
                  : `${t('trainerNotifications.foundAdmins')} ${filteredConversations.length} conversation${filteredConversations.length === 1 ? '' : 's'}`
                }
              </div>
            )}
          </div>

          {conversations.length === 0 ? (
            <div className="no-conversations">
              <p>{t('trainerNotifications.noMessages')}</p>
            </div>
          ) : filteredConversations.length === 0 && searchQuery ? (
            <div className="no-conversations">
              <p>{t('trainerNotifications.noConversationsMatching')} "{searchQuery}"</p>
              <button onClick={clearSearch} className="clear-search-btn">
                {t('trainerNotifications.clearSearch')}
              </button>
            </div>
          ) : (
            <div className="conversations-list">
              {filteredConversations.map((conversation) => (
                <div 
                  key={conversation.admin.id}
                  className={`conversation-item ${conversation.unreadCount > 0 ? 'unread' : ''}`}
                  onClick={() => openConversation(conversation)}
                >
                  <div className="conversation-header">
                    <div className="admin-info">
                      <h3>{getAdminDisplayName(conversation.admin)}</h3>
                      <span className="admin-role">{t('trainerNotifications.admin')}</span>
                    </div>
                    {conversation.unreadCount > 0 && (
                      <div className="unread-badge">{conversation.unreadCount}</div>
                    )}
                  </div>
                  <div className="last-message">
                    <p>
                      {conversation.lastMessage?.fileUrl && !conversation.lastMessage?.message 
                        ? `📎 ${t('trainerNotifications.fileAttachment')}`
                        : conversation.lastMessage?.fileUrl && conversation.lastMessage?.message
                        ? `${conversation.lastMessage.message} 📎`
                        : conversation.lastMessage?.message}
                    </p>
                    <span className="message-time">
                      {conversation.lastMessage?.sentAt?.toDate().toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* New Message Form Modal */}
          {showNewMessageForm && (
            <div className="modal-overlay">
              <div className="new-message-modal">
                <div className="modal-header">
                  <h3>{t('trainerNotifications.newMessage')}</h3>
                  <button 
                    className="close-btn"
                    onClick={() => {
                      setShowNewMessageForm(false);
                      setSelectedNewMessageFile(null);
                      setAdminSearchQuery('');
                      const fileInput = document.querySelector('.new-message-file-input');
                      if (fileInput) fileInput.value = '';
                    }}
                  >
                    ×
                  </button>
                </div>
                <div className="modal-body">
                  <div className="admin-selection">
                    <label>{t('trainerNotifications.selectAdmins')}</label>
                    
                    {/* Admin Search Bar */}
                    <div className="admin-search-container">
                      <div className="admin-search-bar">
                        <input
                          type="text"
                          placeholder={t('trainerNotifications.searchAdmins')}
                          value={adminSearchQuery}
                          onChange={(e) => setAdminSearchQuery(e.target.value)}
                          className="admin-search-input"
                        />
                        {adminSearchQuery && (
                          <button 
                            className="admin-search-clear"
                            onClick={clearAdminSearch}
                            title={t('trainerNotifications.clearAdminSearch')}
                          >
                            ×
                          </button>
                        )}
                        <div className="admin-search-icon">🔍</div>
                      </div>
                      {adminSearchQuery && (
                        <div className="admin-search-results-info">
                          {filteredAdmins.length === 0 
                            ? t('trainerNotifications.noAdminsFound')
                            : `${t('trainerNotifications.foundAdmins')} ${filteredAdmins.length} ${t('trainerNotifications.admins')}`
                          }
                        </div>
                      )}
                    </div>
                    
                  <div className="admin-checkboxes">
                      {/* הוספת Select All checkbox */}
                      <label className="checkbox-label select-all-label">
                        <input
                          type="checkbox"
                          checked={filteredAdmins.length > 0 && selectedAdmins.length === filteredAdmins.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              // Select all filtered admins
                              setSelectedAdmins(filteredAdmins.map(admin => admin.id));
                            } else {
                              // Deselect all
                              setSelectedAdmins([]);
                            }
                          }}
                          disabled={filteredAdmins.length === 0}
                        />
                        <span className="admin-details select-all-text">
                          <strong>{t('trainerNotifications.selectAll')} ({filteredAdmins.length})</strong>
                        </span>
                      </label>
                      
                      {filteredAdmins.length === 0 && adminSearchQuery ? (
                        <div className="no-admins-found">
                          <p>{t('trainerNotifications.noAdminsFound')} "{adminSearchQuery}"</p>
                          <button onClick={clearAdminSearch} className="clear-admin-search-btn">
                            {t('trainerNotifications.clearAdminSearch')}
                          </button>
                        </div>
                      ) : (
                        filteredAdmins.map((admin) => (
                          <label key={admin.id} className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={selectedAdmins.includes(admin.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedAdmins([...selectedAdmins, admin.id]);
                                } else {
                                  setSelectedAdmins(selectedAdmins.filter(id => id !== admin.id));
                                }
                              }}
                            />
                            <span className="admin-details">
                              <span className="admin-name">{getAdminDisplayName(admin)}</span>
                              <span className="admin-role-small">
                                ({t('trainerNotifications.administrator')})
                              </span>
                            </span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="message-input">
                    <label>{t('trainerNotifications.message')}:</label>
                    <textarea
                      value={newMessageText}
                      onChange={(e) => setNewMessageText(e.target.value)}
                      placeholder={t('trainerNotifications.messagePlaceholder')}
                      rows="4"
                    />
                  </div>
                  <div className="file-input">
                    <label>{t('trainerNotifications.attachFile')}</label>
                    <input
                      type="file"
                      onChange={(e) => setSelectedNewMessageFile(e.target.files[0])}
                      className="new-message-file-input"
                    />
                    {selectedNewMessageFile && (
                      <div className="selected-file-preview">
                        <span>📄 {selectedNewMessageFile.name}</span>
                        <button 
                          onClick={() => setSelectedNewMessageFile(null)} 
                          className="remove-file-button"
                          type="button"
                        >×</button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    className="cancel-btn"
                    onClick={() => {
                      setShowNewMessageForm(false);
                      setSelectedNewMessageFile(null);
                      setAdminSearchQuery('');
                      const fileInput = document.querySelector('.new-message-file-input');
                      if (fileInput) fileInput.value = '';
                    }}
                  >
                    {t('trainerNotifications.cancel')}
                  </button>
                  <button 
                    className="send-btn"
                    onClick={sendNewMessage}
                    disabled={(!newMessageText.trim() && !selectedNewMessageFile) || selectedAdmins.length === 0 || fileUploading}
                  >
                    {fileUploading ? t('trainerNotifications.uploading') : t('trainerNotifications.sendMessage')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="chat-view">
          <div className="chat-header">
            <button 
              className="back-btn"
              onClick={() => setSelectedConversation(null)}
            >
              ← {t('trainerNotifications.back')}
            </button>
            <div className="chat-admin-info">
              <h3>{getAdminDisplayName(selectedConversation.admin)}</h3>
              <span>{t('trainerNotifications.admin')}</span>
            </div>
          </div>

          <div className="messages-container">
            {messages.map((message) => {
              // Determine if message was sent by current user
              const isSentByCurrentUser = message.senderId === currentUser.id;
              
              return (
                <div 
                  key={message.id}
                  className={`message ${isSentByCurrentUser ? 'sent' : 'received'} ${!message.read && !isSentByCurrentUser ? 'unread-message' : ''}`}
                >
                  <div className="message-content">
                    {message.message && <p>{message.message}</p>}
                    {message.fileUrl && (
                      <div className="message-file">
                        <a 
                          href={message.fileUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="file-link"
                        >
                          📎 {message.fileName || getFileNameFromUrl(message.fileUrl)}
                        </a>
                      </div>
                    )}
                    <span className="message-timestamp">
                      {message.sentAt?.toDate().toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <div className="message-input-container">
            <div className="message-input-with-file">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={t('trainerNotifications.typeMessage')}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                className="message-text-input"
              />
              <input
                type="file"
                onChange={(e) => setSelectedFile(e.target.files[0])}
                className="chat-file-input"
                style={{ display: 'none' }}
                id="chatFileInput"
              />
              <label htmlFor="chatFileInput" className="file-select-button" title={t('trainerNotifications.attachFileBtn')}>
                📎
              </label>
            </div>
            {selectedFile && (
              <div className="selected-file-preview">
                <span>📄 {selectedFile.name}</span>
                <button onClick={() => setSelectedFile(null)} className="remove-file-button">×</button>
              </div>
            )}
            <button 
              onClick={sendMessage} 
              disabled={(!newMessage.trim() && !selectedFile) || fileUploading}
              className="send-message-button"
            >
              {fileUploading ? t('trainerNotifications.uploading') : t('trainerNotifications.send')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsMessages;