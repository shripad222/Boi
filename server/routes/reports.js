const express = require('express');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const HealthRecord = require('../models/HealthRecord');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Ensure reports directory exists
const reportsDir = path.join(__dirname, '../reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// Generate health report PDF
router.post('/generate/:healthRecordId', auth, authorize('doctor'), async (req, res) => {
  try {
    const { healthRecordId } = req.params;
    
    const healthRecord = await HealthRecord.findById(healthRecordId)
      .populate('userId', 'name age gender phone address')
      .populate('doctorId', 'name');

    if (!healthRecord) {
      return res.status(404).json({ message: 'Health record not found' });
    }

    // Check if doctor owns this record
    if (healthRecord.doctorId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Generate QR code for digital report
    const reportUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/report/${healthRecordId}`;
    const qrCodeDataUrl = await QRCode.toDataURL(reportUrl);

    // Create PDF
    const doc = new PDFDocument({ margin: 50 });
    const filename = `health-report-${healthRecordId}-${Date.now()}.pdf`;
    const filepath = path.join(reportsDir, filename);

    // Pipe PDF to file
    doc.pipe(fs.createWriteStream(filepath));

    // Add header
    doc.fontSize(20).text('Smart Health Rural Connect', { align: 'center' });
    doc.fontSize(16).text('Health Report', { align: 'center' });
    doc.moveDown();

    // Patient Information
    doc.fontSize(14).text('Patient Information', { underline: true });
    doc.fontSize(12);
    doc.text(`Name: ${healthRecord.userId.name}`);
    doc.text(`Age: ${healthRecord.userId.age} years`);
    doc.text(`Gender: ${healthRecord.userId.gender}`);
    doc.text(`Phone: ${healthRecord.userId.phone}`);
    doc.text(`Date of Checkup: ${healthRecord.checkupDate.toLocaleDateString()}`);
    doc.text(`Doctor: ${healthRecord.doctorId.name}`);
    doc.moveDown();

    // Vital Signs
    if (healthRecord.vitalSigns) {
      doc.fontSize(14).text('Vital Signs', { underline: true });
      doc.fontSize(12);
      
      if (healthRecord.vitalSigns.bloodPressure.systolic) {
        doc.text(`Blood Pressure: ${healthRecord.vitalSigns.bloodPressure.systolic}/${healthRecord.vitalSigns.bloodPressure.diastolic} mmHg`);
      }
      
      if (healthRecord.vitalSigns.bloodSugar.fasting) {
        doc.text(`Blood Sugar (Fasting): ${healthRecord.vitalSigns.bloodSugar.fasting} mg/dL`);
      }
      
      if (healthRecord.vitalSigns.bloodSugar.postMeal) {
        doc.text(`Blood Sugar (Post Meal): ${healthRecord.vitalSigns.bloodSugar.postMeal} mg/dL`);
      }
      
      if (healthRecord.vitalSigns.heartRate) {
        doc.text(`Heart Rate: ${healthRecord.vitalSigns.heartRate} bpm`);
      }
      
      if (healthRecord.vitalSigns.temperature) {
        doc.text(`Temperature: ${healthRecord.vitalSigns.temperature}°F`);
      }
      
      if (healthRecord.vitalSigns.oxygenSaturation) {
        doc.text(`Oxygen Saturation: ${healthRecord.vitalSigns.oxygenSaturation}%`);
      }
      
      doc.moveDown();
    }

    // Physical Measurements
    if (healthRecord.physicalMeasurements) {
      doc.fontSize(14).text('Physical Measurements', { underline: true });
      doc.fontSize(12);
      
      if (healthRecord.physicalMeasurements.height) {
        doc.text(`Height: ${healthRecord.physicalMeasurements.height} cm`);
      }
      
      if (healthRecord.physicalMeasurements.weight) {
        doc.text(`Weight: ${healthRecord.physicalMeasurements.weight} kg`);
      }
      
      if (healthRecord.physicalMeasurements.bmi) {
        doc.text(`BMI: ${healthRecord.physicalMeasurements.bmi}`);
      }
      
      doc.moveDown();
    }

    // Diagnosis
    if (healthRecord.diagnosis.primary) {
      doc.fontSize(14).text('Diagnosis', { underline: true });
      doc.fontSize(12);
      doc.text(`Primary: ${healthRecord.diagnosis.primary}`);
      
      if (healthRecord.diagnosis.secondary.length > 0) {
        doc.text(`Secondary: ${healthRecord.diagnosis.secondary.join(', ')}`);
      }
      
      doc.moveDown();
    }

    // Medications
    if (healthRecord.medications && healthRecord.medications.length > 0) {
      doc.fontSize(14).text('Prescribed Medications', { underline: true });
      doc.fontSize(12);
      
      healthRecord.medications.forEach((med, index) => {
        doc.text(`${index + 1}. ${med.name} - ${med.dosage}`);
        doc.text(`   Frequency: ${med.frequency}`);
        doc.text(`   Duration: ${med.duration}`);
        if (med.instructions) {
          doc.text(`   Instructions: ${med.instructions}`);
        }
        doc.moveDown(0.5);
      });
    }

    // Recommendations
    if (healthRecord.recommendations) {
      doc.fontSize(14).text('Recommendations', { underline: true });
      doc.fontSize(12);
      
      if (healthRecord.recommendations.lifestyle.length > 0) {
        doc.text('Lifestyle Changes:');
        healthRecord.recommendations.lifestyle.forEach((item, index) => {
          doc.text(`• ${item}`);
        });
      }
      
      if (healthRecord.recommendations.followUp.required) {
        doc.text(`Follow-up Required: ${healthRecord.recommendations.followUp.date ? 
          new Date(healthRecord.recommendations.followUp.date).toLocaleDateString() : 'As needed'}`);
        if (healthRecord.recommendations.followUp.reason) {
          doc.text(`Reason: ${healthRecord.recommendations.followUp.reason}`);
        }
      }
      
      doc.moveDown();
    }

    // Doctor's Remarks
    if (healthRecord.doctorRemarks) {
      doc.fontSize(14).text('Doctor\'s Remarks', { underline: true });
      doc.fontSize(12);
      doc.text(healthRecord.doctorRemarks);
      doc.moveDown();
    }

    // Add QR Code
    doc.fontSize(14).text('Digital Report Access', { underline: true });
    doc.fontSize(12);
    doc.text('Scan the QR code below to access the digital version of this report:');
    
    // Convert base64 QR code to buffer and add to PDF
    const qrBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');
    doc.image(qrBuffer, { width: 100, height: 100 });
    
    doc.moveDown();
    doc.fontSize(10).text(`Report ID: ${healthRecordId}`);
    doc.text(`Generated on: ${new Date().toLocaleString()}`);

    // Finalize PDF
    doc.end();

    // Wait for PDF to be written
    await new Promise((resolve) => {
      doc.on('end', resolve);
    });

    // Update health record with report info
    healthRecord.reportGenerated = true;
    healthRecord.reportUrl = `/api/reports/download/${filename}`;
    healthRecord.qrCode = qrCodeDataUrl;
    await healthRecord.save();

    res.json({
      message: 'Report generated successfully',
      reportUrl: healthRecord.reportUrl,
      qrCode: qrCodeDataUrl,
      filename
    });

  } catch (error) {
    logger.error('Generate report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Download report
router.get('/download/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filepath = path.join(reportsDir, filename);

    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.download(filepath, filename, (err) => {
      if (err) {
        logger.error('Download error:', err);
        res.status(500).json({ message: 'Error downloading report' });
      }
    });

  } catch (error) {
    logger.error('Download report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get digital report (for QR code access)
router.get('/digital/:healthRecordId', async (req, res) => {
  try {
    const { healthRecordId } = req.params;
    
    const healthRecord = await HealthRecord.findById(healthRecordId)
      .populate('userId', 'name age gender phone')
      .populate('doctorId', 'name');

    if (!healthRecord) {
      return res.status(404).json({ message: 'Health record not found' });
    }

    // Return digital report data
    res.json({
      patient: {
        name: healthRecord.userId.name,
        age: healthRecord.userId.age,
        gender: healthRecord.userId.gender
      },
      checkupDate: healthRecord.checkupDate,
      doctor: healthRecord.doctorId.name,
      vitalSigns: healthRecord.vitalSigns,
      physicalMeasurements: healthRecord.physicalMeasurements,
      diagnosis: healthRecord.diagnosis,
      medications: healthRecord.medications,
      recommendations: healthRecord.recommendations,
      doctorRemarks: healthRecord.doctorRemarks,
      reportGenerated: healthRecord.reportGenerated
    });

  } catch (error) {
    logger.error('Get digital report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's reports
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check authorization
    if (req.user.role === 'patient' && userId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const reports = await HealthRecord.find({
      userId,
      reportGenerated: true
    })
    .populate('doctorId', 'name')
    .select('checkupDate reportUrl qrCode diagnosis.primary')
    .sort({ checkupDate: -1 });

    res.json({ reports });

  } catch (error) {
    logger.error('Get user reports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;