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
import './AdminNotifications.css';

const AdminNotifications = ({ loading, setLoading, error, success }) => {
  const { t } = useTranslation(); // הוספת hook לתרגום
  const [currentUser, setCurrentUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showNewMessageForm, setShowNewMessageForm] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  
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
        const userDisplayName = getUserDisplayName(conversation.user).toLowerCase();
        return userDisplayName.includes(searchQuery.toLowerCase());
      });
      setFilteredConversations(filtered);
    }
  }, [conversations, searchQuery]);

  // Filter users for new message modal based on search query
  useEffect(() => {
    if (!userSearchQuery.trim()) {
      setFilteredUsers(allUsers);
    } else {
      const filtered = allUsers.filter(user => {
        const userDisplayName = getUserDisplayName(user).toLowerCase();
        return userDisplayName.includes(userSearchQuery.toLowerCase());
      });
      setFilteredUsers(filtered);
    }
  }, [allUsers, userSearchQuery]);

  // Get current user from localStorage
  useEffect(() => {
    const loggedInUser = localStorage.getItem('user');
    if (loggedInUser) {
      const userData = JSON.parse(loggedInUser);
      // Extract the document ID from uid for notifications
      if (userData.uid && !userData.id) {
        userData.id = userData.uid;
      }
      setCurrentUser(userData);
    }
  }, []);

  // Fetch all users (both admins and trainers)
  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const usersList = [];
        querySnapshot.forEach((doc) => {
          const userData = { id: doc.id, ...doc.data() };
          // Don't include current user in the list
          if (currentUser && userData.id !== currentUser.id) {
            usersList.push(userData);
          }
        });
        // Sort by role (admins first, then trainers) and then by name
        usersList.sort((a, b) => {
          if (a.role !== b.role) {
            return a.role === 'admin' ? -1 : 1;
          }
          const nameA = `${a.firstName || ''} ${a.lastName || ''}`.trim();
          const nameB = `${b.firstName || ''} ${b.lastName || ''}`.trim();
          return nameA.localeCompare(nameB);
        });
        setAllUsers(usersList);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    
    if (currentUser) {
      fetchAllUsers();
    }
  }, [currentUser]);

  // Fetch conversations (grouped by user)
  useEffect(() => {
    if (!currentUser?.id) {
      console.log('No current user ID found');
      // אל תכבה את הloading אם אין currentUser - תן לו זמן להטען
      return;
    }

    console.log('Setting up notifications listener for admin ID:', currentUser.id);

    // Query for messages where admin is RECEIVER
    const qReceived = query(
      collection(db, 'notifications'),
      where('receiverId', '==', currentUser.id)
    );

    // Query for messages where admin is SENDER
    const qSent = query(
      collection(db, 'notifications'),
      where('senderId', '==', currentUser.id)
    );

    let receivedMessages = [];
    let sentMessages = [];
    let listenersReady = 0;

    const updateConversations = async () => {
      const messagesByUser = {};

      // Process received messages
      for (const messageData of receivedMessages) {
        const userId = messageData.senderId;
        
        let userData = null;
        if (userId) {
          try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
              userData = { id: userDoc.id, ...userDoc.data() };
            }
          } catch (error) {
            console.error('Error fetching user:', error);
          }
        }

        if (userData) {
          const userKey = userData.id;
          if (!messagesByUser[userKey]) {
            messagesByUser[userKey] = {
              user: userData,
              messages: [],
              unreadCount: 0,
              lastMessage: null
            };
          }
          
          messagesByUser[userKey].messages.push(messageData);
          
          // Count unread messages only for received messages
          if (!messageData.read) {
            messagesByUser[userKey].unreadCount++;
          }
          
          if (!messagesByUser[userKey].lastMessage || 
              messageData.sentAt?.toDate() > messagesByUser[userKey].lastMessage.sentAt?.toDate()) {
            messagesByUser[userKey].lastMessage = messageData;
          }
        }
      }

      // Process sent messages
      for (const messageData of sentMessages) {
        const userId = messageData.receiverId;
        
        let userData = null;
        if (userId) {
          try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
              userData = { id: userDoc.id, ...userDoc.data() };
            }
          } catch (error) {
            console.error('Error fetching user:', error);
          }
        }

        if (userData) {
          const userKey = userData.id;
          if (!messagesByUser[userKey]) {
            messagesByUser[userKey] = {
              user: userData,
              messages: [],
              unreadCount: 0,
              lastMessage: null
            };
          }
          
          messagesByUser[userKey].messages.push(messageData);
          
          // Don't count sent messages as unread
          
          if (!messagesByUser[userKey].lastMessage || 
              messageData.sentAt?.toDate() > messagesByUser[userKey].lastMessage.sentAt?.toDate()) {
            messagesByUser[userKey].lastMessage = messageData;
          }
        }
      }

      // Sort messages within each conversation
      Object.values(messagesByUser).forEach(conversation => {
        conversation.messages.sort((a, b) => {
          const timeA = a.sentAt?.toDate() || new Date(0);
          const timeB = b.sentAt?.toDate() || new Date(0);
          return timeB - timeA;
        });
      });

      const conversationsList = Object.values(messagesByUser).sort((a, b) => {
        const dateA = a.lastMessage?.sentAt?.toDate() || new Date(0);
        const dateB = b.lastMessage?.sentAt?.toDate() || new Date(0);
        return dateB - dateA;
      });

      console.log('Final conversations with sent and received:', conversationsList.length);
      setConversations(conversationsList);
      setNotificationsLoading(false);
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
      
      if (listenersReady >= 1) { // שנה מ-2 ל-1 כדי שיכבה את הloading מהר יותר
        updateConversations();
      }
    }, (error) => {
      console.error('Error in received messages listener:', error);
      setNotificationsLoading(false);
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
      
      if (listenersReady >= 1) { // שנה מ-2 ל-1 כדי שיכבה את הloading מהר יותר
        updateConversations();
      }
    }, (error) => {
      console.error('Error in sent messages listener:', error);
      setNotificationsLoading(false);
    });

    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  }, [currentUser]);

  // Fetch messages for selected conversation
  useEffect(() => {
    if (!selectedConversation || !currentUser?.id) return;

    const userId = selectedConversation.user.id;
    const adminId = currentUser.id;

    console.log('Setting up real-time chat listener between:', adminId, 'and', userId);

    // Query messages where either:
    // 1. Sender is user and receiver is admin
    // 2. Sender is admin and receiver is user
    const q1 = query(
      collection(db, 'notifications'),
      where('senderId', '==', userId),
      where('receiverId', '==', adminId)
    );

    const q2 = query(
      collection(db, 'notifications'),
      where('senderId', '==', adminId),
      where('receiverId', '==', userId)
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

    // Listen to messages from user to admin
    const unsubscribe1 = onSnapshot(q1, (querySnapshot) => {
      messagesList1 = [];
      querySnapshot.forEach((doc) => {
        messagesList1.push({ id: doc.id, ...doc.data() });
      });
      
      listenersReady++;
      if (listenersReady >= 1) {
        updateMessages();
      }
    }, (error) => {
      console.error('Error in user->admin messages listener:', error);
    });

    // Listen to messages from admin to user
    const unsubscribe2 = onSnapshot(q2, (querySnapshot) => {
      messagesList2 = [];
      querySnapshot.forEach((doc) => {
        messagesList2.push({ id: doc.id, ...doc.data() });
      });
      
      listenersReady++;
      if (listenersReady >= 1) {
        updateMessages();
      }
    }, (error) => {
      console.error('Error in admin->user messages listener:', error);
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
        receiverId: selectedConversation.user.id,
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
    if ((!newMessageText.trim() && !selectedNewMessageFile) || selectedUsers.length === 0) return;

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

      const promises = selectedUsers.map(userId => {
        const messageData = {
          senderId: currentUser.id,
          receiverId: userId,
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
      setSelectedUsers([]);
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
    // Mark unread messages as read (only messages received by admin)
    conversation.messages.forEach(message => {
      if (!message.read && message.receiverId === currentUser.id) {
        markAsRead(message.id);
      }
    });
  };

  const getUserDisplayName = (user) => {
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
  };

  const getUserRoleDisplay = (role) => {
    return role === 'admin' ? t('admin.administrator') : t('trainer.trainer');
  };

  const getUserRoleColor = (role) => {
    return role === 'admin' ? '#5e3c8f' : '#d4b43c';
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

  const clearSearch = () => {
    setSearchQuery('');
  };

  const clearUserSearch = () => {
    setUserSearchQuery('');
  };

  // הוספת בדיקת loading בתחילת הקומפוננטה - זה התיקון העיקרי!
  if (notificationsLoading) {
    return <div className="loading">{t('trainerNotifications.loadingNotifications')}</div>;
  }

  return (
    <div className="admin-notifications-container">
      {!selectedConversation ? (
        <div className="admin-notifications-list">
          <div className="admin-notifications-header">
            <h2>{t('trainerNotifications.messagesNotifications')}</h2>
            <button 
              className="admin-new-message-btn"
              onClick={() => setShowNewMessageForm(true)}
            >
              + {t('trainerNotifications.newMessage')}
            </button>
          </div>

          {/* Search Bar */}
          <div className="admin-search-container">
            <div className="admin-search-bar">
              <input
                type="text"
                placeholder={t('adminNotifications.searchConversationsByUser')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="admin-search-input"
              />
              {searchQuery && (
                <button 
                  className="admin-search-clear"
                  onClick={clearSearch}
                  title={t('trainerNotifications.clearSearch')}
                >
                  ×
                </button>
              )}
              <div className="admin-search-icon">🔍</div>
            </div>
            {searchQuery && (
              <div className="admin-search-results-info">
                {filteredConversations.length === 0 
                  ? t('trainerNotifications.noConversationsFound')
                  : `${t('trainerNotifications.foundAdmins')} ${filteredConversations.length} conversation${filteredConversations.length === 1 ? '' : 's'}`
                }
              </div>
            )}
          </div>

          {conversations.length === 0 ? (
            <div className="admin-no-conversations">
              <p>{t('adminNotifications.noMessagesWithUsers')}</p>
            </div>
          ) : filteredConversations.length === 0 && searchQuery ? (
            <div className="admin-no-conversations">
              <p>{t('trainerNotifications.noConversationsMatching')} "{searchQuery}"</p>
              <button onClick={clearSearch} className="admin-clear-search-btn">
                {t('trainerNotifications.clearSearch')}
              </button>
            </div>
          ) : (
            <div className="admin-conversations-list">
              {filteredConversations.map((conversation) => (
                <div 
                  key={conversation.user.id}
                  className={`admin-conversation-item ${conversation.unreadCount > 0 ? 'unread' : ''}`}
                  onClick={() => openConversation(conversation)}
                >
                  <div className="admin-conversation-header">
                    <div className="admin-user-info">
                      <h3>{getUserDisplayName(conversation.user)}</h3>
                      <span className="admin-user-role" style={{ color: getUserRoleColor(conversation.user.role) }}>
                        {getUserRoleDisplay(conversation.user.role)}
                      </span>
                    </div>
                    {conversation.unreadCount > 0 && (
                      <div className="admin-unread-badge">{conversation.unreadCount}</div>
                    )}
                  </div>
                  <div className="admin-last-message">
                    <p>
                      {conversation.lastMessage?.fileUrl && !conversation.lastMessage?.message 
                        ? `📎 ${t('trainerNotifications.fileAttachment')}`
                        : conversation.lastMessage?.fileUrl && conversation.lastMessage?.message
                        ? `${conversation.lastMessage.message} 📎`
                        : conversation.lastMessage?.message}
                    </p>
                    <span className="admin-message-time">
                      {conversation.lastMessage?.sentAt?.toDate().toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* New Message Form Modal */}
          {showNewMessageForm && (
            <div className="admin-modal-overlay">
              <div className="admin-new-message-modal">
                <div className="admin-modal-header">
                  <h3>{t('trainerNotifications.newMessage')}</h3>
                  <button 
                    className="admin-close-btn"
                    onClick={() => {
                      setShowNewMessageForm(false);
                      setSelectedNewMessageFile(null);
                      setUserSearchQuery('');
                      const fileInput = document.querySelector('.new-message-file-input');
                      if (fileInput) fileInput.value = '';
                    }}
                  >
                    ×
                  </button>
                </div>
                <div className="admin-modal-body">
                  <div className="admin-user-selection">
                    <label>{t('adminNotifications.selectUsers')}:</label>
                    
                    {/* User Search Bar */}
                    <div className="admin-user-search-container">
                      <div className="admin-user-search-bar">
                        <input
                          type="text"
                          placeholder={t('adminNotifications.searchUsersByName')}
                          value={userSearchQuery}
                          onChange={(e) => setUserSearchQuery(e.target.value)}
                          className="admin-user-search-input"
                        />
                        {userSearchQuery && (
                          <button 
                            className="admin-user-search-clear"
                            onClick={clearUserSearch}
                            title={t('trainerNotifications.clearAdminSearch')}
                          >
                            ×
                          </button>
                        )}
                        <div className="admin-user-search-icon">🔍</div>
                      </div>
                      {userSearchQuery && (
                        <div className="admin-user-search-results-info">
                          {filteredUsers.length === 0 
                            ? t('adminNotifications.noUsersFound')
                            : `${t('trainerNotifications.foundAdmins')} ${filteredUsers.length} user${filteredUsers.length === 1 ? '' : 's'}`
                          }
                        </div>
                      )}
                    </div>
                    
                   <div className="admin-user-checkboxes">
                      {/* הוספת Select All checkbox */}
                      <label className="admin-checkbox-label select-all-label">
                        <input
                          type="checkbox"
                          checked={filteredUsers.length > 0 && selectedUsers.length === filteredUsers.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              // Select all filtered users
                              setSelectedUsers(filteredUsers.map(user => user.id));
                            } else {
                              // Deselect all
                              setSelectedUsers([]);
                            }
                          }}
                          disabled={filteredUsers.length === 0}
                        />
                        <span className="admin-user-details select-all-text">
                          <strong>{t('trainerNotifications.selectAll')} ({filteredUsers.length})</strong>
                        </span>
                      </label>

                      {filteredUsers.length === 0 && userSearchQuery ? (
                        <div className="admin-no-users-found">
                          <p>{t('adminNotifications.noUsersFound')} "{userSearchQuery}"</p>
                          <button onClick={clearUserSearch} className="admin-clear-user-search-btn">
                            {t('trainerNotifications.clearAdminSearch')}
                          </button>
                        </div>
                      ) : (
                        filteredUsers.map((user) => (
                          <label key={user.id} className="admin-checkbox-label">
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(user.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedUsers([...selectedUsers, user.id]);
                                } else {
                                  setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                                }
                              }}
                            />
                            <span className="admin-user-details">
                              <span className="admin-user-name">{getUserDisplayName(user)}</span>
                              <span className="admin-user-role-small" style={{ color: getUserRoleColor(user.role) }}>
                                ({getUserRoleDisplay(user.role)})
                              </span>
                            </span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="admin-message-input">
                    <label>{t('trainerNotifications.message')}:</label>
                    <textarea
                      value={newMessageText}
                      onChange={(e) => setNewMessageText(e.target.value)}
                      placeholder={t('trainerNotifications.messagePlaceholder')}
                      rows="4"
                    />
                  </div>
                  <div className="admin-file-input">
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
                <div className="admin-modal-footer">
                  <button 
                    className="admin-cancel-btn"
                    onClick={() => {
                      setShowNewMessageForm(false);
                      setSelectedNewMessageFile(null);
                      setUserSearchQuery('');
                      const fileInput = document.querySelector('.new-message-file-input');
                      if (fileInput) fileInput.value = '';
                    }}
                  >
                    {t('common.cancel')}
                  </button>
                  <button 
                    className="admin-send-btn"
                    onClick={sendNewMessage}
                    disabled={(!newMessageText.trim() && !selectedNewMessageFile) || selectedUsers.length === 0 || fileUploading}
                  >
                    {fileUploading ? t('trainerNotifications.uploading') : t('trainerNotifications.sendMessage')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="admin-chat-view">
          <div className="admin-chat-header">
            <button 
              className="admin-back-btn"
              onClick={() => setSelectedConversation(null)}
            >
              ← {t('trainerNotifications.back')}
            </button>
            <div className="admin-chat-user-info">
              <h3>{getUserDisplayName(selectedConversation.user)}</h3>
              <span className="admin-user-role" style={{ color: getUserRoleColor(selectedConversation.user.role) }}>
                {getUserRoleDisplay(selectedConversation.user.role)}
              </span>
            </div>
          </div>

          <div className="admin-messages-container">
            {messages.map((message) => {
              // Determine if message was sent by current user (admin)
              const isSentByCurrentUser = message.senderId === currentUser.id;
              
              return (
                <div 
                  key={message.id}
                  className={`admin-message ${isSentByCurrentUser ? 'sent' : 'received'} ${!message.read && !isSentByCurrentUser ? 'unread-message' : ''}`}
                >
                  <div className="admin-message-content">
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
                    <span className="admin-message-timestamp">
                      {message.sentAt?.toDate().toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <div className="admin-message-input-container">
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

export default AdminNotifications;