import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

const Register = () => {
  const { t } = useTranslation();
  const { register, verifyOTP, resendOTP } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1); // 1: Registration, 2: OTP Verification
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'male',
    aadhaar: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'patient',
    address: {
      village: '',
      district: '',
      state: '',
      pincode: ''
    },
    emergencyContact: {
      name: '',
      phone: '',
      relation: ''
    }
  });
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.phone.length !== 10) {
      setError('Phone number must be 10 digits');
      setLoading(false);
      return;
    }

    if (formData.aadhaar.length !== 12) {
      setError('Aadhaar number must be 12 digits');
      setLoading(false);
      return;
    }

    try {
      const result = await register(formData);
      if (result.success) {
        setSuccess('Registration successful! Please verify your phone number.');
        setStep(2);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerification = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await verifyOTP(otp);
      if (result.success) {
        setSuccess('Phone number verified successfully!');
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        setError(result.message || 'Invalid OTP');
      }
    } catch (err) {
      setError('An error occurred during OTP verification');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    try {
      const result = await resendOTP();
      if (result.success) {
        setSuccess('OTP sent successfully!');
      } else {
        setError(result.message || 'Failed to resend OTP');
      }
    } catch (err) {
      setError('An error occurred while resending OTP');
    } finally {
      setLoading(false);
    }
  };

  if (step === 2) {
    return (
      <div className="container">
        <div className="card" style={{ maxWidth: '400px', margin: '2rem auto' }}>
          <div className="card-header text-center">
            <h1 className="card-title">Verify Phone Number</h1>
            <p>Enter the OTP sent to +91{formData.phone}</p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={handleOTPVerification}>
            <div className="form-group">
              <label className="form-label">Enter OTP</label>
              <input
                type="text"
                className="form-input"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="6-digit OTP"
                maxLength="6"
                required
              />
            </div>

            <button
              type="submit"
              className="btn"
              disabled={loading}
              style={{ width: '100%', marginBottom: '1rem' }}
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleResendOTP}
              disabled={loading}
              style={{ width: '100%' }}
            >
              Resend OTP
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: '600px', margin: '2rem auto' }}>
        <div className="card-header text-center">
          <h1 className="card-title">Register for Smart Health</h1>
          <p>Create your account to access healthcare services</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          {/* Basic Information */}
          <div className="form-section">
            <h3 className="form-section-title">Basic Information</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  className="form-input"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Age *</label>
                <input
                  type="number"
                  name="age"
                  className="form-input"
                  value={formData.age}
                  onChange={handleChange}
                  min="1"
                  max="120"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Gender *</label>
                <select
                  name="gender"
                  className="form-select"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Role</label>
                <select
                  name="role"
                  className="form-select"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="patient">Patient</option>
                  <option value="doctor">Doctor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Aadhaar Number *</label>
                <input
                  type="text"
                  name="aadhaar"
                  className="form-input"
                  value={formData.aadhaar}
                  onChange={handleChange}
                  placeholder="12-digit Aadhaar number"
                  maxLength="12"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  className="form-input"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="10-digit phone number"
                  maxLength="10"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email (Optional)</label>
              <input
                type="email"
                name="email"
                className="form-input"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Password *</label>
                <input
                  type="password"
                  name="password"
                  className="form-input"
                  value={formData.password}
                  onChange={handleChange}
                  minLength="6"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirm Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  className="form-input"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  minLength="6"
                  required
                />
              </div>
            </div>
          </div>

          {/* Address Information - Only for Patients */}
          {formData.role === 'patient' && (
            <div className="form-section">
              <h3 className="form-section-title">Address Information</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Village</label>
                  <input
                    type="text"
                    name="address.village"
                    className="form-input"
                    value={formData.address.village}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">District</label>
                  <input
                    type="text"
                    name="address.district"
                    className="form-input"
                    value={formData.address.district}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">State</label>
                  <input
                    type="text"
                    name="address.state"
                    className="form-input"
                    value={formData.address.state}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Pincode</label>
                  <input
                    type="text"
                    name="address.pincode"
                    className="form-input"
                    value={formData.address.pincode}
                    onChange={handleChange}
                    maxLength="6"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Emergency Contact - Only for Patients */}
          {formData.role === 'patient' && (
            <div className="form-section">
              <h3 className="form-section-title">Emergency Contact</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Contact Name</label>
                  <input
                    type="text"
                    name="emergencyContact.name"
                    className="form-input"
                    value={formData.emergencyContact.name}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Contact Phone</label>
                  <input
                    type="tel"
                    name="emergencyContact.phone"
                    className="form-input"
                    value={formData.emergencyContact.phone}
                    onChange={handleChange}
                    maxLength="10"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Relation</label>
                <input
                  type="text"
                  name="emergencyContact.relation"
                  className="form-input"
                  value={formData.emergencyContact.relation}
                  onChange={handleChange}
                  placeholder="e.g., Father, Mother, Spouse"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn"
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <div className="text-center" style={{ marginTop: '1rem' }}>
          <p>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#007bff' }}>
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;