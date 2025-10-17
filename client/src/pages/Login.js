import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    biometricData: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showBiometric, setShowBiometric] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(formData);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const simulateBiometric = () => {
    // Simulate biometric authentication
    setFormData({
      ...formData,
      biometricData: {
        fingerprint: 'simulated_fingerprint_data',
        faceId: 'simulated_face_data'
      }
    });
    setShowBiometric(false);
  };

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: '400px', margin: '2rem auto' }}>
        <div className="card-header text-center">
          <h1 className="card-title">Smart Health Rural Connect</h1>
          <p>{t('auth.login')}</p>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">{t('auth.phone')}</label>
            <input
              type="tel"
              name="phone"
              className="form-input"
              value={formData.phone}
              onChange={handleChange}
              placeholder="10-digit phone number"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('auth.password')}</label>
            <input
              type="password"
              name="password"
              className="form-input"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required={!formData.biometricData}
            />
          </div>

          <div className="form-group">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowBiometric(true)}
              style={{ width: '100%', marginBottom: '1rem' }}
            >
              🔒 Use Biometric Login (Demo)
            </button>
          </div>

          {formData.biometricData && (
            <div className="alert alert-success">
              ✅ Biometric authentication enabled
            </div>
          )}

          <button
            type="submit"
            className="btn"
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? t('common.loading') : t('auth.login')}
          </button>
        </form>

        <div className="text-center" style={{ marginTop: '1rem' }}>
          <p>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#007bff' }}>
              {t('auth.register')}
            </Link>
          </p>
        </div>

        {/* Demo Credentials */}
        <div className="alert alert-info" style={{ marginTop: '1rem' }}>
          <strong>Demo Credentials:</strong><br />
          <small>
            Patient: 9876543213 / patient123<br />
            Doctor: 9876543211 / doctor123<br />
            Admin: 9876543210 / admin123
          </small>
        </div>
      </div>

      {/* Biometric Modal */}
      {showBiometric && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ maxWidth: '300px' }}>
            <h3>Biometric Authentication</h3>
            <p>Place your finger on the sensor or look at the camera</p>
            <div style={{ textAlign: 'center', margin: '2rem 0' }}>
              <div style={{ fontSize: '4rem' }}>👆</div>
              <p>Simulating biometric scan...</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                className="btn btn-success" 
                onClick={simulateBiometric}
                style={{ flex: 1 }}
              >
                ✅ Success
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowBiometric(false)}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;