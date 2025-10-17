import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { healthService } from '../services/healthService';
import { userService } from '../services/userService';

const HealthForm = () => {
  const { t } = useTranslation();
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(patientId || '');
  const [formData, setFormData] = useState({
    userId: patientId || '',
    vitalSigns: {
      bloodPressure: { systolic: '', diastolic: '' },
      bloodSugar: { fasting: '', postMeal: '', random: '' },
      heartRate: '',
      temperature: '',
      oxygenSaturation: ''
    },
    physicalMeasurements: {
      height: '',
      weight: ''
    },
    examinations: {
      eyeVision: { leftEye: '', rightEye: '', notes: '' },
      earCheck: { leftEar: '', rightEar: '', notes: '' },
      mouthCheck: { teeth: '', gums: '', throat: '', notes: '' },
      generalExamination: { skin: '', lymphNodes: '', abdomen: '', chest: '', notes: '' }
    },
    symptoms: [],
    diagnosis: {
      primary: '',
      secondary: []
    },
    medications: [],
    recommendations: {
      lifestyle: [],
      followUp: { required: false, date: '', reason: '' },
      referral: { required: false, specialist: '', reason: '', urgency: 'low' }
    },
    doctorRemarks: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!patientId) {
      fetchPatients();
    }
  }, [patientId]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const data = await userService.getUsers({ role: 'patient', limit: 100 });
      setPatients(data.users || []);
      
      if (!data.users || data.users.length === 0) {
        setError('No patients found. Please ensure patients are registered in the system.');
      }
    } catch (error) {
      console.error('Failed to fetch patients:', error);
      setError('Failed to load patients. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const keys = name.split('.');
      setFormData(prev => {
        const newData = { ...prev };
        let current = newData;
        
        for (let i = 0; i < keys.length - 1; i++) {
          current = current[keys[i]];
        }
        
        if (type === 'checkbox') {
          current[keys[keys.length - 1]] = checked;
        } else {
          current[keys[keys.length - 1]] = value;
        }
        
        return newData;
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const addMedication = () => {
    setFormData(prev => ({
      ...prev,
      medications: [...prev.medications, {
        name: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: ''
      }]
    }));
  };

  const removeMedication = (index) => {
    setFormData(prev => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index)
    }));
  };

  const updateMedication = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      medications: prev.medications.map((med, i) => 
        i === index ? { ...med, [field]: value } : med
      )
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.userId) {
      setError('Please select a patient');
      setLoading(false);
      return;
    }

    try {
      const result = await healthService.createHealthRecord({
        ...formData,
        userId: formData.userId
      });
      
      setSuccess('Health record saved successfully!');
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save health record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container health-form fade-in">
      <div className="card-header text-center">
        <h1 className="card-title">{t('health.healthForm')}</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit}>
        {/* Patient Selection */}
        {!patientId && (
          <div className="form-section">
            <h3 className="form-section-title">{t('health.patientInfo')}</h3>
            <div className="form-group">
              <label className="form-label">Select Patient *</label>
              <select
                name="userId"
                className="form-select"
                value={formData.userId}
                onChange={handleChange}
                required
              >
                <option value="">Choose a patient...</option>
                {patients.map(patient => (
                  <option key={patient._id} value={patient._id}>
                    {patient.name} - {patient.phone}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Vital Signs */}
        <div className="form-section">
          <h3 className="form-section-title">{t('health.vitalSigns')}</h3>
          
          {/* Blood Pressure */}
          <div className="vital-group">
            <h4 className="vital-title">🩸 Blood Pressure Test</h4>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Systolic (mmHg)</label>
                <input
                  type="number"
                  name="vitalSigns.bloodPressure.systolic"
                  className="form-input"
                  value={formData.vitalSigns.bloodPressure.systolic}
                  onChange={handleChange}
                  placeholder="120"
                  min="70"
                  max="250"
                />
                <small className="form-help">Normal: 90-120 mmHg</small>
              </div>
              <div className="form-group">
                <label className="form-label">Diastolic (mmHg)</label>
                <input
                  type="number"
                  name="vitalSigns.bloodPressure.diastolic"
                  className="form-input"
                  value={formData.vitalSigns.bloodPressure.diastolic}
                  onChange={handleChange}
                  placeholder="80"
                  min="40"
                  max="150"
                />
                <small className="form-help">Normal: 60-80 mmHg</small>
              </div>
            </div>
          </div>

          {/* Blood Sugar Tests */}
          <div className="vital-group">
            <h4 className="vital-title">🍯 Blood Sugar Tests</h4>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Fasting (mg/dL)</label>
                <input
                  type="number"
                  name="vitalSigns.bloodSugar.fasting"
                  className="form-input"
                  value={formData.vitalSigns.bloodSugar.fasting}
                  onChange={handleChange}
                  placeholder="100"
                  min="50"
                  max="500"
                />
                <small className="form-help">Normal: 70-100 mg/dL</small>
              </div>
              <div className="form-group">
                <label className="form-label">Post Meal (mg/dL)</label>
                <input
                  type="number"
                  name="vitalSigns.bloodSugar.postMeal"
                  className="form-input"
                  value={formData.vitalSigns.bloodSugar.postMeal}
                  onChange={handleChange}
                  placeholder="140"
                  min="50"
                  max="500"
                />
                <small className="form-help">Normal: &lt;140 mg/dL</small>
              </div>
              <div className="form-group">
                <label className="form-label">Random (mg/dL)</label>
                <input
                  type="number"
                  name="vitalSigns.bloodSugar.random"
                  className="form-input"
                  value={formData.vitalSigns.bloodSugar.random}
                  onChange={handleChange}
                  placeholder="120"
                  min="50"
                  max="500"
                />
                <small className="form-help">Normal: &lt;200 mg/dL</small>
              </div>
            </div>
          </div>

          {/* Other Vital Signs */}
          <div className="vital-group">
            <h4 className="vital-title">💓 Other Vital Signs</h4>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Heart Rate (bpm)</label>
                <input
                  type="number"
                  name="vitalSigns.heartRate"
                  className="form-input"
                  value={formData.vitalSigns.heartRate}
                  onChange={handleChange}
                  placeholder="72"
                  min="40"
                  max="200"
                />
                <small className="form-help">Normal: 60-100 bpm</small>
              </div>
              <div className="form-group">
                <label className="form-label">Temperature (°F)</label>
                <input
                  type="number"
                  step="0.1"
                  name="vitalSigns.temperature"
                  className="form-input"
                  value={formData.vitalSigns.temperature}
                  onChange={handleChange}
                  placeholder="98.6"
                  min="95"
                  max="110"
                />
                <small className="form-help">Normal: 97.8-99.1°F</small>
              </div>
              <div className="form-group">
                <label className="form-label">Oxygen Saturation (%)</label>
                <input
                  type="number"
                  name="vitalSigns.oxygenSaturation"
                  className="form-input"
                  value={formData.vitalSigns.oxygenSaturation}
                  onChange={handleChange}
                  placeholder="98"
                  min="70"
                  max="100"
                />
                <small className="form-help">Normal: 95-100%</small>
              </div>
            </div>
          </div>
        </div>

        {/* Physical Measurements */}
        <div className="form-section">
          <h3 className="form-section-title">{t('health.physicalMeasurements')}</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Height (cm)</label>
              <input
                type="number"
                name="physicalMeasurements.height"
                className="form-input"
                value={formData.physicalMeasurements.height}
                onChange={handleChange}
                placeholder="170"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                name="physicalMeasurements.weight"
                className="form-input"
                value={formData.physicalMeasurements.weight}
                onChange={handleChange}
                placeholder="70"
              />
            </div>
          </div>
        </div>

        {/* ENT and Physical Examinations */}
        <div className="form-section">
          <h3 className="form-section-title">🔍 Physical Examinations</h3>
          
          {/* Eye Examination */}
          <div className="examination-group">
            <h4 className="examination-title">👁️ Eye Vision Test</h4>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Left Eye Vision</label>
                <select
                  name="examinations.eyeVision.leftEye"
                  className="form-select"
                  value={formData.examinations.eyeVision.leftEye}
                  onChange={handleChange}
                >
                  <option value="">Select vision</option>
                  <option value="6/6">6/6 (Normal)</option>
                  <option value="6/9">6/9 (Mild impairment)</option>
                  <option value="6/12">6/12 (Moderate impairment)</option>
                  <option value="6/18">6/18 (Severe impairment)</option>
                  <option value="6/24">6/24 (Severe impairment)</option>
                  <option value="6/36">6/36 (Severe impairment)</option>
                  <option value="6/60">6/60 (Severe impairment)</option>
                  <option value="CF">Counting Fingers</option>
                  <option value="HM">Hand Movement</option>
                  <option value="PL">Perception of Light</option>
                  <option value="NPL">No Perception of Light</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Right Eye Vision</label>
                <select
                  name="examinations.eyeVision.rightEye"
                  className="form-select"
                  value={formData.examinations.eyeVision.rightEye}
                  onChange={handleChange}
                >
                  <option value="">Select vision</option>
                  <option value="6/6">6/6 (Normal)</option>
                  <option value="6/9">6/9 (Mild impairment)</option>
                  <option value="6/12">6/12 (Moderate impairment)</option>
                  <option value="6/18">6/18 (Severe impairment)</option>
                  <option value="6/24">6/24 (Severe impairment)</option>
                  <option value="6/36">6/36 (Severe impairment)</option>
                  <option value="6/60">6/60 (Severe impairment)</option>
                  <option value="CF">Counting Fingers</option>
                  <option value="HM">Hand Movement</option>
                  <option value="PL">Perception of Light</option>
                  <option value="NPL">No Perception of Light</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Eye Examination Notes</label>
              <textarea
                name="examinations.eyeVision.notes"
                className="form-textarea"
                value={formData.examinations.eyeVision.notes}
                onChange={handleChange}
                placeholder="Any observations about eye health, cataracts, redness, etc."
                rows="2"
              />
            </div>
          </div>

          {/* Ear Examination */}
          <div className="examination-group">
            <h4 className="examination-title">👂 Ear Examination</h4>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Left Ear</label>
                <select
                  name="examinations.earCheck.leftEar"
                  className="form-select"
                  value={formData.examinations.earCheck.leftEar}
                  onChange={handleChange}
                >
                  <option value="">Select condition</option>
                  <option value="Normal">Normal</option>
                  <option value="Wax">Wax buildup</option>
                  <option value="Infection">Infection</option>
                  <option value="Discharge">Discharge</option>
                  <option value="Hearing Loss">Hearing Loss</option>
                  <option value="Pain">Pain/Discomfort</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Right Ear</label>
                <select
                  name="examinations.earCheck.rightEar"
                  className="form-select"
                  value={formData.examinations.earCheck.rightEar}
                  onChange={handleChange}
                >
                  <option value="">Select condition</option>
                  <option value="Normal">Normal</option>
                  <option value="Wax">Wax buildup</option>
                  <option value="Infection">Infection</option>
                  <option value="Discharge">Discharge</option>
                  <option value="Hearing Loss">Hearing Loss</option>
                  <option value="Pain">Pain/Discomfort</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Ear Examination Notes</label>
              <textarea
                name="examinations.earCheck.notes"
                className="form-textarea"
                value={formData.examinations.earCheck.notes}
                onChange={handleChange}
                placeholder="Any observations about ear health, hearing ability, etc."
                rows="2"
              />
            </div>
          </div>

          {/* Mouth and Throat Examination */}
          <div className="examination-group">
            <h4 className="examination-title">👄 Mouth & Throat Examination</h4>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Teeth Condition</label>
                <select
                  name="examinations.mouthCheck.teeth"
                  className="form-select"
                  value={formData.examinations.mouthCheck.teeth}
                  onChange={handleChange}
                >
                  <option value="">Select condition</option>
                  <option value="Good">Good condition</option>
                  <option value="Cavities">Cavities present</option>
                  <option value="Missing">Missing teeth</option>
                  <option value="Plaque">Plaque buildup</option>
                  <option value="Pain">Tooth pain</option>
                  <option value="Loose">Loose teeth</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Gums Condition</label>
                <select
                  name="examinations.mouthCheck.gums"
                  className="form-select"
                  value={formData.examinations.mouthCheck.gums}
                  onChange={handleChange}
                >
                  <option value="">Select condition</option>
                  <option value="Healthy">Healthy</option>
                  <option value="Bleeding">Bleeding</option>
                  <option value="Swollen">Swollen</option>
                  <option value="Receding">Receding</option>
                  <option value="Infected">Infected</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Throat Condition</label>
                <select
                  name="examinations.mouthCheck.throat"
                  className="form-select"
                  value={formData.examinations.mouthCheck.throat}
                  onChange={handleChange}
                >
                  <option value="">Select condition</option>
                  <option value="Normal">Normal</option>
                  <option value="Red">Red/Inflamed</option>
                  <option value="Sore">Sore throat</option>
                  <option value="Swollen">Swollen tonsils</option>
                  <option value="White patches">White patches</option>
                  <option value="Difficulty swallowing">Difficulty swallowing</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Mouth & Throat Notes</label>
              <textarea
                name="examinations.mouthCheck.notes"
                className="form-textarea"
                value={formData.examinations.mouthCheck.notes}
                onChange={handleChange}
                placeholder="Any observations about oral health, breath, tongue, etc."
                rows="2"
              />
            </div>
          </div>

          {/* General Physical Examination */}
          <div className="examination-group">
            <h4 className="examination-title">🩺 General Physical Examination</h4>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Skin Condition</label>
                <select
                  name="examinations.generalExamination.skin"
                  className="form-select"
                  value={formData.examinations.generalExamination.skin}
                  onChange={handleChange}
                >
                  <option value="">Select condition</option>
                  <option value="Normal">Normal</option>
                  <option value="Rash">Rash</option>
                  <option value="Dry">Dry skin</option>
                  <option value="Lesions">Lesions/Wounds</option>
                  <option value="Discoloration">Discoloration</option>
                  <option value="Itchy">Itchy</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Lymph Nodes</label>
                <select
                  name="examinations.generalExamination.lymphNodes"
                  className="form-select"
                  value={formData.examinations.generalExamination.lymphNodes}
                  onChange={handleChange}
                >
                  <option value="">Select condition</option>
                  <option value="Normal">Normal</option>
                  <option value="Enlarged">Enlarged</option>
                  <option value="Tender">Tender</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Abdomen</label>
                <select
                  name="examinations.generalExamination.abdomen"
                  className="form-select"
                  value={formData.examinations.generalExamination.abdomen}
                  onChange={handleChange}
                >
                  <option value="">Select condition</option>
                  <option value="Soft">Soft</option>
                  <option value="Tender">Tender</option>
                  <option value="Distended">Distended</option>
                  <option value="Mass">Mass felt</option>
                  <option value="Pain">Pain</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Chest/Lungs</label>
                <select
                  name="examinations.generalExamination.chest"
                  className="form-select"
                  value={formData.examinations.generalExamination.chest}
                  onChange={handleChange}
                >
                  <option value="">Select condition</option>
                  <option value="Clear">Clear</option>
                  <option value="Wheezing">Wheezing</option>
                  <option value="Crackling">Crackling sounds</option>
                  <option value="Shortness of breath">Shortness of breath</option>
                  <option value="Chest pain">Chest pain</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">General Examination Notes</label>
              <textarea
                name="examinations.generalExamination.notes"
                className="form-textarea"
                value={formData.examinations.generalExamination.notes}
                onChange={handleChange}
                placeholder="Overall physical condition, posture, mobility, etc."
                rows="3"
              />
            </div>
          </div>
        </div>

        {/* Symptoms */}
        <div className="form-section">
          <h3 className="form-section-title">🤒 Symptoms</h3>
          <div className="symptoms-section">
            {formData.symptoms.map((symptom, index) => (
              <div key={index} className="symptom-item">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Symptom</label>
                    <input
                      type="text"
                      className="form-input"
                      value={symptom.symptom}
                      onChange={(e) => {
                        const newSymptoms = [...formData.symptoms];
                        newSymptoms[index].symptom = e.target.value;
                        setFormData(prev => ({ ...prev, symptoms: newSymptoms }));
                      }}
                      placeholder="e.g., Headache, Fever, Cough"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Severity</label>
                    <select
                      className="form-select"
                      value={symptom.severity}
                      onChange={(e) => {
                        const newSymptoms = [...formData.symptoms];
                        newSymptoms[index].severity = e.target.value;
                        setFormData(prev => ({ ...prev, symptoms: newSymptoms }));
                      }}
                    >
                      <option value="">Select severity</option>
                      <option value="mild">Mild</option>
                      <option value="moderate">Moderate</option>
                      <option value="severe">Severe</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Duration</label>
                    <input
                      type="text"
                      className="form-input"
                      value={symptom.duration}
                      onChange={(e) => {
                        const newSymptoms = [...formData.symptoms];
                        newSymptoms[index].duration = e.target.value;
                        setFormData(prev => ({ ...prev, symptoms: newSymptoms }));
                      }}
                      placeholder="e.g., 2 days, 1 week"
                    />
                  </div>
                  <div className="form-group">
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => {
                        const newSymptoms = formData.symptoms.filter((_, i) => i !== index);
                        setFormData(prev => ({ ...prev, symptoms: newSymptoms }));
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setFormData(prev => ({
                  ...prev,
                  symptoms: [...prev.symptoms, { symptom: '', severity: '', duration: '' }]
                }));
              }}
            >
              Add Symptom
            </button>
          </div>
        </div>

        {/* Diagnosis */}
        <div className="form-section">
          <h3 className="form-section-title">{t('health.diagnosis')}</h3>
          
          <div className="form-group">
            <label className="form-label">Primary Diagnosis</label>
            <input
              type="text"
              name="diagnosis.primary"
              className="form-input"
              value={formData.diagnosis.primary}
              onChange={handleChange}
              placeholder="Enter primary diagnosis"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Secondary Diagnosis (if any)</label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter secondary diagnosis and press Enter"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                  setFormData(prev => ({
                    ...prev,
                    diagnosis: {
                      ...prev.diagnosis,
                      secondary: [...prev.diagnosis.secondary, e.target.value.trim()]
                    }
                  }));
                  e.target.value = '';
                }
              }}
            />
            {formData.diagnosis.secondary.length > 0 && (
              <div className="secondary-diagnoses">
                {formData.diagnosis.secondary.map((diag, index) => (
                  <span key={index} className="diagnosis-tag">
                    {diag}
                    <button
                      type="button"
                      onClick={() => {
                        const newSecondary = formData.diagnosis.secondary.filter((_, i) => i !== index);
                        setFormData(prev => ({
                          ...prev,
                          diagnosis: { ...prev.diagnosis, secondary: newSecondary }
                        }));
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Medications */}
        <div className="form-section">
          <h3 className="form-section-title">{t('health.medications')}</h3>
          
          {formData.medications.map((medication, index) => (
            <div key={index} className="card" style={{ marginBottom: '1rem' }}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Medicine Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={medication.name}
                    onChange={(e) => updateMedication(index, 'name', e.target.value)}
                    placeholder="Medicine name"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Dosage</label>
                  <input
                    type="text"
                    className="form-input"
                    value={medication.dosage}
                    onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                    placeholder="5mg"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Frequency</label>
                  <select
                    className="form-select"
                    value={medication.frequency}
                    onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                  >
                    <option value="">Select frequency</option>
                    <option value="once daily">Once daily</option>
                    <option value="twice daily">Twice daily</option>
                    <option value="thrice daily">Thrice daily</option>
                    <option value="four times daily">Four times daily</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Duration</label>
                  <input
                    type="text"
                    className="form-input"
                    value={medication.duration}
                    onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                    placeholder="7 days"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Instructions</label>
                <input
                  type="text"
                  className="form-input"
                  value={medication.instructions}
                  onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                  placeholder="Take with food"
                />
              </div>
              
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => removeMedication(index)}
              >
                Remove Medicine
              </button>
            </div>
          ))}
          
          <button
            type="button"
            className="btn btn-secondary"
            onClick={addMedication}
          >
            Add Medicine
          </button>
        </div>

        {/* Recommendations */}
        <div className="form-section">
          <h3 className="form-section-title">📋 Recommendations</h3>
          
          {/* Lifestyle Recommendations */}
          <div className="form-group">
            <label className="form-label">Lifestyle Recommendations</label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter lifestyle recommendation and press Enter"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                  setFormData(prev => ({
                    ...prev,
                    recommendations: {
                      ...prev.recommendations,
                      lifestyle: [...prev.recommendations.lifestyle, e.target.value.trim()]
                    }
                  }));
                  e.target.value = '';
                }
              }}
            />
            {formData.recommendations.lifestyle.length > 0 && (
              <div className="recommendations-list">
                {formData.recommendations.lifestyle.map((rec, index) => (
                  <span key={index} className="recommendation-tag">
                    {rec}
                    <button
                      type="button"
                      onClick={() => {
                        const newLifestyle = formData.recommendations.lifestyle.filter((_, i) => i !== index);
                        setFormData(prev => ({
                          ...prev,
                          recommendations: { ...prev.recommendations, lifestyle: newLifestyle }
                        }));
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Follow-up */}
          <div className="followup-section">
            <h4>📅 Follow-up Appointment</h4>
            <div className="form-row">
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    name="recommendations.followUp.required"
                    checked={formData.recommendations.followUp.required}
                    onChange={handleChange}
                  />
                  Follow-up Required
                </label>
              </div>
            </div>
            
            {formData.recommendations.followUp.required && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Next Checkup Date</label>
                    <input
                      type="date"
                      name="recommendations.followUp.date"
                      className="form-input"
                      value={formData.recommendations.followUp.date}
                      onChange={handleChange}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Reason for Follow-up</label>
                    <input
                      type="text"
                      name="recommendations.followUp.reason"
                      className="form-input"
                      value={formData.recommendations.followUp.reason}
                      onChange={handleChange}
                      placeholder="e.g., Monitor blood pressure, Check test results"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Referral */}
          <div className="referral-section">
            <h4>🏥 Specialist Referral</h4>
            <div className="form-row">
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    name="recommendations.referral.required"
                    checked={formData.recommendations.referral.required}
                    onChange={handleChange}
                  />
                  Referral Required
                </label>
              </div>
            </div>
            
            {formData.recommendations.referral.required && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Specialist Type</label>
                    <select
                      name="recommendations.referral.specialist"
                      className="form-select"
                      value={formData.recommendations.referral.specialist}
                      onChange={handleChange}
                    >
                      <option value="">Select specialist</option>
                      <option value="Cardiologist">Cardiologist</option>
                      <option value="Diabetologist">Diabetologist</option>
                      <option value="Neurologist">Neurologist</option>
                      <option value="Orthopedist">Orthopedist</option>
                      <option value="Gynecologist">Gynecologist</option>
                      <option value="Pediatrician">Pediatrician</option>
                      <option value="Dermatologist">Dermatologist</option>
                      <option value="ENT Specialist">ENT Specialist</option>
                      <option value="Ophthalmologist">Ophthalmologist</option>
                      <option value="Psychiatrist">Psychiatrist</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Urgency</label>
                    <select
                      name="recommendations.referral.urgency"
                      className="form-select"
                      value={formData.recommendations.referral.urgency}
                      onChange={handleChange}
                    >
                      <option value="low">Low (Within 1 month)</option>
                      <option value="medium">Medium (Within 2 weeks)</option>
                      <option value="high">High (Within 1 week)</option>
                      <option value="emergency">Emergency (Immediate)</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Reason for Referral</label>
                  <textarea
                    name="recommendations.referral.reason"
                    className="form-textarea"
                    value={formData.recommendations.referral.reason}
                    onChange={handleChange}
                    placeholder="Explain why specialist consultation is needed"
                    rows="2"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Doctor's Remarks */}
        <div className="form-section">
          <h3 className="form-section-title">{t('health.doctorRemarks')}</h3>
          
          <div className="form-group">
            <label className="form-label">Clinical Notes & Observations</label>
            <textarea
              name="doctorRemarks"
              className="form-textarea"
              value={formData.doctorRemarks}
              onChange={handleChange}
              placeholder="Enter your clinical observations, patient condition, treatment response, etc."
              rows="4"
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn"
          disabled={loading}
          style={{ width: '100%' }}
        >
          {loading ? 'Saving...' : t('health.saveRecord')}
        </button>
      </form>
    </div>
  );
};

export default HealthForm;