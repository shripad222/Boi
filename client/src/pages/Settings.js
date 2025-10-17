import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

const Settings = () => {
  const { t, i18n } = useTranslation();
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
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
    },
    preferences: {
      language: 'en',
      notifications: {
        sms: true,
        voice: true
      }
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        address: {
          village: user.address?.village || '',
          district: user.address?.district || '',
          state: user.address?.state || '',
          pincode: user.address?.pincode || ''
        },
        emergencyContact: {
          name: user.emergencyContact?.name || '',
          phone: user.emergencyContact?.phone || '',
          relation: user.emergencyContact?.relation || ''
        },
        preferences: {
          language: user.preferences?.language || 'en',
          notifications: {
            sms: user.preferences?.notifications?.sms !== false,
            voice: user.preferences?.notifications?.voice !== false
          }
        }
      });
    }
  }, [user]);

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

  const handleLanguageChange = (language) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        language
      }
    }));
    
    i18n.changeLanguage(language);
    localStorage.setItem('language', language);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await updateProfile(formData);
      if (result.success) {
        setSuccess(t('settings.profileUpdated'));
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('An error occurred while updating profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container fade-in">
      <div className="card" style={{ maxWidth: '800px', margin: '2rem auto' }}>
        <div className="card-header text-center">
          <h1 className="card-title">{t('settings.settings')}</h1>
          <p>Manage your profile and preferences</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          {/* Profile Information */}
          <div className="form-section">
            <h3 className="form-section-title">{t('settings.profile')}</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Full Name</label>
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
                <label className="form-label">Email</label>
                <input
                  type="email"
                  name="email"
                  className="form-input"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                className="form-input"
                value={user?.phone || ''}
                disabled
                style={{ backgroundColor: '#f8f9fa' }}
              />
              <small style={{ color: '#666' }}>Phone number cannot be changed</small>
            </div>

            <div className="form-group">
              <label className="form-label">Role</label>
              <input
                type="text"
                className="form-input"
                value={user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || ''}
                disabled
                style={{ backgroundColor: '#f8f9fa' }}
              />
            </div>
          </div>

          {/* Address Information */}
          <div className="form-section">
            <h3 className="form-section-title">{t('settings.address')}</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">{t('settings.village')}</label>
                <input
                  type="text"
                  name="address.village"
                  className="form-input"
                  value={formData.address.village}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('settings.district')}</label>
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
                <label className="form-label">{t('settings.state')}</label>
                <input
                  type="text"
                  name="address.state"
                  className="form-input"
                  value={formData.address.state}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('settings.pincode')}</label>
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

          {/* Emergency Contact */}
          <div className="form-section">
            <h3 className="form-section-title">{t('settings.emergencyContact')}</h3>
            
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

          {/* Language Preferences */}
          <div className="form-section">
            <h3 className="form-section-title">{t('settings.language')}</h3>
            
            <div className="form-group">
              <label className="form-label">Select Language</label>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className={`btn ${formData.preferences.language === 'en' ? '' : 'btn-secondary'}`}
                  onClick={() => handleLanguageChange('en')}
                >
                  English
                </button>
                <button
                  type="button"
                  className={`btn ${formData.preferences.language === 'hi' ? '' : 'btn-secondary'}`}
                  onClick={() => handleLanguageChange('hi')}
                >
                  हिंदी
                </button>
                <button
                  type="button"
                  className={`btn ${formData.preferences.language === 'mr' ? '' : 'btn-secondary'}`}
                  onClick={() => handleLanguageChange('mr')}
                >
                  मराठी
                </button>
              </div>
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="form-section">
            <h3 className="form-section-title">{t('settings.notifications')}</h3>
            
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  name="preferences.notifications.sms"
                  checked={formData.preferences.notifications.sms}
                  onChange={handleChange}
                />
                {t('settings.smsNotifications')}
              </label>
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  name="preferences.notifications.voice"
                  checked={formData.preferences.notifications.voice}
                  onChange={handleChange}
                />
                {t('settings.voiceNotifications')}
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="btn"
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? 'Updating...' : t('common.save')}
          </button>
        </form>

        {/* Account Information */}
        <div className="form-section">
          <h3 className="form-section-title">Account Information</h3>
          
          <div className="alert alert-info">
            <p><strong>Account Created:</strong> {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
            <p><strong>Last Login:</strong> {user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'N/A'}</p>
            <p><strong>Verification Status:</strong> {user?.isVerified ? '✅ Verified' : '❌ Not Verified'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;