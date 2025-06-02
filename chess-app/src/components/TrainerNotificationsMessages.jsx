import React, { useEffect, useState } from 'react';
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
import { db } from '../firebase'; // Import from your existing firebase.js file
import './TrainerNotificationsMessages.css'; // Import the separate CSS file

const NotificationsMessages = ({ currentUser, onUnreadCountChange }) => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showNewMessageForm, setShowNewMessageForm] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [selectedAdmins, setSelectedAdmins] = useState([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = React.useRef(null);

  // Auto scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

      // Calculate total unread count and send to parent
      if (onUnreadCountChange) {
        const totalUnreadCount = conversationsList.reduce((total, conversation) => {
          return total + conversation.unreadCount;
        }, 0);
        onUnreadCountChange(totalUnreadCount);
      }
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
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      await addDoc(collection(db, 'notifications'), {
        message: newMessage,
        senderId: currentUser.id,
        receiverId: selectedConversation.admin.id,
        sentAt: serverTimestamp(),
        read: false
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const sendNewMessage = async () => {
    if (!newMessageText.trim() || selectedAdmins.length === 0) return;

    try {
      const promises = selectedAdmins.map(adminId => 
        addDoc(collection(db, 'notifications'), {
          message: newMessageText,
          senderId: currentUser.id,
          receiverId: adminId,
          sentAt: serverTimestamp(),
          read: false
        })
      );

      await Promise.all(promises);
      setNewMessageText('');
      setSelectedAdmins([]);
      setShowNewMessageForm(false);
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
    return <div className="loading">Loading notifications...</div>;
  }

  return (
    <div className="notifications-container">
      {!selectedConversation ? (
        <div className="notifications-list">
          <div className="notifications-header">
            <h2>Messages & Notifications</h2>
            <button 
              className="new-message-btn"
              onClick={() => setShowNewMessageForm(true)}
            >
              + New Message
            </button>
          </div>

          {conversations.length === 0 ? (
            <div className="no-conversations">
              <p>No messages yet. Click "New Message" to start a conversation with an admin.</p>
            </div>
          ) : (
            <div className="conversations-list">
              {conversations.map((conversation) => (
                <div 
                  key={conversation.admin.id}
                  className={`conversation-item ${conversation.unreadCount > 0 ? 'unread' : ''}`}
                  onClick={() => openConversation(conversation)}
                >
                  <div className="conversation-header">
                    <div className="admin-info">
                      <h3>{conversation.admin.firstName} {conversation.admin.lastName}</h3>
                      <span className="admin-role">Admin</span>
                    </div>
                    {conversation.unreadCount > 0 && (
                      <div className="unread-badge">{conversation.unreadCount}</div>
                    )}
                  </div>
                  <div className="last-message">
                    <p>{conversation.lastMessage?.message}</p>
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
                  <h3>New Message</h3>
                  <button 
                    className="close-btn"
                    onClick={() => setShowNewMessageForm(false)}
                  >
                    ×
                  </button>
                </div>
                <div className="modal-body">
                  <div className="admin-selection">
                    <label>Select Admin(s):</label>
                    <div className="admin-checkboxes">
                      {admins.map((admin) => (
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
                          {admin.firstName} {admin.lastName}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="message-input">
                    <label>Message:</label>
                    <textarea
                      value={newMessageText}
                      onChange={(e) => setNewMessageText(e.target.value)}
                      placeholder="Type your message here..."
                      rows="4"
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    className="cancel-btn"
                    onClick={() => setShowNewMessageForm(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className="send-btn"
                    onClick={sendNewMessage}
                    disabled={!newMessageText.trim() || selectedAdmins.length === 0}
                  >
                    Send Message
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
              ← Back
            </button>
            <div className="chat-admin-info">
              <h3>{selectedConversation.admin.firstName} {selectedConversation.admin.lastName}</h3>
              <span>Admin</span>
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
                    <p>{message.message}</p>
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
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button onClick={sendMessage} disabled={!newMessage.trim()}>
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsMessages;