# Complete User and Administrator Guide
## Level Up Chess Club Management System

### Table of Contents
1. [System Overview](#system-overview)
2. [Getting Started](#getting-started)
3. [Public Website (Guest Users)](#public-website-guest-users)
4. [Student Registration Process](#student-registration-process)
5. [Trainer Portal](#trainer-portal)
6. [Administrator Portal](#administrator-portal)
7. [Troubleshooting](#troubleshooting)

---

## System Overview

The Level Up Chess Club Management System is designed for Shah2Range organization to manage chess programs across multiple schools and groups in East Jerusalem. The system serves three main user types:

- **Guests (Public)**: Access organizational information and submit registration requests
- **Trainers**: Document lessons, track attendance, and access teaching materials
- **Administrators**: Comprehensive system management and oversight

### Key Features
- **Bilingual Support**: Arabic (RTL) and English (LTR) with persistent language preferences
- **Role-Based Access**: Different interfaces and permissions for each user type
- **Real-Time Updates**: Live notifications and content updates
- **Mobile Responsive**: Works on desktops, tablets, and smartphones

---

## Getting Started

### Accessing the System
- **Public Website**: [https://levelup-chess.firebaseapp.com/](https://levelup-chess.firebaseapp.com/)
- **Login Portal**: [https://levelup-chess.firebaseapp.com/login](https://levelup-chess.firebaseapp.com/login)

### Language Support
- **Default Language**: Arabic (Right-to-Left layout)
- **Language Switching**: Use the globe icon available on all pages
- **Persistent Preferences**: Language choice is automatically saved

### Browser Compatibility
- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers

---

## Public Website (Guest Users)

### Website Navigation
The public website provides comprehensive information about Shah2Range organization:

#### Available Sections:
1. **Organization Information**
   - Mission and objectives
   - Program descriptions
   - Contact information

2. **Interactive Gallery**
   - Photo gallery of chess activities
   - Automatic slideshow functionality
   - Full-screen image viewing

3. **News and Events**
   - Latest announcements
   - Upcoming tournaments and courses
   - Event registration capabilities

4. **Frequently Asked Questions**
   - Common inquiries and answers
   - Program details and requirements

5. **Registration Access**
   - Multiple registration types available
   - Direct access to application forms

---

## Student Registration Process

### Registration Types Available

#### Individual Students
- **Purpose**: Personal chess lessons
- **Required Information**: Name, age, contact details, chess skill level
- **Process**: Simple form completion and submission

#### Tournament Participation
- **Purpose**: Competition entry
- **Required Information**: Participant details and tournament selection
- **Process**: Select specific tournament from available options

#### Course Enrollment
- **Purpose**: Structured learning programs
- **Required Information**: Student details and course preference
- **Process**: Choose from available courses and submit application

#### Institutional Partnerships
- **School Partnerships**: Collaboration requests from educational institutions
- **Parent Inquiries**: General information requests from parents
- **Coach Applications**: Employment applications including CV upload

### Step-by-Step Registration Process

#### Step 1: Access Registration Form
- Click "Join Now" buttons throughout the website
- Or navigate directly to `/join`

#### Step 2: Select Registration Type
Choose the appropriate category from the dropdown menu

#### Step 3: Complete Application Form
**For Individual Students:**
- Full name (required)
- Age (required)
- Phone number (required)
- Email address (required)
- Chess skill level: Beginner, Intermediate, or Advanced
- Additional notes (optional)

**For Coach Applications:**
- Personal information (name, contact, city)
- Educational background (university, major, year)
- Professional experience (previous employment)
- Chess knowledge level (1-5 star rating)
- Availability (days, hours, transportation)
- CV upload (PDF/DOC format)
- Teaching experience description

#### Step 4: Submit and Confirmation
- Review all information for accuracy
- Submit application
- Receive confirmation message
- Application enters admin review process

---

## Trainer Portal

### Accessing the Trainer Portal
1. Navigate to the login page
2. Enter trainer credentials (provided by administrator)
3. Access personalized trainer dashboard

### Dashboard Overview
The trainer dashboard provides:
- **Session Overview**: Upcoming and completed lessons
- **Quick Actions**: Fast access to common tasks
- **Notifications**: Messages from administrators
- **Student Progress**: Performance tracking tools

### Session Management

#### Viewing Your Sessions
Navigate to "Sessions" to see:
- **Completed Sessions**: Previously documented lessons with full details
- **Upcoming Sessions**: Future scheduled classes awaiting documentation

#### Session Documentation Process
1. **Access Documentation Form**
   - Click "Record Session" from the main menu
   - Or click "Document" button next to specific upcoming session

2. **Complete Session Information**
   - **Date and Time**: When the lesson took place
   - **Lesson Topic**: Primary subject matter covered
   - **Student Attendance**: Mark each student as present/absent
   - **Session Notes**: Detailed description of lesson content
   - **Student Progress**: Individual performance observations
   - **Materials Used**: Teaching resources utilized
   - **Homework Assigned**: Tasks given to students

3. **Save Documentation**
   - Review all information for completeness
   - Click "Save Session" to store documentation
   - Session moves from "Upcoming" to "Completed" list

#### Editing Session Records
- **Find Session**: Locate in your sessions list
- **Edit Mode**: Click "Edit" button
- **Modify Information**: Update any field as needed
- **Save Changes**: Confirm updates

### Accessing Teaching Materials

#### Materials Library Access
1. Navigate to "Materials Library" from main menu
2. Browse available resources by category:
   - **Documents**: Lesson plans, worksheets, guides
   - **Presentations**: Slide shows and visual aids
   - **Videos**: Instructional content and demonstrations
   - **Images**: Diagrams, charts, and visual references

#### Material Organization
- **Search Function**: Find specific materials by title or description
- **Filter by Type**: Show only documents, presentations, videos, or images
- **Access Permissions**: Only see materials assigned to you by administrators

### Communication with Administrators

#### Notifications System
- **Real-Time Alerts**: Immediate notification of new messages
- **Message Threads**: Organized conversation history
- **File Attachments**: Receive documents and images from administrators

#### Responding to Messages
1. **Access Notifications**: Click notification icon (shows unread count)
2. **Read Messages**: View all administrator communications
3. **Reply**: Send responses and ask questions
4. **File Sharing**: Attach documents or images to messages

---

## Administrator Portal

### Accessing the Admin Portal
1. Login with administrator credentials
2. Access comprehensive admin dashboard
3. Navigate using the main menu system

### Dashboard Features
- **System Statistics**: Users, schools, classes, and recent activity
- **Quick Actions**: Access to frequently used functions
- **Recent Activity**: Latest system updates and administrative actions
- **Navigation Menu**: Complete access to all admin functions

---

## User Management (Administrators Only)

### Creating New Users

#### Step-by-Step User Creation:
1. **Navigate to User Management**
   - Go to "Manage Users" from main navigation

2. **Complete User Information Form**
   - **ID Number** (required): Unique identification number
   - **First Name** (required): User's first name
   - **Last Name** (required): User's last name
   - **Email Address** (required): Valid email for login
   - **Age** (optional): User's age
   - **Role** (required): Select "Admin" or "Trainer"
   - **Initial Password** (required): Temporary password for first login

3. **Submit and Verification**
   - Click "Add User" to create account
   - System creates Firebase Authentication entry
   - Database record created with user details
   - User receives login credentials

#### Important User Creation Notes:
- **Unique Requirements**: ID numbers and email addresses must be unique
- **First Login Process**: New users must change password on initial login
- **Account Activation**: Accounts are immediately active upon creation
- **Role Permissions**: Trainers have limited access, Admins have full access

### Editing User Information

#### Edit Process:
1. **Locate User**: Use search/filter functions to find specific user
2. **Edit Mode**: Click "Edit" button next to user record
3. **Modify Fields**: Update any information except ID number
4. **Save Changes**: Confirm updates to user record

#### Editable Fields:
- First and Last Name
- Email Address
- Age
- Role (Admin/Trainer)
- Note: ID numbers cannot be modified after creation

### User Deletion and Impact

#### Deletion Process:
1. **Find User**: Locate in user management list
2. **Delete Action**: Click "Delete" button
3. **Confirmation**: System requests deletion confirmation
4. **Automatic Cleanup**: System handles all related data

#### System Impact of User Deletion:
**When Deleting Trainers:**
- **Class Assignments**: Trainer field set to null in assigned classes
- **Learning Materials**: User removed from all material access lists
- **Notifications**: All user notifications deleted
- **Session Records**: Historical data preserved but trainer references updated

**When Deleting Admins:**
- **Activity Logs**: Administrative action history cleaned up
- **System Changes**: All admin-created content remains but attribution updated

### User Search and Management

#### Search Capabilities:
- **Search by ID**: Find users by identification number
- **Search by Name**: Locate by first or last name
- **Search by Email**: Find users by email address
- **Search by Role**: Filter by Admin or Trainer
- **Search All Fields**: Comprehensive search across user data

#### User List Management:
- **Sort Options**: By creation date, name, or role
- **Filter Options**: Show only specific user types
- **Bulk Operations**: Select multiple users for batch actions

---

## Schools and Classes Management

### School Management

#### Adding New Schools:
1. **Navigate to School Management**
   - Go to "Manage Schools" from main navigation

2. **School Information Form**
   - **School Name** (required): Must be unique in system
   - **Address** (optional): Physical location
   - **Contact Person** (optional): Primary point of contact
   - **Phone Number** (optional): School contact number

3. **Save School**
   - Click "Add School" to create record
   - School appears immediately in system

#### School Management Features:
- **Search Schools**: Find by name, address, or contact information
- **Edit Schools**: Update any school information
- **Delete Schools**: Remove schools (affects related classes)

### Class Management

#### Creating New Classes:
1. **Access Class Management**
   - Navigate to "Manage Classes"

2. **Class Information Form**
   - **Class Name** (required): Descriptive class identifier
   - **School** (required): Select from available schools
   - **Level** (required): Beginner, Intermediate, or Advanced
   - **Assigned Trainer** (required): Choose from available trainers
   - **Syllabus File** (optional): Upload course materials
   - **Students** (optional): Assign students to class

3. **Student Assignment Process**
   - Click "Choose" button for student selection
   - Modal window shows all available students
   - Select students using checkboxes
   - Save student assignments

4. **Class Creation**
   - System validates class name + school combination is unique
   - Click "Add Class" to create
   - Class appears in system immediately

#### Class Management Features:
- **Search Classes**: Find by name, school, level, or trainer
- **Edit Classes**: Modify any class information including student assignments
- **Delete Classes**: Remove classes (automatically deletes related sessions)
- **Syllabus Management**: Upload, replace, or remove course materials

---

## Learning Materials Management

### Uploading New Materials

#### Material Upload Process:
1. **Navigate to Materials Management**
   - Go to "Manage Materials"

2. **Material Information Form**
   - **Title** (required): Descriptive name for material
   - **Description** (optional): Detailed content description
   - **Type** (optional): Presentation, Document, Image, or Video
   - **Files**: Select one or multiple files

3. **Trainer Access Assignment**
   - **View Available Trainers**: System displays all registered trainers
   - **Select Trainers**: Choose which trainers can access material
   - **Permission Control**: Only selected trainers see material in their portal

4. **Upload Completion**
   - Click "Upload Files" to process
   - Files stored in Firebase Storage
   - Database entries created with access permissions

### Material Management Features

#### Organizing Materials:
- **Search Function**: Find materials by title, description, or type
- **Filter by Type**: Show specific material types only
- **Sort Options**: Newest first, oldest first, or alphabetical
- **Access Control**: View which trainers have access to each material

#### Editing Materials:
1. **Select Material**: Find in materials library
2. **Edit Mode**: Click "Edit" on material card
3. **Update Information**: Modify title, description, type, or trainer access
4. **Save Changes**: Apply updates immediately

#### Access Management:
- **By Material**: See trainer access list for each material
- **By Trainer**: View all materials accessible to specific trainer
- **Permission Updates**: Add or remove trainer access as needed

---

## Registration Request Management

### Processing Registration Requests

#### Viewing Applications:
1. **Access Registration Management**
   - Navigate to "Registration Requests"
   - Badge shows number of pending requests

2. **Request Status Types**
   - **Pending**: New applications awaiting review
   - **Processed**: Applications that have been handled

#### Request Review Process:
1. **Open Request**: Click on any registration to view full details
2. **Review Information**:
   - **Applicant Details**: Contact information and background
   - **Registration Type**: Student, parent, school, coach, etc.
   - **Program Interest**: Specific courses or services requested
   - **Additional Notes**: Applicant comments and special requests

3. **Decision Making**:
   - **Contact Applicant**: Use provided phone/email for communication
   - **Gather Information**: Request additional details if needed
   - **Evaluate Application**: Assess suitability for programs

4. **Request Resolution**:
   - **Add Administrative Notes**: Document decision reasoning
   - **Update Status**: Mark as approved, rejected, or other status
   - **Close Request**: Remove from pending list

### Special Request Types

#### Coach Application Processing:
- **CV Review**: Download and evaluate uploaded resume
- **Qualification Assessment**: Review education and experience
- **Interview Coordination**: Schedule meetings with candidates
- **Decision Documentation**: Record approval/rejection reasoning

#### Institutional Requests:
- **School Partnerships**: Evaluate collaboration opportunities
- **Parent Inquiries**: Provide program information and guidance
- **Student Applications**: Process individual enrollment requests

---

## Homepage Content Management

### News Management

#### Creating News Items:
1. **Access Homepage Editor**
   - Navigate to "Edit Homepage"
   - Select "News" section

2. **News Creation Form**
   - **Title** (required): News headline
   - **Image** (optional): Upload relevant photo
   - **Description** (required): Complete news content

3. **Publication**
   - Click "Save" to publish immediately
   - News appears on public website

#### News Management:
- **Edit News**: Modify existing news items
- **Delete News**: Remove outdated content
- **Organization**: Sort and search news items

### Event Management

#### Creating Events:
1. **Access Events Section**
   - Go to "Edit Homepage" → "Events"

2. **Event Information Form**
   - **Title** (required): Event name
   - **Date** (required): Event date and time
   - **Location** (required): Venue address
   - **Image** (optional): Event promotional image
   - **Description** (required): Event details and information

3. **Event Publication**
   - Events appear immediately on public website
   - Visitors can register through registration form

### Gallery Management

#### Image Upload Process:
1. **Access Gallery Management**
   - Navigate to "Edit Homepage" → "Gallery"

2. **Image Upload**
   - **Title** (required): Image caption or description
   - **Upload Image**: Select image file
   - **Save**: Image appears immediately in public gallery

#### Gallery Features:
- **Automatic Display**: Images appear in public gallery
- **Recent First**: Newest images shown first
- **Mobile Responsive**: Automatic resizing for different devices

---

## Communication and Notifications

### Notification System Overview

#### How It Works:
- **Real-Time Messaging**: Instant communication between admins and trainers
- **File Sharing**: Send documents, images, and other files
- **Read Receipts**: Track when messages are viewed
- **Conversation Threading**: Organized message history

### Admin Communication Features

#### Sending Messages to Trainers:
1. **New Message Creation**
   - Click "New Message" in notifications section
   - Opens message composition interface

2. **Recipient Selection**
   - **Search Trainers**: Find specific trainers by name
   - **Select All**: Choose all trainers simultaneously
   - **Individual Selection**: Pick specific recipients

3. **Message Composition**
   - **Text Content**: Type message content
   - **File Attachments**: Add documents, images, or other files
   - **Send**: Deliver immediately to selected trainers

#### Managing Conversations:
1. **View Conversations**: See all message threads organized by trainer
2. **Reply to Messages**: Respond to trainer inquiries
3. **File Sharing**: Send teaching materials and documents
4. **Search Conversations**: Find specific message threads

### Trainer Communication Features

#### Receiving and Responding:
- **Notification Alerts**: Real-time notification of new messages
- **Message Reading**: View all administrator communications
- **Response Capability**: Reply to admin messages
- **File Downloads**: Access shared documents and materials

---

## System Analytics and Reporting

### Available Analytics

#### User Statistics:
- **Total Users**: Count of administrators and trainers
- **User Activity**: Recent registrations and login patterns
- **Role Distribution**: Breakdown of user types

#### Content Analytics:
- **Registration Trends**: Application patterns and processing statistics
- **Material Usage**: Access patterns for learning materials
- **Homepage Engagement**: News, events, and gallery activity

#### System Activity:
- **Administrative Actions**: Complete log of admin activities
- **User Management**: Account creation, modification, and deletion tracking
- **Content Management**: Material uploads and homepage updates

### Report Generation

#### Available Reports:
1. **User Activity Reports**
   - New registrations by date range
   - User distribution by role
   - Account status summaries

2. **Registration Processing Reports**
   - Application types and volumes
   - Processing time analytics
   - Approval/rejection rates

3. **Content Usage Reports**
   - Material access frequency
   - Popular content identification
   - Trainer engagement metrics

---

## Security and Permissions

### System Security Framework

#### Firebase Security Rules:
The system implements comprehensive security rules:

**Public Content** (No authentication required):
- News items: Public read access
- Events: Public read access
- Gallery: Public read access

**Protected Content** (Authentication required):
- User data: Restricted to user's own information
- Administrative logs: Admin access only
- Learning materials: Role-based access
- All other data: Authenticated users only

### Permission Management System

#### Role-Based Access Control:
1. **Administrator Permissions**:
   - Full system access and management
   - User creation and deletion
   - Content management and publication
   - System configuration and security

2. **Trainer Permissions**:
   - Session documentation and management
   - Assigned student information
   - Learning materials (as assigned by admin)
   - Communication with administrators

#### Dynamic Permission Assignment:
- **Class Access**: Trainers assigned to specific classes
- **Material Access**: Explicit permission per trainer per material
- **Student Access**: Through class assignments only

### Security Best Practices

#### For Administrators:
- **Strong Passwords**: Use complex, unique passwords
- **Regular Reviews**: Periodically audit user permissions
- **Access Monitoring**: Track administrative actions
- **Data Protection**: Follow organizational data policies

#### For All Users:
- **Secure Login**: Keep credentials confidential
- **Browser Security**: Use updated, secure browsers
- **Logout Procedures**: Always logout when finished
- **Report Issues**: Contact administrators about security concerns

---

## Troubleshooting

### Common User Issues

#### Login Problems:
**Issue**: Cannot access trainer/admin portal
**Solutions**:
- Verify username and password accuracy
- Check account creation with administrator
- Clear browser cache and cookies
- Try different browser or device

#### File Upload Issues:
**Issue**: Cannot upload materials or CV files
**Solutions**:
- Check file format compatibility (PDF, DOC, DOCX)
- Ensure file size is reasonable (under 10MB)
- Verify stable internet connection
- Try different browser

#### Language Display Problems:
**Issue**: Content appears in wrong language
**Solutions**:
- Use language switcher (globe icon)
- Clear browser cache
- Check browser language settings
- Ensure localStorage is enabled

### Registration Issues

#### Form Submission Problems:
**Issue**: Cannot submit registration application
**Solutions**:
- Complete all required fields
- Verify email format is correct
- Check phone number format
- Refresh page and retry

#### Application Status Questions:
**Issue**: Uncertain about application status
**Solutions**:
- Contact organization directly using provided contact information
- Allow reasonable processing time for applications
- Ensure contact information was provided correctly

### Administrator-Specific Issues

#### User Management Problems:
**Issue**: Cannot create new user accounts
**Solutions**:
- Verify ID numbers are unique
- Check email addresses are not already in use
- Ensure all required fields are completed
- Verify Firebase connectivity

#### Content Management Issues:
**Issue**: Homepage content not updating
**Solutions**:
- Check internet connection during content creation
- Verify all required fields completed
- Allow time for content propagation
- Clear browser cache and refresh public site

#### System Performance Issues:
**Issue**: System loading slowly or timing out
**Solutions**:
- Check internet connection stability
- Close unnecessary browser tabs
- Try different browser (Chrome recommended)
- Clear browser cache and cookies

### Getting Help

#### When to Contact Support:
- System-wide outages or persistent errors
- Security concerns or suspected breaches
- Data loss or corruption
- Account access problems that cannot be resolved

#### Information to Provide When Reporting Issues:
- **Detailed Description**: Clear explanation of the problem
- **Steps to Reproduce**: What actions led to the issue
- **Error Messages**: Exact text of any error messages (screenshots helpful)
- **Browser Information**: Which browser and version being used
- **Device Information**: Computer, tablet, or phone details
- **User Account**: Affected username or email address

#### Emergency Procedures:
- **Security Breach**: Change passwords immediately and contact support
- **Data Loss**: Contact technical support immediately
- **System Outage**: Check system status and report if widespread

---

## System Requirements and Compatibility

### Supported Browsers:
- **Chrome** (recommended for best performance)
- **Firefox** (fully supported)
- **Safari** (Mac and iOS)
- **Edge** (Windows)
- **Mobile Browsers** (iOS Safari, Chrome Mobile)

### Device Compatibility:
- **Desktop Computers**: Windows, Mac, Linux
- **Laptops**: All operating systems
- **Tablets**: iPad, Android tablets
- **Smartphones**: iOS and Android devices

### Internet Requirements:
- **Stable Connection**: Required for all functionality
- **Upload Speed**: Important for file uploads and image sharing
- **Mobile Data**: System works on mobile data but may consume data for large files

### Language Support:
- **Arabic**: Right-to-Left (RTL) layout with full language support
- **English**: Left-to-Right (LTR) layout
- **Language Switching**: Available on all pages with persistent preferences
- **Unicode Support**: Proper display of Arabic and English text

---

*This comprehensive guide covers all aspects of the Level Up Chess Management System for both regular users and administrators. For technical support or advanced system configurations, contact your system administrator or technical support team.*