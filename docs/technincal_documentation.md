# Technical Documentation
## Level Up Chess Management System

### Table of Contents
1. [Technology Stack](#technology-stack)
2. [Project Structure](#project-structure)
3. [Component Architecture](#component-architecture)
4. [Authentication & Security](#authentication--security)
5. [API Integration](#api-integration)
6. [Deployment & Configuration](#deployment--configuration)
7. [Development Guidelines](#development-guidelines)

## API Integration

### Firebase SDK Integration

#### Authentication
```javascript
import { auth } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

// Login
const login = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

// Create User
const createUser = async (email, password) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};
```

#### Firestore Operations
```javascript
import { db } from './firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';

// Create Document
const addDocument = async (collectionName, data) => {
  const docRef = await addDoc(collection(db, collectionName), data);
  return docRef.id;
};

// Read Documents
const getDocuments = async (collectionName) => {
  const snapshot = await getDocs(collection(db, collectionName));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Update Document
const updateDocument = async (collectionName, docId, data) => {
  await updateDoc(doc(db, collectionName, docId), data);
};

// Delete Document
const deleteDocument = async (collectionName, docId) => {
  await deleteDoc(doc(db, collectionName, docId));
};
```

#### Storage Operations
```javascript
import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Upload File
const uploadFile = async (file, path) => {
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file);
  return await getDownloadURL(snapshot.ref);
};
```

#### Real-Time Data Synchronization
```javascript
import { onSnapshot } from 'firebase/firestore';

// Real-time listener
useEffect(() => {
  const unsubscribe = onSnapshot(collection(db, 'notifications'), (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setNotifications(data);
  });
  
  return () => unsubscribe();
}, []);
```

---

## Technology Stack

### Frontend Technologies
- **React.js 19.0**: Modern component-based UI framework
- **React Router Dom 7.5**: Client-side routing and navigation
- **React i18next**: Internationalization (Arabic/English)
- **Vite**: Fast build tool and development server
- **CSS3**: Custom styling with RTL support

### Backend Services
- **Firebase Authentication**: User authentication and authorization
- **Cloud Firestore**: NoSQL document database
- **Firebase Storage**: File storage for images and documents
- **Firebase Hosting**: Static web hosting
- **Firebase Functions**: Serverless backend functions

### Development Tools
- **ESLint**: Code linting and quality assurance
- **Node.js**: Development environment
- **Git**: Version control system

---

## Project Structure

```
chess-app/
├── public/                     # Static assets
│   ├── assets/                 # Images and logos
│   └── index.html             # Main HTML template
│
├── src/                       # Source code
│   ├── components/            # React components
│   │   ├── Guest/            # Public website components
│   │   │   ├── GuestPage/    # Main guest page
│   │   │   ├── Navbar/       # Navigation component
│   │   │   ├── HeroSection/  # Landing section
│   │   │   ├── AboutUsSection/
│   │   │   ├── ProgramsSection/
│   │   │   ├── GallerySection/
│   │   │   ├── NewsAndEventsSection/
│   │   │   ├── InquiryForm/  # Registration form
│   │   │   └── Footer/       # Footer component
│   │   │
│   │   ├── AdminArea.jsx     # Admin portal main component
│   │   ├── TrainerArea.jsx   # Trainer portal main component
│   │   ├── Login.jsx         # Authentication component
│   │   └── shared/           # Shared components
│   │
│   ├── i18n/                 # Internationalization
│   │   ├── i18n.js          # i18next configuration
│   │   └── locales/         # Translation files
│   │       ├── en/          # English translations
│   │       └── ar/          # Arabic translations
│   │
│   ├── styles/              # Global styles
│   │   ├── rtl-support.css  # RTL layout support
│   │   └── global.css       # Global styles
│   │
│   ├── firebase.js          # Firebase configuration
│   ├── App.jsx             # Main application component
│   └── main.jsx            # Application entry point
│
├── .env                     # Environment variables
├── package.json            # Dependencies and scripts
├── vite.config.js          # Vite configuration
└── README.md               # Project documentation
```

## Component Architecture

### Component Hierarchy

```
App
├── Router
│   ├── GuestPage
│   │   ├── Navbar
│   │   ├── HeroSection
│   │   ├── AboutUsSection
│   │   ├── ProgramsSection
│   │   ├── NewsAndEventsSection
│   │   ├── GallerySection
│   │   ├── TestimonialsSection
│   │   ├── FAQSection
│   │   ├── Footer
│   │   └── LanguageSwitcher
│   │
│   ├── InquiryForm
│   │   └── LanguageSwitcher
│   │
│   ├── Login
│   │   └── LanguageSwitcher
│   │
│   ├── AdminArea
│   │   ├── AdminDashboard
│   │   ├── ManageUsers
│   │   ├── ManageSchools
│   │   ├── ManageClasses
│   │   ├── ManageStudents
│   │   ├── ManageMaterials
│   │   ├── AdminHomepageEditor
│   │   ├── AdminNotifications
│   │   ├── AdminRegistrationForms
│   │   └── LanguageSwitcher
│   │
│   └── TrainerArea
│       ├── TrainerDashboard
│       ├── TrainerSessions
│       ├── TrainerMeetingForm
│       ├── TrainerMaterialsLibrary
│       ├── TrainerNotifications
│       └── LanguageSwitcher
```

### Key Component Patterns

#### 1. Container Components
- Manage state and business logic
- Handle API calls and data fetching
- Pass data down to presentation components

#### 2. Presentation Components
- Focus on UI rendering
- Receive data through props
- Minimal state management

#### 3. Shared Components
- Reusable across different sections
- Language switcher, loading indicators
- Form components and modals

#### 4. HOC (Higher-Order Components)
- Authentication wrappers
- Permission-based rendering
- Error boundary components

---

## Authentication & Security

### Authentication Flow

```
1. User Login Attempt
   ↓
2. Firebase Authentication
   ↓
3. Retrieve User Document from Firestore
   ↓
4. Role-Based Route Authorization
   ↓
5. Component-Level Permission Checks
   ↓
6. Secure Data Access
```

### Security Rules

#### Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Public content
    match /news/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    match /events/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    match /gallery/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Protected content
    match /users/{document} {
      allow read, write: if request.auth != null && request.auth.uid == document;
    }
    
    // Admin-only content
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

#### Storage Security Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Public images
    match /gallery/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    match /news/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    match /events/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Protected files
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Authorization Patterns

#### Role-Based Access
```javascript
// Route protection
const ProtectedRoute = ({ children, requiredRole }) => {
  const user = getCurrentUser();
  return user?.role === requiredRole ? children : <Navigate to="/login" />;
};

// Component-level checks
const AdminComponent = () => {
  const user = getCurrentUser();
  if (user?.role !== 'admin') return <Unauthorized />;
  return <AdminContent />;
};
```

---

## Deployment & Configuration

### Firebase Configuration
```javascript
// firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
```

### Environment Variables
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### Build Configuration
```bash
# Build for production
npm run build

# Deploy to Firebase
firebase deploy --only hosting
```

---

## Development Guidelines

---

*This technical documentation provides a comprehensive overview of the Level Up Chess Management System architecture, implementation details, and development guidelines. For specific implementation questions or advanced configurations, contact the development team.*