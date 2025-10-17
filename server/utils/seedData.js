const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Clinic = require('../models/Clinic');
const HealthRecord = require('../models/HealthRecord');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-health', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const seedData = async () => {
  try {
    console.log('Starting database seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Clinic.deleteMany({});
    await HealthRecord.deleteMany({});

    // Create admin user
    const adminUser = new User({
      name: 'Admin User',
      age: 35,
      gender: 'male',
      aadhaar: '123456789012',
      phone: '9876543210',
      email: 'admin@smarthealth.com',
      password: 'admin123',
      role: 'admin',
      isVerified: true,
      address: {
        village: 'Admin Village',
        district: 'Admin District',
        state: 'Maharashtra',
        pincode: '400001'
      }
    });
    await adminUser.save();
    console.log('Admin user created');

    // Create doctor users
    const doctors = [
      {
        name: 'Dr. Rajesh Kumar',
        age: 45,
        gender: 'male',
        aadhaar: '234567890123',
        phone: '9876543211',
        email: 'rajesh@smarthealth.com',
        password: 'doctor123',
        role: 'doctor',
        isVerified: true,
        address: {
          village: 'Pune',
          district: 'Pune',
          state: 'Maharashtra',
          pincode: '411001'
        }
      },
      {
        name: 'Dr. Priya Sharma',
        age: 38,
        gender: 'female',
        aadhaar: '345678901234',
        phone: '9876543212',
        email: 'priya@smarthealth.com',
        password: 'doctor123',
        role: 'doctor',
        isVerified: true,
        address: {
          village: 'Mumbai',
          district: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001'
        }
      }
    ];

    const createdDoctors = await User.insertMany(doctors);
    console.log('Doctor users created');

    // Create patient users
    const patients = [
      {
        name: 'Ramesh Patil',
        age: 55,
        gender: 'male',
        aadhaar: '456789012345',
        phone: '9876543213',
        password: 'patient123',
        role: 'patient',
        isVerified: true,
        address: {
          village: 'Shirur',
          district: 'Pune',
          state: 'Maharashtra',
          pincode: '412210'
        },
        emergencyContact: {
          name: 'Sunita Patil',
          phone: '9876543214',
          relation: 'Wife'
        }
      },
      {
        name: 'Sunita Devi',
        age: 42,
        gender: 'female',
        aadhaar: '567890123456',
        phone: '9876543215',
        password: 'patient123',
        role: 'patient',
        isVerified: true,
        address: {
          village: 'Baramati',
          district: 'Pune',
          state: 'Maharashtra',
          pincode: '413102'
        },
        emergencyContact: {
          name: 'Mohan Devi',
          phone: '9876543216',
          relation: 'Husband'
        }
      },
      {
        name: 'Ganesh Jadhav',
        age: 28,
        gender: 'male',
        aadhaar: '678901234567',
        phone: '9876543217',
        password: 'patient123',
        role: 'patient',
        isVerified: true,
        address: {
          village: 'Indapur',
          district: 'Pune',
          state: 'Maharashtra',
          pincode: '413106'
        },
        emergencyContact: {
          name: 'Kavita Jadhav',
          phone: '9876543218',
          relation: 'Wife'
        }
      }
    ];

    const createdPatients = await User.insertMany(patients);
    console.log('Patient users created');

    // Create sample clinics
    const clinics = [
      {
        name: 'Rural Health Center Shirur',
        type: 'health_center',
        address: {
          street: 'Main Road',
          village: 'Shirur',
          district: 'Pune',
          state: 'Maharashtra',
          pincode: '412210',
          landmark: 'Near Bus Stand'
        },
        coordinates: {
          latitude: 18.8314,
          longitude: 74.3742
        },
        contact: {
          phone: '02137-234567',
          email: 'shirur.health@gov.in'
        },
        services: [
          { name: 'General Consultation', available: true },
          { name: 'Vaccination', available: true },
          { name: 'Basic Lab Tests', available: true }
        ],
        operatingHours: {
          monday: { open: '09:00', close: '17:00', closed: false },
          tuesday: { open: '09:00', close: '17:00', closed: false },
          wednesday: { open: '09:00', close: '17:00', closed: false },
          thursday: { open: '09:00', close: '17:00', closed: false },
          friday: { open: '09:00', close: '17:00', closed: false },
          saturday: { open: '09:00', close: '13:00', closed: false },
          sunday: { open: '', close: '', closed: true }
        },
        facilities: ['ambulance', 'emergency', 'lab'],
        verified: true
      },
      {
        name: 'Baramati District Hospital',
        type: 'hospital',
        address: {
          street: 'Hospital Road',
          village: 'Baramati',
          district: 'Pune',
          state: 'Maharashtra',
          pincode: '413102',
          landmark: 'Near Collector Office'
        },
        coordinates: {
          latitude: 18.1514,
          longitude: 74.5815
        },
        contact: {
          phone: '02112-220011',
          email: 'baramati.hospital@gov.in'
        },
        services: [
          { name: 'Emergency Services', available: true },
          { name: 'Surgery', available: true },
          { name: 'Maternity', available: true },
          { name: 'Pediatrics', available: true }
        ],
        operatingHours: {
          monday: { open: '00:00', close: '23:59', closed: false },
          tuesday: { open: '00:00', close: '23:59', closed: false },
          wednesday: { open: '00:00', close: '23:59', closed: false },
          thursday: { open: '00:00', close: '23:59', closed: false },
          friday: { open: '00:00', close: '23:59', closed: false },
          saturday: { open: '00:00', close: '23:59', closed: false },
          sunday: { open: '00:00', close: '23:59', closed: false }
        },
        facilities: ['ambulance', 'emergency', 'lab', 'pharmacy', 'icu'],
        verified: true
      },
      {
        name: 'Indapur Primary Health Center',
        type: 'clinic',
        address: {
          street: 'Pune Road',
          village: 'Indapur',
          district: 'Pune',
          state: 'Maharashtra',
          pincode: '413106',
          landmark: 'Near Post Office'
        },
        coordinates: {
          latitude: 18.1167,
          longitude: 75.0167
        },
        contact: {
          phone: '02111-234567',
          email: 'indapur.phc@gov.in'
        },
        services: [
          { name: 'General Medicine', available: true },
          { name: 'Child Health', available: true },
          { name: 'Women Health', available: true }
        ],
        operatingHours: {
          monday: { open: '08:00', close: '16:00', closed: false },
          tuesday: { open: '08:00', close: '16:00', closed: false },
          wednesday: { open: '08:00', close: '16:00', closed: false },
          thursday: { open: '08:00', close: '16:00', closed: false },
          friday: { open: '08:00', close: '16:00', closed: false },
          saturday: { open: '08:00', close: '12:00', closed: false },
          sunday: { open: '', close: '', closed: true }
        },
        facilities: ['lab', 'pharmacy'],
        verified: true
      }
    ];

    await Clinic.insertMany(clinics);
    console.log('Sample clinics created');

    // Create sample health records
    const healthRecords = [
      {
        userId: createdPatients[0]._id,
        doctorId: createdDoctors[0]._id,
        checkupDate: new Date('2024-01-15'),
        vitalSigns: {
          bloodPressure: { systolic: 140, diastolic: 90 },
          bloodSugar: { fasting: 110, postMeal: 160 },
          heartRate: 78,
          temperature: 98.6,
          oxygenSaturation: 98
        },
        physicalMeasurements: {
          height: 165,
          weight: 70,
          bmi: 25.7
        },
        examinations: {
          eyeVision: {
            leftEye: '6/6',
            rightEye: '6/9',
            notes: 'Slight weakness in right eye'
          },
          generalExamination: {
            notes: 'Overall good health'
          }
        },
        diagnosis: {
          primary: 'Hypertension',
          secondary: ['Pre-diabetes']
        },
        medications: [
          {
            name: 'Amlodipine',
            dosage: '5mg',
            frequency: 'once daily',
            duration: '30 days',
            instructions: 'Take in the morning with food'
          }
        ],
        recommendations: {
          lifestyle: ['Reduce salt intake', 'Regular exercise', 'Weight management'],
          followUp: {
            required: true,
            date: new Date('2024-02-15'),
            reason: 'Blood pressure monitoring'
          }
        },
        doctorRemarks: 'Patient shows signs of hypertension. Lifestyle changes recommended along with medication.',
        status: 'completed'
      }
    ];

    await HealthRecord.insertMany(healthRecords);
    console.log('Sample health records created');

    console.log('Database seeding completed successfully!');
    console.log('\nDefault login credentials:');
    console.log('Admin: Phone: 9876543210, Password: admin123');
    console.log('Doctor: Phone: 9876543211, Password: doctor123');
    console.log('Patient: Phone: 9876543213, Password: patient123');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the seeding
seedData();