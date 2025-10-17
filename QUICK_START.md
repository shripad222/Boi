# Smart Health Rural Connect - Quick Start Guide

## 🚀 Simple Setup (5 Minutes)

### Prerequisites
- **Node.js** (v16+) - [Download here](https://nodejs.org/)
- **Git** - [Download here](https://git-scm.com/)

### 1. Clone & Install

```bash
# Clone the repository
git clone <your-repo-url>
cd smart-health-rural-connect

# Install all dependencies
npm run install-all
```

### 2. Environment Setup (Already Configured!)

The environment files are already set up with your MongoDB Atlas and Twilio credentials:

**Server (.env):**
- ✅ MongoDB Atlas connection configured
- ✅ Twilio SMS/OTP service configured  
- ✅ JWT secret set

**Client (.env):**
- ✅ API URL configured for local development

### 3. Seed Database

```bash
cd server
npm run seed
```

This creates sample data including:
- Admin user: 9876543210 / admin123
- Doctor user: 9876543211 / doctor123  
- Patient user: 9876543213 / patient123
- Sample clinics and health records

### 4. Start Application

```bash
# From root directory - starts both frontend and backend
npm run dev
```

**OR start separately:**

```bash
# Terminal 1 - Backend (Port 5000)
cd server
npm run dev

# Terminal 2 - Frontend (Port 3000)  
cd client
npm start
```

### 5. Access Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000

## 🎯 Test the Application

### 1. Login with Demo Credentials
- **Patient:** Phone: 9876543213, Password: patient123
- **Doctor:** Phone: 9876543211, Password: doctor123
- **Admin:** Phone: 9876543210, Password: admin123

### 2. Test OTP Verification
- Register a new user with your phone number (+917558498271)
- You'll receive a real SMS OTP via Twilio
- Enter the OTP to complete registration

### 3. Explore Features
- **Dashboard:** View health statistics and trends
- **Queue Management:** Add patients to queue (Admin/Doctor)
- **Health Forms:** Create health records (Doctor)
- **Reports:** Generate PDF reports with QR codes
- **Maps:** Find nearby healthcare facilities
- **Multi-language:** Switch between English/Hindi/Marathi

## 🔧 Configuration Details

### MongoDB Atlas
- **Connection:** Already configured with your cluster
- **Database:** `smart-health`
- **Collections:** Users, HealthRecords, Queue, Reminders, Clinics

### Twilio Integration
- **Account SID:** ACe52c4063158837fe602ee57910e0be27
- **Auth Token:** 091b68fd09cc77f203fad0a4d9eee35a
- **Verify Service:** VA2f440e5e24ad936e98a94423920d2d6f
- **Features:** SMS OTP, Voice calls, Reminders

### API Endpoints
```
POST /api/auth/register     - User registration
POST /api/auth/login        - User login  
POST /api/auth/verify-otp   - OTP verification
GET  /api/users/dashboard   - Dashboard data
POST /api/health            - Create health record
GET  /api/queue/:campId     - Get queue status
POST /api/reports/generate  - Generate PDF report
GET  /api/clinics/nearby    - Find nearby clinics
```

## 📱 Mobile Testing

The app is mobile-responsive. Test on:
- Chrome DevTools (F12 → Device Mode)
- Real mobile devices
- Different screen sizes

## 🌍 Multi-language Testing

Switch languages using the navbar dropdown:
- **EN** - English
- **हिं** - Hindi  
- **मर** - Marathi

## 🔍 Troubleshooting

### Common Issues:

1. **Port already in use:**
   ```bash
   npx kill-port 3000
   npx kill-port 5000
   ```

2. **MongoDB connection error:**
   - Check internet connection
   - Verify MongoDB Atlas cluster is running

3. **Twilio OTP not received:**
   - Check phone number format (+917558498271)
   - Verify Twilio account balance
   - Check spam/blocked messages

4. **Module not found:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

## 🎉 Ready to Use!

Your Smart Health Rural Connect application is now ready with:

- ✅ Real MongoDB Atlas database
- ✅ Working Twilio SMS/OTP
- ✅ Complete MERN stack
- ✅ Multi-language support
- ✅ Mobile-responsive design
- ✅ Real-time queue updates
- ✅ PDF report generation
- ✅ Healthcare maps integration

## 📞 Support

If you encounter any issues:
1. Check the console logs (F12 in browser)
2. Verify all services are running
3. Check network connectivity
4. Ensure environment variables are loaded

The application is production-ready and can be deployed to platforms like Heroku, Vercel, or Netlify with minimal changes.