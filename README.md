# Smart Health Rural Connect

A smart and affordable digital health tracking system designed for rural and semi-urban areas.

## Features

- 🏥 Health Camp Queue Management
- 📊 Health Parameter Tracking
- 📱 SMS & Voice Reminders
- 🗺️ Healthcare Directory with Maps
- 📄 PDF Health Reports with QR Codes
- 🌐 Offline Functionality
- 🌍 Multi-language Support
- 👥 Role-based Access (Patient, Doctor, Admin)

## Tech Stack

- **Frontend**: React.js
- **Backend**: Node.js + Express.js
- **Database**: MongoDB
- **Real-time**: Socket.io
- **SMS/Voice**: Twilio API
- **Maps**: Google Maps API

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm run install-all
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env` in both client and server folders
   - Fill in your API keys and database URLs

4. Start the development servers:
   ```bash
   npm run dev
   ```

## Environment Variables

### Server (.env)
```
MONGODB_URI=mongodb://localhost:27017/smart-health
JWT_SECRET=your-jwt-secret
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=your-twilio-phone
PORT=5000
```

### Client (.env)
```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_GOOGLE_MAPS_API_KEY=your-google-maps-key
```

## Project Structure

```
smart-health-rural-connect/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── utils/
│   │   └── styles/
│   └── package.json
├── server/                 # Node.js backend
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   └── server.js
└── package.json
```

## Usage

1. **Admin/Assistant**: Register users during health camps
2. **Queue System**: Automatic patient queuing with real-time updates
3. **Doctor Dashboard**: Health checkup forms and report generation
4. **Patient Dashboard**: View health records and trends
5. **Reminders**: Automated SMS and voice call reminders
6. **Maps**: Find nearby healthcare facilities

## License

MIT License