# ♟️ Level Up Chess Club Management System

A comprehensive web-based management system for Shah2Range organization, designed to manage chess clubs in East Jerusalem schools and private groups.

## 🌐 Live Demo
**Website**: [https://levelup-chess.firebaseapp.com/](https://levelup-chess.firebaseapp.com/)

## 👥 Development Team
This project was developed as part of the "Software Engineering for the Community" course at Azrieli College of Engineering, Jerusalem.

- **Amir Mana** - [@amman1910](https://github.com/amman1910)  
- **Moataz Sharabaty** - [@motazshar](https://github.com/motazshar)  
- **Hadeel Abbasi** - [@hadeelAbbasi](https://github.com/hadeelAbbasi)  
- **Ahmad Abu Ghosh** - [@ahmadswe](https://github.com/ahmadswe)  
- **Ameer Jaber** - [@xxameerxx](https://github.com/xxameerxx)

## 📋 Project Overview

The Level Up Chess Club Management System is a full-stack web application designed for Shah2Range organization to efficiently manage their chess programs across multiple schools and groups in East Jerusalem.

### 🎯 Key Features

#### 🌍 **Public Website (Guest Portal)**
- Bilingual support (Arabic/English) with RTL support
- Organization information and mission
- Interactive gallery and news/events section
- Student registration form
- Program details and testimonials
- FAQ section and contact information

#### 👨‍🏫 **Trainer Portal**
- Personal dashboard with session overview
- Lesson planning and material access
- Attendance tracking and management
- Session documentation and reporting
- Real-time notifications from administrators
- Student progress monitoring

#### 👨‍💼 **Admin Portal**
- Comprehensive dashboard with analytics
- User management (trainers, students, schools)
- Content management (news, events, gallery)
- Registration request management
- Lesson materials library
- Notification system
- Activity logging and monitoring
- Reports generation

### 🏗️ System Architecture

The application follows a three-layer architecture:

- **Client Layer**: React.js frontend supporting desktop and mobile browsers
- **Service Layer**: Business logic handling authentication, data processing, and core functionality
- **Database Layer**: Firebase Firestore for data storage, Firebase Storage for media files

## 🛠️ Technologies Used

### Frontend
- **React.js 19.0** - Modern web framework
- **React Router Dom 7.5** - Client-side routing
- **React i18next** - Internationalization (Arabic/English)
- **React Icons** - Icon library
- **Recharts** - Data visualization
- **Vite** - Build tool and development server

### Backend & Services
- **Firebase Authentication** - User authentication
- **Firebase Firestore** - NoSQL database
- **Firebase Storage** - File storage
- **Firebase Hosting** - Web hosting

### Development Tools
- **ESLint** - Code linting
- **Node.js** - Runtime environment

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager
- Firebase project with enabled services

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/amman1910/levelup-school-chess.git
   cd levelup-school-chess/chess-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   
   Create a `.env` file in the root directory with the provided Firebase configuration:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSyC7cvVFEXWjcHVquaQ7dWwLqNTOhe5ugBQ
   VITE_FIREBASE_AUTH_DOMAIN=levelup-chess.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=levelup-chess
   VITE_FIREBASE_STORAGE_BUCKET=levelup-chess.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=760940506832
   VITE_FIREBASE_APP_ID=1:760940506832:web:a8a1dbaf41f5ec8ed178d5
   VITE_FIREBASE_MEASUREMENT_ID=G-NBN5QP37Z2
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## 🔧 System Setup

The Firebase project is already configured and ready to use. No additional Firebase setup is required.

### Environment Configuration

Create a `.env` file in the root directory with the provided Firebase configuration:

```env
VITE_FIREBASE_API_KEY=AIzaSyC7cvVFEXWjcHVquaQ7dWwLqNTOhe5ugBQ
VITE_FIREBASE_AUTH_DOMAIN=levelup-chess.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=levelup-chess
VITE_FIREBASE_STORAGE_BUCKET=levelup-chess.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=760940506832
VITE_FIREBASE_APP_ID=1:760940506832:web:a8a1dbaf41f5ec8ed178d5
VITE_FIREBASE_MEASUREMENT_ID=G-NBN5QP37Z2
```

### Initial Admin Setup
1. The first admin user must be created in Firebase Console
2. Add the user to Firestore `users` collection with `role: "admin"`
3. The admin can then create additional users through the admin portal

## 📁 Project Structure

```
chess-app/
├── public/                 # Static assets
├── src/
│   ├── components/
│   │   ├── Guest/         # Public website components
│   │   ├── AdminArea.jsx  # Admin portal
│   │   ├── TrainerArea.jsx # Trainer portal
│   │   └── Login.jsx      # Authentication
│   ├── i18n/              # Internationalization
│   ├── styles/            # Global styles
│   ├── firebase.js        # Firebase configuration
│   └── App.jsx           # Main application component
├── .env                   # Environment variables
├── package.json          # Dependencies
└── README.md             # Project documentation
```

## 🌐 Supported Languages

The application supports:
- **Arabic** (Right-to-Left) - Default language
- **English** (Left-to-Right)

Language switching is available throughout the application with persistent user preferences.

## 📱 Browser Support

The application is tested and supports:
- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🔐 User Roles & Permissions

### Guest (Public)
- View organization information
- Browse gallery and events
- Submit registration requests
- Access FAQ and contact information

### Trainer
- Access personal dashboard
- Document lessons and track attendance
- View assigned students and classes
- Access lesson materials
- Receive notifications from admins

### Administrator
- Full system access and management
- User account management
- Content management (news, events, gallery)
- Analytics and reporting
- System configuration

## 🚀 Deployment

The application is deployed using Firebase Hosting:

```bash
npm run build
firebase deploy
```

## 📊 Key Features in Detail

### Attendance Tracking
- Digital attendance recording
- Student progress monitoring
- Session documentation

### Content Management
- Dynamic news and events updates
- Gallery management with image upload
- Student registration processing

### Analytics & Reporting
- User activity tracking
- Session analytics
- Attendance trends

### Notification System
- Real-time notifications
- Admin-to-trainer messaging
- System alerts

## 🤝 Contributing

This is an academic project developed for Shah2Range organization. For any modifications or improvements, please contact the development team.

## 📄 License

This project is developed for educational purposes as part of Azrieli College of Engineering coursework.

## 📞 Support

For technical support or questions about the system, please contact the development team through the GitHub repository.

---

**Developed with ❤️ for Shah2Range Organization**