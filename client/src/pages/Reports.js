import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { healthService } from '../services/healthService';
import QRCode from 'qrcode.react';

const Reports = () => {
  const { t } = useTranslation();
  const { user, isPatient } = useAuth();
  const [reports, setReports] = useState([]);
  const [healthRecords, setHealthRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchReports();
    if (!isPatient) {
      fetchHealthRecords();
    }
  }, []);

  const fetchReports = async () => {
    try {
      const userId = isPatient ? user._id : undefined;
      const data = await healthService.getUserReports(userId || user._id);
      setReports(data.reports || []);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      setError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const fetchHealthRecords = async () => {
    try {
      const data = await healthService.getHealthRecords({ limit: 50 });
      setHealthRecords(data.healthRecords || []);
    } catch (error) {
      console.error('Failed to fetch health records:', error);
    }
  };

  const generateReport = async (healthRecordId) => {
    setGenerating(prev => ({ ...prev, [healthRecordId]: true }));
    setError('');

    try {
      const result = await healthService.generateReport(healthRecordId);
      setSuccess('Report generated successfully!');
      fetchReports();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to generate report');
    } finally {
      setGenerating(prev => ({ ...prev, [healthRecordId]: false }));
    }
  };

  const downloadReport = (filename) => {
    const url = healthService.downloadReport(filename);
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="container reports-container fade-in">
      <div className="card-header text-center">
        <h1 className="card-title">{t('reports.healthReports')}</h1>
        <p>View and download your health reports</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Generated Reports */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Generated Reports</h3>
        </div>

        {reports.length === 0 ? (
          <div className="text-center p-20">
            <p>{t('reports.noReports')}</p>
          </div>
        ) : (
          <div className="reports-grid">
            {reports.map((report) => (
              <div key={report._id} className="report-card">
                <div className="report-date">
                  {new Date(report.checkupDate).toLocaleDateString()}
                </div>
                
                <div className="report-diagnosis">
                  {report.diagnosis?.primary || 'General Checkup'}
                </div>
                
                <div className="report-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={() => downloadReport(report.reportUrl?.split('/').pop())}
                  >
                    📄 {t('reports.downloadReport')}
                  </button>
                  
                  <button
                    className="btn btn-secondary"
                    onClick={() => window.open(`/report/${report._id}`, '_blank')}
                  >
                    🔗 {t('reports.digitalReport')}
                  </button>
                </div>

                {report.qrCode && (
                  <div className="text-center mt-20">
                    <p style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                      {t('reports.scanQR')}
                    </p>
                    <QRCode 
                      value={`${window.location.origin}/report/${report._id}`}
                      size={100}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Health Records (for doctors/admins to generate reports) */}
      {!isPatient && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Health Records</h3>
            <p>Generate reports for completed health records</p>
          </div>

          {healthRecords.length === 0 ? (
            <div className="text-center p-20">
              <p>No health records found</p>
            </div>
          ) : (
            <div className="queue-list">
              {healthRecords.map((record) => (
                <div key={record._id} className="queue-item">
                  <div className="queue-patient-info">
                    <div className="queue-patient-name">
                      {record.userId?.name || 'Unknown Patient'}
                    </div>
                    <div className="queue-patient-details">
                      Date: {new Date(record.checkupDate).toLocaleDateString()} |
                      Doctor: {record.doctorId?.name} |
                      Diagnosis: {record.diagnosis?.primary || 'N/A'}
                    </div>
                  </div>

                  <div className={`queue-status ${record.reportGenerated ? 'completed' : 'waiting'}`}>
                    {record.reportGenerated ? 'Report Generated' : 'Pending'}
                  </div>

                  <div className="queue-actions">
                    {!record.reportGenerated ? (
                      <button
                        className="btn btn-success"
                        onClick={() => generateReport(record._id)}
                        disabled={generating[record._id]}
                      >
                        {generating[record._id] ? 'Generating...' : t('reports.generateReport')}
                      </button>
                    ) : (
                      <>
                        <button
                          className="btn btn-secondary"
                          onClick={() => downloadReport(record.reportUrl?.split('/').pop())}
                        >
                          📄 Download
                        </button>
                        <button
                          className="btn btn-secondary"
                          onClick={() => window.open(`/report/${record._id}`, '_blank')}
                        >
                          🔗 View Digital
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-3">
        <div className="stat-card">
          <div className="stat-number">{reports.length}</div>
          <div className="stat-label">Total Reports</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-number">
            {reports.filter(r => new Date(r.checkupDate) > new Date(Date.now() - 30*24*60*60*1000)).length}
          </div>
          <div className="stat-label">Last 30 Days</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-number">
            {reports.filter(r => new Date(r.checkupDate) > new Date(Date.now() - 365*24*60*60*1000)).length}
          </div>
          <div className="stat-label">This Year</div>
        </div>
      </div>
    </div>
  );
};

export default Reports;