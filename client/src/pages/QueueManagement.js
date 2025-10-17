import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { healthService } from '../services/healthService';
import { userService } from '../services/userService';

const QueueManagement = () => {
  const { t } = useTranslation();
  const { user, isDoctor, isAdmin } = useAuth();
  const { socket, queueUpdates } = useSocket();
  const [queue, setQueue] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [campId] = useState('CAMP001'); // Default camp ID
  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(user?.role === 'doctor' ? user._id : '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchQueue();
    if (isAdmin) {
      fetchPatients();
      fetchDoctors();
    }
  }, []);

  useEffect(() => {
    // Listen for queue updates
    if (queueUpdates.length > 0) {
      const latestUpdate = queueUpdates[queueUpdates.length - 1];
      if (latestUpdate.action === 'added' || latestUpdate.action === 'completed' || latestUpdate.action === 'cancelled') {
        fetchQueue();
      }
    }
  }, [queueUpdates]);

  const fetchQueue = async () => {
    try {
      const params = isDoctor ? { doctorId: user._id } : {};
      const data = await healthService.getQueue(campId, params);
      setQueue(data.queue || []);
    } catch (error) {
      console.error('Failed to fetch queue:', error);
      setError('Failed to load queue');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const data = await userService.getUsers({ role: 'patient', limit: 100 });
      setPatients(data.users || []);
    } catch (error) {
      console.error('Failed to fetch patients:', error);
    }
  };

  const fetchDoctors = async () => {
    try {
      const data = await userService.getUsers({ role: 'doctor', limit: 100 });
      setDoctors(data.users || []);
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
    }
  };

  const addToQueue = async (e) => {
    e.preventDefault();
    if (!selectedPatient || !selectedDoctor) {
      setError('Please select both patient and doctor');
      return;
    }

    try {
      await healthService.addToQueue({
        userId: selectedPatient,
        doctorId: selectedDoctor,
        campId
      });
      
      setSuccess('Patient added to queue successfully!');
      setSelectedPatient('');
      fetchQueue();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to add patient to queue');
    }
  };

  const startConsultation = async (queueId) => {
    try {
      await healthService.startConsultation(queueId);
      setSuccess('Consultation started!');
      fetchQueue();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to start consultation');
    }
  };

  const completeConsultation = async (queueId) => {
    try {
      await healthService.completeConsultation(queueId, 'Consultation completed');
      setSuccess('Consultation completed!');
      fetchQueue();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to complete consultation');
    }
  };

  const cancelQueue = async (queueId) => {
    try {
      await healthService.cancelQueue(queueId);
      setSuccess('Queue entry cancelled!');
      fetchQueue();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to cancel queue entry');
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="container queue-container fade-in">
      <div className="queue-header">
        <h1>{t('queue.queueManagement')}</h1>
        {isAdmin && (
          <div className="card" style={{ maxWidth: '400px' }}>
            <h3>Add Patient to Queue</h3>
            
            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}
            
            <form onSubmit={addToQueue}>
              <div className="form-group">
                <label className="form-label">Select Patient</label>
                <select
                  className="form-select"
                  value={selectedPatient}
                  onChange={(e) => setSelectedPatient(e.target.value)}
                  required
                >
                  <option value="">Choose patient...</option>
                  {patients.map(patient => (
                    <option key={patient._id} value={patient._id}>
                      {patient.name} - {patient.phone}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Select Doctor</label>
                <select
                  className="form-select"
                  value={selectedDoctor}
                  onChange={(e) => setSelectedDoctor(e.target.value)}
                  required
                >
                  <option value="">Choose doctor...</option>
                  {doctors.map(doctor => (
                    <option key={doctor._id} value={doctor._id}>
                      {doctor.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <button type="submit" className="btn">
                {t('queue.addToQueue')}
              </button>
            </form>
          </div>
        )}
      </div>

      <div className="queue-list">
        <div className="card-header">
          <h3>Current Queue - Camp {campId}</h3>
          <p>Total patients: {queue.length}</p>
        </div>

        {queue.length === 0 ? (
          <div className="text-center p-20">
            <p>No patients in queue</p>
          </div>
        ) : (
          queue.map((item, index) => (
            <div key={item._id} className="queue-item">
              <div className="queue-patient-info">
                <div className="queue-patient-name">
                  #{item.tokenNumber} - {item.userId?.name || 'Unknown Patient'}
                </div>
                <div className="queue-patient-details">
                  Phone: {item.userId?.phone} | 
                  Age: {item.userId?.age} | 
                  Gender: {item.userId?.gender} |
                  Doctor: {item.doctorId?.name}
                </div>
                <div className="queue-patient-details">
                  Check-in: {new Date(item.checkInTime).toLocaleTimeString()}
                  {item.estimatedWaitTime && (
                    <span> | Est. wait: {item.estimatedWaitTime} min</span>
                  )}
                </div>
              </div>

              <div className={`queue-status ${item.status}`}>
                {item.status}
              </div>

              <div className="queue-actions">
                {isDoctor && item.doctorId._id === user._id && (
                  <>
                    {item.status === 'waiting' && (
                      <button
                        className="btn btn-success"
                        onClick={() => startConsultation(item._id)}
                      >
                        {t('queue.startConsultation')}
                      </button>
                    )}
                    
                    {item.status === 'in-progress' && (
                      <>
                        <button
                          className="btn btn-warning"
                          onClick={() => window.location.href = `/health-form/${item.userId._id}`}
                        >
                          Create Record
                        </button>
                        <button
                          className="btn btn-success"
                          onClick={() => completeConsultation(item._id)}
                        >
                          {t('queue.completeConsultation')}
                        </button>
                      </>
                    )}
                  </>
                )}

                {(isAdmin || (isDoctor && item.doctorId._id === user._id)) && item.status !== 'completed' && (
                  <button
                    className="btn btn-danger"
                    onClick={() => cancelQueue(item._id)}
                  >
                    {t('queue.cancelQueue')}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Queue Statistics */}
      <div className="grid grid-3 mt-20">
        <div className="stat-card">
          <div className="stat-number">
            {queue.filter(item => item.status === 'waiting').length}
          </div>
          <div className="stat-label">Waiting</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-number">
            {queue.filter(item => item.status === 'in-progress').length}
          </div>
          <div className="stat-label">In Progress</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-number">
            {queue.filter(item => item.status === 'completed').length}
          </div>
          <div className="stat-label">Completed</div>
        </div>
      </div>
    </div>
  );
};

export default QueueManagement;