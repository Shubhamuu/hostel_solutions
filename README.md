# 🏠 Hostel Management System

> **A Modern Full-Stack Web Application for End-to-End Hostel Operations Management**

[![React](https://img.shields.io/badge/React-19.2.0-61DAFB?logo=react)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?logo=mongodb)](https://www.mongodb.com/)
[![Vite](https://img.shields.io/badge/Vite-7.2.4-646CFF?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1.18-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [System Architecture](#-system-architecture)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Environment Setup](#-environment-setup)
- [Running the Application](#-running-the-application)
- [User Roles](#-user-roles)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [Security Features](#-security-features)
- [Payment Integration](#-payment-integration)
- [Screenshots](#-screenshots)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)
- [License](#-license)
- [Contact](#-contact)

---

## 🌟 Overview

**Hostel Management System** is a comprehensive web platform designed to digitize and automate hostel operations. It eliminates manual processes such as offline bookings, cash payments, and paper-based record keeping by providing a unified digital ecosystem for students, hostel administrators, and platform supervisors.

### Problem It Solves

- ❌ **Manual Bookings**: Replace paper-based room reservations with digital booking system
- ❌ **Cash Payments**: Eliminate cash handling with integrated online payment gateway
- ❌ **Record Keeping**: Automate fee tracking and payment history
- ❌ **Room Management**: Real-time occupancy tracking and availability
- ❌ **Admin Verification**: Centralized approval system for hostel administrators

### Target Users

1. **Students** - Search, book, and pay for hostel accommodation
2. **Hostel Admins** - Manage rooms, residents, fees, and operations
3. **Super Admins** - Platform governance and admin verification

---

## ✨ Key Features

### 🎓 For Students

- 🔍 **Smart Hostel Search** - Filter by price, location, room type with map view
- 🏠 **Room Booking** - Real-time availability checking and instant booking
- 💳 **Digital Payments** - Secure online payments via Khalti (Nepal's leading payment gateway)
- 👥 **Roommate View** - See roommates before and after booking
- 📊 **Personal Dashboard** - Track bookings, payments, and accommodation status
- 📱 **Profile Management** - Update personal info and upload documents
- 🍽️ **Mess Menu** - View daily/weekly meal schedules

### 👨‍💼 For Hostel Admins

- 🛏️ **Room Management** - Add, edit, and deactivate rooms with pricing
- 👥 **Student Management** - View residents, documents, and room assignments
- 💰 **Fee Tracking** - Monitor payments, outstanding dues, and payment history
- ✅ **Booking Approval** - Review and confirm booking requests
- 📍 **Hostel Details** - Update hostel info, location, and images
- 🍽️ **Menu Management** - Create and update weekly mess menus
- 📈 **Analytics Dashboard** - Occupancy rates, revenue, and booking trends
- 🔄 **Re-apply System** - Resubmit for verification if rejected

### 👑 For Super Admins

- ✅ **Admin Verification** - Approve/reject hostel administrator applications
- 📋 **Platform Monitoring** - Oversee all hostels and administrators
- 🔒 **Access Control** - Suspend or activate hostels
- 📊 **System Overview** - Platform-wide statistics and compliance

---

## 🛠️ Technology Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 19** | Modern UI framework with latest features |
| **Vite 7** | Lightning-fast build tool and dev server |
| **Tailwind CSS 4** | Utility-first CSS framework |
| **React Router 7** | Client-side routing with protected routes |
| **Axios** | HTTP client with interceptor pattern |
| **Lucide React** | Beautiful icon library |
| **React Toastify** | Toast notifications |
| **date-fns** | Date manipulation and formatting |
| **Leaflet + React Leaflet** | Interactive maps for hostel locations |

### Backend
| Technology | Purpose |
|------------|---------|
| **Node.js** | JavaScript runtime |
| **Express.js 5** | RESTful API framework |
| **MongoDB 7** | NoSQL database |
| **Mongoose 8** | ODM with schema validation |
| **JWT** | Token-based authentication |
| **bcrypt** | Password hashing |
| **node-cron** | Task scheduling for automated billing |
| **Multer** | File upload handling |
| **Cloudinary** | Cloud image storage and delivery |
| **Nodemailer** | Email service for OTP |
| **Joi** | Request validation |

### Payment & External Services
- **Khalti** - Nepali payment gateway (epayment API)
- **Cloudinary** - Image hosting and CDN
- **SMTP** - Email delivery for OTP verification

---

## 🏗️ System Architecture

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   React SPA     │  HTTP   │   Express API   │  CRUD   │    MongoDB      │
│  (Port 5173)    │ ◄─────► │  (Port 5000)    │ ◄─────► │    Database     │
└─────────────────┘         └─────────────────┘         └─────────────────┘
       │                             │
       │                             │ External APIs
       │                             ▼
       │                    ┌─────────────────┐
       │                    │  • Khalti       │
       └───────────────────►│  • Cloudinary   │
         (CDN Images)       │  • Nodemailer   │
                            └─────────────────┘
```

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v5 or higher) - [Download](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- **npm** or **yarn** package manager
- **Git** - [Download](https://git-scm.com/downloads)

### External Service Accounts

1. **MongoDB Atlas** (recommended) - [Sign up](https://www.mongodb.com/cloud/atlas/register)
2. **Cloudinary** - [Sign up](https://cloudinary.com/users/register/free)
3. **Khalti Merchant Account** - [Apply](https://khalti.com/merchant)
4. **SMTP Provider** (Gmail, SendGrid, etc.)

---

## 💻 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Shubhamuu/hostel_solutions.git
cd hostel_solutions
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend_h/my-react-app
npm install
```

---

## ⚙️ Environment Setup

### Backend Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/hostel_management
# Or use MongoDB Atlas:
# MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/hostel_management

# JWT Secret Keys
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
REFRESH_TOKEN_SECRET=your_refresh_token_secret_key_here

# Khalti Payment Gateway
KHALTI_API_KEY=your_khalti_secret_key
FRONTEND_URL=http://localhost:5173

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Email Configuration (Gmail example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_specific_password
EMAIL_FROM=noreply@hostelmgmt.com

# CORS
ALLOWED_ORIGINS=http://localhost:5173
```

### Frontend Environment Variables

Create a `.env` file in the `frontend_h/my-react-app` directory:

```env
VITE_API_URL=http://localhost:5000/api
VITE_FRONTEND_URL=http://localhost:5173
```

---

## 🚀 Running the Application

### Start MongoDB (if local)

```bash
mongod
```

### Start Backend Server

```bash
cd backend
npm start
# Server runs on http://localhost:5000
```

The backend will automatically:
- Connect to MongoDB
- Start the cron job for monthly fee generation
- Initialize API routes

### Start Frontend Development Server

```bash
cd frontend_h/my-react-app
npm run dev
# Frontend runs on http://localhost:5173
```

### Create Super Admin (Initial Setup)

Run the seeder script to create the first super admin:

```bash
cd backend
npm run seed:users
```

**Default Super Admin Credentials:**
- Email: `superadmin@hostel.com`
- Password: `superadmin123`

⚠️ **Change this password immediately after first login!**

---

## 👥 User Roles

### 🎓 Student
- **Registration**: Sign up with email verification (OTP)
- **Capabilities**: Browse hostels, book rooms, pay fees, view roommates
- **Access**: Student dashboard and profile

### 👨‍💼 Hostel Admin
- **Registration**: Sign up with verification documents
- **Approval**: Requires super admin verification
- **Capabilities**: Manage hostel, rooms, students, fees, bookings
- **Access**: Admin dashboard with analytics

### 👑 Super Admin
- **Creation**: Manual database seeding
- **Capabilities**: Verify admins, monitor platform, manage access
- **Access**: Super admin dashboard

---

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### Register New User
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "role": "STUDENT" // or "ADMIN"
}
```

#### Verify OTP
```http
POST /auth/verify-otp
Content-Type: application/json

{
  "email": "john@example.com",
  "otp": "123456"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123"
}

Response:
{
  "accessToken": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "STUDENT"
  }
}
```

#### Refresh Access Token
```http
GET /auth/access-token
Cookie: refreshToken=<token>

Response:
{
  "accessToken": "new_jwt_token"
}
```

### Hostel Endpoints

#### Get All Hostels
```http
GET /hostels/all
```

#### Search Hostels
```http
GET /hostels/search?location=Kathmandu&maxPrice=5000&roomType=single
```

#### Create Hostel (Admin only)
```http
POST /hostels/create
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Sunrise Hostel",
  "address": "Thamel, Kathmandu",
  "location": {
    "type": "Point",
    "coordinates": [85.3240, 27.7172]
  }
}
```

### Room Endpoints

#### Get Available Rooms
```http
GET /rooms/available/:hostelId
```

#### Book Room (Student only)
```http
POST /rooms/book/:roomId
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "duration": 6,
  "moveInDate": "2026-03-01"
}
```

### Payment Endpoints

#### Initiate Khalti Payment
```http
POST /khalti/initiate
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "feeId": "fee_id_here"
}

Response:
{
  "pidx": "payment_id",
  "payment_url": "https://khalti.com/payment/...",
  "expires_in": "1800"
}
```

#### Verify Payment
```http
POST /khalti/verify
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "pidx": "payment_id",
  "fee_id": "fee_id_here",
  "transactionId": "khalti_transaction_id"
}
```

For complete API documentation, see the technical report artifact.

---

## 🗄️ Database Schema

### User Model
```javascript
{
  name: String,
  email: String (unique),
  passwordHash: String,
  role: Enum['SUPER_ADMIN', 'ADMIN', 'STUDENT'],
  approvalStatus: Enum['PENDING', 'APPROVED', 'REJECTED'],
  managedHostelId: ObjectId (ref: Hostel),
  roomId: ObjectId (ref: Room),
  hostelId: ObjectId (ref: Hostel),
  verificationDocuments: Array,
  isVerified: Boolean,
  bookingHistory: Array
}
```

### Hostel Model
```javascript
{
  name: String,
  address: String,
  adminId: ObjectId (ref: User),
  images: Array,
  location: GeoJSON Point (2dsphere indexed),
  isActive: Boolean
}
```

### Room Model
```javascript
{
  roomNumber: String,
  hostelId: ObjectId (ref: Hostel),
  price: Number,
  currentOccupancy: Number,
  maxCapacity: Number,
  type: String,
  images: Array,
  isActive: Boolean
}
```

### Booking Model
```javascript
{
  studentId: ObjectId (ref: User),
  roomId: ObjectId (ref: Room),
  hostelId: ObjectId (ref: Hostel),
  duration: Number,
  moveInDate: Date,
  endDate: Date,
  totalAmount: Number,
  status: Enum['PENDING', 'CONFIRMED', 'CANCELLED', 'EXPIRED']
}
```

### Fee Model
```javascript
{
  studentId: ObjectId (ref: User),
  hostelId: ObjectId (ref: Hostel),
  bookingId: ObjectId (ref: Booking),
  amountDue: Number,
  amountPaid: Number,
  status: Enum['PENDING', 'PAID', 'PARTIAL'],
  dueDate: Date,
  khaltiPidx: String,
  KhaltipaymentStatus: Enum['INITIATED', 'PAID'],
  paymentReference: Array,
  paidAt: Date
}
```

---

## 🔐 Security Features

### Authentication & Authorization
- ✅ **JWT-based authentication** with access and refresh tokens
- ✅ **HTTP-only cookies** for refresh tokens (prevents XSS)
- ✅ **Automatic token refresh** via Axios interceptors
- ✅ **Role-based access control** (RBAC) on frontend and backend
- ✅ **Password hashing** with bcrypt (10 salt rounds)
- ✅ **OTP email verification** for new registrations

### API Security
- ✅ **CORS configuration** for specific origins
- ✅ **Input validation** with Joi schemas
- ✅ **Protected routes** with authentication middleware
- ✅ **Rate limiting** (recommended for production)
- ✅ **SQL injection prevention** via Mongoose ODM

### Data Protection
- ✅ **Encrypted passwords** (never stored in plain text)
- ✅ **Secure cookie settings** (httpOnly, sameSite, secure)
- ✅ **Environment variable protection** (.env not committed)
- ✅ **Document upload validation** (file type, size limits)

---

## 💳 Payment Integration

### Khalti Payment Gateway

**Flow**:
1. Student selects unpaid fee
2. Frontend calls `/api/khalti/initiate`
3. Backend generates pidx and payment URL
4. Student redirects to Khalti payment page
5. After payment, Khalti redirects to `/payment/success?pidx=xxx`
6. Frontend calls `/api/khalti/verify` with pidx
7. Backend verifies with Khalti API
8. Updates fee status, confirms booking, updates room occupancy

**Test Credentials** (Khalti Sandbox):
- Test Number: `9800000000` to `9800000010`
- MPIN: `1111`
- OTP: `987654`

---

## 📁 Project Structure

```
hostel/
├── backend/
│   ├── controllers/        # Business logic (8 controllers)
│   ├── models/             # Mongoose schemas (8 models)
│   ├── routes/             # API endpoints (7 route files)
│   ├── middleware/         # Auth & upload middleware
│   ├── utils/              # Helper functions (JWT, OTP, validators)
│   ├── jobs/               # Cron jobs (fee scheduler)
│   ├── config/             # Database configuration
│   ├── constants/          # Environment constants
│   ├── seeders/            # Database seeders
│   ├── .env.example        # Environment template
│   ├── package.json
│   └── index.js            # Server entry point
│
├── frontend_h/my-react-app/
│   ├── src/
│   │   ├── pages/          # 26 route-based pages
│   │   │   ├── auth/       # Login, register, forgot password
│   │   │   ├── student/    # Student portal (9 pages)
│   │   │   ├── admin/      # Admin dashboard (10 pages)
│   │   │   ├── superadmin/ # Super admin panel
│   │   │   └── landing/    # Public pages
│   │   ├── components/     # Reusable components
│   │   │   ├── common/     # Navbar, protected routes, etc.
│   │   │   └── layout/     # Layout components
│   │   ├── services/       # API integration (Axios)
│   │   ├── hooks/          # Custom React hooks
│   │   ├── assets/         # Static assets
│   │   ├── App.jsx         # Root component with routing
│   │   ├── main.jsx        # React entry point
│   │   └── index.css       # Global styles
│   ├── .env.example        # Environment template
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── README.md               # This file
└── .gitignore
```

---

## 🔄 Automated Tasks

### Monthly Fee Generation

**Schedule**: Runs on the 1st of every month at midnight

**Process**:
1. Fetches all verified students with active room assignments
2. Calculates total due = room price + previous unpaid balance
3. Sets due date to 15th of current month
4. Creates Fee records in database
5. Prevents duplicate fee creation

**Configuration**: Edit `backend/jobs/feeScheduler.js` to modify schedule

```javascript
// Cron pattern: "minute hour day month dayOfWeek"
cron.schedule("0 0 1 * *", async () => { ... })
```

---

## 🧪 Testing

### Run Backend Tests
```bash
cd backend
npm test
```

### Run Frontend Tests
```bash
cd frontend_h/my-react-app
npm test
```

### Linting
```bash
# Frontend
npm run lint

# Backend
npm run lint
```

---

## 📦 Build for Production

### Build Frontend
```bash
cd frontend_h/my-react-app
npm run build
# Output: dist/ folder
```

### Serve Production Build
```bash
npm run preview
```

### Backend Production Setup
1. Set `NODE_ENV=production` in `.env`
2. Use PM2 or similar process manager:
```bash
npm install -g pm2
pm2 start index.js --name hostel-backend
pm2 save
pm2 startup
```

---

## 🚀 Deployment

### Recommended Platforms

**Backend**:
- [Heroku](https://www.heroku.com/)
- [Railway](https://railway.app/)
- [DigitalOcean App Platform](https://www.digitalocean.com/products/app-platform)
- [AWS EC2](https://aws.amazon.com/ec2/)

**Frontend**:
- [Vercel](https://vercel.com/) (recommended for Vite)
- [Netlify](https://www.netlify.com/)
- [Cloudflare Pages](https://pages.cloudflare.com/)

**Database**:
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (recommended)

### Deployment Checklist
- [ ] Update `FRONTEND_URL` and `ALLOWED_ORIGINS` to production domain
- [ ] Set secure `JWT_SECRET` and `REFRESH_TOKEN_SECRET`
- [ ] Configure production Khalti API key
- [ ] Set up MongoDB Atlas cluster
- [ ] Configure Cloudinary production account
- [ ] Set up SMTP email service
- [ ] Enable HTTPS/SSL certificates
- [ ] Set `NODE_ENV=production`
- [ ] Configure CORS for production domain
- [ ] Set up error logging (Winston, Sentry)
- [ ] Implement rate limiting
- [ ] Add Helmet.js for security headers

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add some AmazingFeature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/AmazingFeature
   ```
5. **Open a Pull Request**

### Contribution Guidelines
- Follow existing code style and conventions
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

---

## 📝 License

This project is licensed under the **ISC License**.

---

## 📞 Contact

**Project Author**: Shubham  
**GitHub**: [@Shubhamuu](https://github.com/Shubhamuu)  
**Repository**: [hostel_solutions](https://github.com/Shubhamuu/hostel_solutions)

For questions or support, please open an issue on GitHub.

---

## 🙏 Acknowledgments

- **React Team** for the amazing framework
- **Khalti** for payment gateway integration
- **Cloudinary** for image hosting services
- **MongoDB** for the flexible database solution
- **Tailwind CSS** for the beautiful utility-first CSS framework
- **All open-source contributors** whose libraries made this project possible

---

## 📈 Roadmap

### Upcoming Features
- [ ] Push notifications for booking confirmations
- [ ] PayPal integration for international payments
- [ ] Advanced analytics dashboard
- [ ] Student reviews and ratings
- [ ] Real-time chat between students and admins
- [ ] Mobile app (React Native)
- [ ] Multi-language support (i18n)
- [ ] AI-powered hostel recommendations
- [ ] Complaint management system
- [ ] Attendance tracking
- [ ] Leave management

---

## 🐛 Known Issues

- None currently reported

To report a bug, please [open an issue](https://github.com/Shubhamuu/hostel_solutions/issues).

---

## ⭐ Star the Project

If you find this project helpful, please consider giving it a ⭐ on GitHub!

---

**Built with ❤️ using the MERN Stack**

© 2026 Hostel Management System