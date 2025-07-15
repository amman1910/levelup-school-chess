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