import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { healthService } from '../services/healthService';
import QRCode from 'qrcode.react';

const DigitalReport = () => {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    try {
      const data = await healthService.getDigitalReport(id);
      setReport(data);
    } catch (error) {
      console.error('Failed to fetch report:', error);
      setError('Report not found or access denied');
    } finally {
      setLoading(false);
    }
  };

  const printReport = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="alert alert-error">
          <h2>Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="container">
        <div className="alert alert-error">
          <h2>Report Not Found</h2>
          <p>The requested health report could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '800px', margin: '2rem auto' }}>
      <div className="card fade-in">
        {/* Header */}
        <div className="text-center" style={{ marginBottom: '2rem' }}>
          <h1 style={{ color: '#007bff', marginBottom: '0.5rem' }}>
            Smart Health Rural Connect
          </h1>
          <h2 style={{ color: '#333', marginBottom: '1rem' }}>
            Digital Health Report
          </h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>Report ID:</strong> {id}
            </div>
            <div>
              <button className="btn btn-secondary" onClick={printReport}>
                🖨️ Print Report
              </button>
            </div>
          </div>
        </div>

        {/* Patient Information */}
        <div className="form-section">
          <h3 className="form-section-title">Patient Information</h3>
          <div className="form-row">
            <div className="form-group">
              <strong>Name:</strong> {report.patient.name}
            </div>
            <div className="form-group">
              <strong>Age:</strong> {report.patient.age} years
            </div>
            <div className="form-group">
              <strong>Gender:</strong> {report.patient.gender}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <strong>Checkup Date:</strong> {new Date(report.checkupDate).toLocaleDateString()}
            </div>
            <div className="form-group">
              <strong>Doctor:</strong> {report.doctor}
            </div>
          </div>
        </div>

        {/* Vital Signs */}
        {report.vitalSigns && Object.keys(report.vitalSigns).some(key => 
          report.vitalSigns[key] && (typeof report.vitalSigns[key] === 'object' ? 
            Object.values(report.vitalSigns[key]).some(v => v) : 
            report.vitalSigns[key])
        ) && (
          <div className="form-section">
            <h3 className="form-section-title">Vital Signs</h3>
            <div className="grid grid-2">
              {report.vitalSigns.bloodPressure?.systolic && (
                <div>
                  <strong>Blood Pressure:</strong> {report.vitalSigns.bloodPressure.systolic}/{report.vitalSigns.bloodPressure.diastolic} mmHg
                </div>
              )}
              {report.vitalSigns.bloodSugar?.fasting && (
                <div>
                  <strong>Blood Sugar (Fasting):</strong> {report.vitalSigns.bloodSugar.fasting} mg/dL
                </div>
              )}
              {report.vitalSigns.bloodSugar?.postMeal && (
                <div>
                  <strong>Blood Sugar (Post Meal):</strong> {report.vitalSigns.bloodSugar.postMeal} mg/dL
                </div>
              )}
              {report.vitalSigns.heartRate && (
                <div>
                  <strong>Heart Rate:</strong> {report.vitalSigns.heartRate} bpm
                </div>
              )}
              {report.vitalSigns.temperature && (
                <div>
                  <strong>Temperature:</strong> {report.vitalSigns.temperature}°F
                </div>
              )}
              {report.vitalSigns.oxygenSaturation && (
                <div>
                  <strong>Oxygen Saturation:</strong> {report.vitalSigns.oxygenSaturation}%
                </div>
              )}
            </div>
          </div>
        )}

        {/* Physical Measurements */}
        {report.physicalMeasurements && (report.physicalMeasurements.height || report.physicalMeasurements.weight) && (
          <div className="form-section">
            <h3 className="form-section-title">Physical Measurements</h3>
            <div className="grid grid-3">
              {report.physicalMeasurements.height && (
                <div>
                  <strong>Height:</strong> {report.physicalMeasurements.height} cm
                </div>
              )}
              {report.physicalMeasurements.weight && (
                <div>
                  <strong>Weight:</strong> {report.physicalMeasurements.weight} kg
                </div>
              )}
              {report.physicalMeasurements.bmi && (
                <div>
                  <strong>BMI:</strong> {report.physicalMeasurements.bmi}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Diagnosis */}
        {report.diagnosis && (report.diagnosis.primary || report.diagnosis.secondary?.length > 0) && (
          <div className="form-section">
            <h3 className="form-section-title">Diagnosis</h3>
            {report.diagnosis.primary && (
              <div style={{ marginBottom: '1rem' }}>
                <strong>Primary Diagnosis:</strong> {report.diagnosis.primary}
              </div>
            )}
            {report.diagnosis.secondary && report.diagnosis.secondary.length > 0 && (
              <div>
                <strong>Secondary Diagnosis:</strong> {report.diagnosis.secondary.join(', ')}
              </div>
            )}
          </div>
        )}

        {/* Medications */}
        {report.medications && report.medications.length > 0 && (
          <div className="form-section">
            <h3 className="form-section-title">Prescribed Medications</h3>
            {report.medications.map((med, index) => (
              <div key={index} className="card" style={{ marginBottom: '1rem', padding: '1rem' }}>
                <div><strong>Medicine:</strong> {med.name}</div>
                <div><strong>Dosage:</strong> {med.dosage}</div>
                <div><strong>Frequency:</strong> {med.frequency}</div>
                <div><strong>Duration:</strong> {med.duration}</div>
                {med.instructions && (
                  <div><strong>Instructions:</strong> {med.instructions}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Recommendations */}
        {report.recommendations && (
          report.recommendations.lifestyle?.length > 0 || 
          report.recommendations.followUp?.required ||
          report.recommendations.referral?.required
        ) && (
          <div className="form-section">
            <h3 className="form-section-title">Recommendations</h3>
            
            {report.recommendations.lifestyle && report.recommendations.lifestyle.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <strong>Lifestyle Changes:</strong>
                <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                  {report.recommendations.lifestyle.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {report.recommendations.followUp?.required && (
              <div style={{ marginBottom: '1rem' }}>
                <strong>Follow-up Required:</strong> {
                  report.recommendations.followUp.date ? 
                    new Date(report.recommendations.followUp.date).toLocaleDateString() : 
                    'As needed'
                }
                {report.recommendations.followUp.reason && (
                  <div><strong>Reason:</strong> {report.recommendations.followUp.reason}</div>
                )}
              </div>
            )}

            {report.recommendations.referral?.required && (
              <div>
                <strong>Referral Required:</strong> {report.recommendations.referral.specialist}
                <div><strong>Reason:</strong> {report.recommendations.referral.reason}</div>
                <div><strong>Urgency:</strong> {report.recommendations.referral.urgency}</div>
              </div>
            )}
          </div>
        )}

        {/* Doctor's Remarks */}
        {report.doctorRemarks && (
          <div className="form-section">
            <h3 className="form-section-title">Doctor's Remarks</h3>
            <p>{report.doctorRemarks}</p>
          </div>
        )}

        {/* QR Code */}
        <div className="form-section text-center">
          <h3 className="form-section-title">Digital Access</h3>
          <p>Scan this QR code to access this report anytime:</p>
          <div style={{ display: 'flex', justifyContent: 'center', margin: '1rem 0' }}>
            <QRCode 
              value={window.location.href}
              size={150}
            />
          </div>
          <p style={{ fontSize: '0.9rem', color: '#666' }}>
            Report URL: {window.location.href}
          </p>
        </div>

        {/* Footer */}
        <div className="text-center" style={{ marginTop: '2rem', padding: '1rem', borderTop: '1px solid #eee' }}>
          <p style={{ fontSize: '0.9rem', color: '#666' }}>
            Generated on: {new Date().toLocaleString()}<br/>
            Smart Health Rural Connect - Digital Healthcare for Rural Areas
          </p>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .btn {
            display: none !important;
          }
          
          .container {
            max-width: none !important;
            margin: 0 !important;
          }
          
          .card {
            box-shadow: none !important;
            border: 1px solid #ddd !important;
          }
          
          body {
            font-size: 12px !important;
          }
          
          h1, h2, h3 {
            color: #000 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default DigitalReport;