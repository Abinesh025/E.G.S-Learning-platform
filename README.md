EGS Learning Platform
📚 Overview

EGS Learning Platform is a comprehensive web-based learning management system developed to enhance digital education and streamline academic activities for students, staff, and administrators.

The platform provides centralized access to study materials, online tests, result tracking, real-time communication, and AI-assisted learning support. It enables staff to manage educational resources efficiently while allowing students to access learning content anytime and anywhere.

🚀 Features
🎓 Student Features
Student Registration & Login
Profile Management
Access Study Materials
Attend Online Tests
View Test Results
Pass/Fail Performance Analysis
Real-Time Chat with Staff
AI Learning Assistant
Theme Customization
👨‍🏫 Staff Features
Secure JWT Authentication
Upload Notes, PDFs, Videos, and Voice Materials
Create and Manage Online Tests
Track Student Performance
View Academic Analytics
Real-Time Student Communication
🔐 Admin Features
Manage Students
Manage Staff Members
Manage Materials
Manage Tests
Monitor Results
Platform-Wide Dashboard Analytics
💬 Communication Features
Real-Time Chat using Socket.IO
Voice Message Support
Instant Data Synchronization
🔒 Security Features
JWT Authentication
Role-Based Access Control
Password Encryption using bcrypt
OTP-Based Password Reset
Protected Admin Routes
🛠️ Tech Stack
Frontend
React.js
Vite
React Router DOM
Context API
Axios
Tailwind CSS
Socket.IO Client
Backend
Node.js
Express.js
Socket.IO
Database
MongoDB Atlas
Mongoose
Cloud Services
Cloudinary
Development Tools
Git & GitHub
Postman
VS Code
🏗️ System Architecture
React Frontend
       │
       ▼
REST API + Socket.IO
       │
       ▼
Node.js + Express
       │
       ▼
MongoDB Atlas
       │
       ▼
Cloudinary Storage
📂 Project Structure
EGS-Learning-Platform/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   └── package.json
│
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── socket/
│   ├── utils/
│   ├── app.js
│   ├── server.js
│   └── .env
│
├── README.md
└── package.json
👥 User Roles
Student
Access materials
Attend tests
View results
Chat with staff
Update profile
Staff
Upload materials
Create tests
Monitor results
Manage academic resources
Admin
Manage platform users
Control learning resources
Monitor platform activity
Generate reports
🔐 Authentication System
Staff Authentication
JWT-Based Authentication
Secure Protected Routes
Role-Based Authorization
Password Reset
Email OTP Verification
OTP Expiry Validation
Secure Password Update
📚 Learning Materials

Supported Material Types:

PDF Notes
Video Lectures
Audio Files
Documents
Assignments

All materials are uploaded and stored using Cloudinary.

📝 Online Examination Module
Features
Create Tests
Multiple Choice Questions
Automatic Evaluation
Instant Result Generation
Performance Tracking
Pass/Fail Calculation
💬 Real-Time Communication
Socket.IO Features
Student ↔ Staff Chat
Instant Messaging
Voice Message Sharing
Live Updates
📊 Dashboard Analytics
Student Dashboard
Available Materials
Upcoming Tests
Recent Results
Staff Dashboard
Total Students
Total Materials
Total Tests
Student Performance Statistics
Admin Dashboard
Total Students
Total Staff
Total Tests
Total Materials
Total Results
🗄️ Database Models
User
{
  name: String,
  email: String,
  password: String,
  regnum: String,
  role: String,
  department: String,
  phone: String,
  batch: String,
  avatar: String
}
Material
{
  title: String,
  description: String,
  subject: String,
  unit: String,
  topic: String,
  department: String,
  type: String,
  fileUrl: String
}
Test
{
  title: String,
  subject: String,
  department: String,
  duration: Number,
  questions: Array
}
Result
{
  student: ObjectId,
  test: ObjectId,
  score: Number,
  totalMarks: Number,
  percentage: Number
}
⚙️ Environment Variables
PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret

JWT_EXPIRE=7d

ADMIN_SECRET=your_admin_password

CLOUDINARY_CLOUD_NAME=your_cloud_name

CLOUDINARY_API_KEY=your_api_key

CLOUDINARY_API_SECRET=your_api_secret

CLIENT_URL=http://localhost:5173
🚀 Installation
Clone Repository
git clone https://github.com/your-username/egs-learning-platform.git
cd egs-learning-platform
Install Backend Dependencies
cd server
npm install
Install Frontend Dependencies
cd ../client
npm install
Run Backend
npm run dev
Run Frontend
npm run dev
🎯 Key Highlights
Learning Management System (LMS)
JWT Authentication
OTP Password Recovery
Real-Time Chat
AI Learning Assistant
Role-Based Access Control
Online Test Management
Cloud File Storage
Responsive Design
Academic Performance Tracking
🔮 Future Enhancements
Attendance Management
Video Conferencing Integration
Assignment Submission System
Email Notifications
Mobile Application
Advanced Analytics Dashboard
AI-Based Test Recommendations
Certificate Generation
👨‍💻 Author

Abinesh R

Email: abineshr005@gmail.com
LinkedIn: linkedin.com/in/rabinesh
GitHub: github.com/abineshr005
