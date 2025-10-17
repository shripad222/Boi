# Smart Health Rural Connect - Installation Guide

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **MongoDB** (v5 or higher) - [Download here](https://www.mongodb.com/try/download/community)
- **Git** - [Download here](https://git-scm.com/)

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd smart-health-rural-connect
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install all dependencies (client + server)
npm run install-all
```

### 3. Environment Setup

#### Server Environment Variables

Create a `.env` file in the `server` directory:

```bash
cd server
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
MONGODB_URI=mongodb://localhost:27017/smart-health
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890
PORT=5000
NODE_ENV=development
```

#### Client Environment Variables

Create a `.env` file in the `client` directory:

```bash
cd ../client
cp .env.example .env
```

Edit the `.env` file:

```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

### 4. Database Setup

#### Start MongoDB

**Windows:**
```bash
# If MongoDB is installed as a service
net start MongoDB

# Or run manually
mongod --dbpath "C:\data\db"
```

**macOS/Linux:**
```bash
# If installed via package manager
sudo systemctl start mongod

# Or run manually
mongod --dbpath /usr/local/var/mongodb
```

#### Seed Sample Data

```bash
cd server
npm run seed
```

This will create sample users, clinics, and health records for testing.

### 5. Start the Application

#### Option 1: Start Both Services Together (Recommended)

```bash
# From the root directory
npm run dev
```

This will start both the backend server (port 5000) and frontend client (port 3000).

#### Option 2: Start Services Separately

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm start
```

### 6. Access the Application

Open your browser and navigate to:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000

## Default Login Credentials

After seeding the database, you can use these credentials:

| Role | Phone | Password |
|------|-------|----------|
| Admin | 9876543210 | admin123 |
| Doctor | 9876543211 | doctor123 |
| Patient | 9876543213 | patient123 |

## API Configuration

### Twilio Setup (SMS & Voice)

1. Sign up at [Twilio](https://www.twilio.com/)
2. Get your Account SID and Auth Token from the console
3. Purchase a phone number for SMS/Voice
4. Update the `.env` file with your credentials

**Note:** The app works without Twilio - it will simulate SMS/Voice in development mode.

### Google Maps Setup (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Maps JavaScript API
4. Create an API key
5. Update the client `.env` file

**Note:** The app uses OpenStreetMap as fallback if Google Maps is not configured.

## Production Deployment

### Environment Variables for Production

Update your production environment variables:

```env
# Server
NODE_ENV=production
MONGODB_URI=mongodb://your-production-db-url
JWT_SECRET=your-production-jwt-secret
CLIENT_URL=https://your-frontend-domain.com

# Client
REACT_APP_API_URL=https://your-backend-domain.com
```

### Build for Production

```bash
# Build the client
cd client
npm run build

# The build files will be in client/build/
```

### Deployment Options

#### Option 1: Traditional Hosting

1. **Backend:** Deploy to services like Heroku, DigitalOcean, AWS EC2
2. **Frontend:** Deploy to Netlify, Vercel, or serve from your backend
3. **Database:** Use MongoDB Atlas or self-hosted MongoDB

#### Option 2: Docker Deployment

Create `Dockerfile` in server directory:

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

Create `docker-compose.yml` in root:

```yaml
version: '3.8'
services:
  mongodb:
    image: mongo:5
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
  
  backend:
    build: ./server
    ports:
      - "5000:5000"
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/smart-health
    depends_on:
      - mongodb
  
  frontend:
    build: ./client
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  mongodb_data:
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check the connection string in `.env`
   - Verify network connectivity

2. **Port Already in Use**
   ```bash
   # Kill process on port 3000 or 5000
   npx kill-port 3000
   npx kill-port 5000
   ```

3. **Module Not Found Errors**
   ```bash
   # Clear node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **CORS Issues**
   - Ensure the client URL is correctly configured in server
   - Check that both services are running on expected ports

### Performance Optimization

1. **Database Indexing**
   - Indexes are automatically created by the models
   - Monitor query performance in production

2. **Caching**
   - Implement Redis for session storage in production
   - Cache frequently accessed data

3. **File Storage**
   - Use cloud storage (AWS S3, Cloudinary) for reports and images
   - Implement CDN for static assets

## Development Guidelines

### Code Structure

```
smart-health-rural-connect/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts
│   │   ├── services/      # API services
│   │   ├── i18n/         # Internationalization
│   │   └── utils/        # Utility functions
│   └── package.json
├── server/                # Node.js backend
│   ├── controllers/       # Route controllers
│   ├── middleware/       # Custom middleware
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── utils/           # Utility functions
│   └── server.js        # Main server file
└── package.json         # Root package.json
```

### Adding New Features

1. **Backend:**
   - Create model in `server/models/`
   - Add routes in `server/routes/`
   - Update API documentation

2. **Frontend:**
   - Create components in `client/src/components/`
   - Add pages in `client/src/pages/`
   - Update navigation and routing

### Testing

```bash
# Run backend tests (if implemented)
cd server
npm test

# Run frontend tests
cd client
npm test
```

## Support

For issues and questions:

1. Check the troubleshooting section above
2. Review the application logs
3. Ensure all dependencies are properly installed
4. Verify environment variables are correctly set

## Security Considerations

1. **JWT Secrets:** Use strong, random secrets in production
2. **Database:** Enable authentication and use strong passwords
3. **HTTPS:** Always use HTTPS in production
4. **Input Validation:** All inputs are validated on both client and server
5. **Rate Limiting:** API rate limiting is implemented
6. **CORS:** Configure CORS properly for your domain

## License

This project is licensed under the MIT License - see the LICENSE file for details.