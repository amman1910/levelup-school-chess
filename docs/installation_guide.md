# Installation Guide
## Level Up Chess Management System

---

## Production Access (For End Users)

### Website Access
The Level Up Chess Management System is already deployed and ready to use:

**🌐 Main Website**: [https://levelup-chess.firebaseapp.com](https://levelup-chess.firebaseapp.com)

### User Access
- **Public Users**: Direct access to website - no installation required
- **Trainers & Admins**: Login credentials provided by system administrator

### System Requirements
- **Internet Connection**: Required for all functionality
- **Supported Browsers**: Chrome (recommended), Firefox, Safari, Edge
- **Device Compatibility**: Desktop, laptop, tablet, or smartphone
- **Languages**: Arabic (default) and English supported

---

## Development Setup (For Developers)

### Prerequisites
- **Node.js** (version 16 or higher)
- **npm** package manager
- **Git** for version control

### Installation Steps

#### 1. Clone Repository
```bash
git clone https://github.com/amman1910/levelup-school-chess.git
cd levelup-school-chess/chess-app
```

#### 2. Install Dependencies
```bash
npm install
```

#### 3. Environment Configuration
Create `.env` file in project root:
```env
VITE_FIREBASE_API_KEY=AIzaSyC7cvVFEXWjcHVquaQ7dWwLqNTOhe5ugBQ
VITE_FIREBASE_AUTH_DOMAIN=levelup-chess.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=levelup-chess
VITE_FIREBASE_STORAGE_BUCKET=levelup-chess.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=760940506832
VITE_FIREBASE_APP_ID=1:760940506832:web:a8a1dbaf41f5ec8ed178d5
VITE_FIREBASE_MEASUREMENT_ID=G-NBN5QP37Z2
```

#### 4. Run Development Server
```bash
npm run dev
```
Application will be available at `http://localhost:5173`

#### 5. Build for Production
```bash
npm run build
```

### Important Notes
- **Firebase Project**: Already configured and ready to use
- **No Additional Setup**: Database and authentication are pre-configured
- **Deployment**: Contact system administrator for deployment access

---

## Initial Admin Setup

### Creating First Administrator
The first admin user must be created manually:

1. **Access Firebase Console**: Contact technical team for access
2. **Create User**: Add user to Firebase Authentication
3. **Database Entry**: Add user record to Firestore with `role: "admin"`
4. **Login**: Use admin credentials to access admin portal

### Subsequent User Management
After initial admin creation:
- New users created through admin portal
- No manual Firebase configuration required
- Automatic account setup and permissions

---

## Support and Maintenance

### Technical Support
For technical issues or system problems:
- **Email**: amirmana43@gmail.com
- **GitHub**: Contact development team through repository
- Report bugs with detailed error descriptions
- Include browser and device information

### System Updates
- Updates deployed through Firebase Hosting
- No end-user installation required
- Contact administrators for feature requests

---

*This installation guide provides both end-user access information and development setup instructions for the Level Up Chess Management System.*