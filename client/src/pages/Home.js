import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">
                Smart Health Rural Connect
              </h1>
              <p className="hero-subtitle">
                Digital healthcare solutions for rural and semi-urban communities. 
                Access quality healthcare services, track your health, and stay connected 
                with healthcare providers in your area.
              </p>
              <div className="hero-buttons">
                {!isAuthenticated ? (
                  <>
                    <Link to="/register" className="btn btn-large">
                      Get Started
                    </Link>
                    <Link to="/login" className="btn btn-outline btn-large">
                      Login
                    </Link>
                  </>
                ) : (
                  <Link to="/dashboard" className="btn btn-large">
                    Go to Dashboard
                  </Link>
                )}
                <Link to="/awareness" className="btn btn-secondary btn-large">
                  Health Awareness
                </Link>
              </div>
            </div>
            <div className="hero-image">
              <div className="hero-illustration">
                <div className="medical-icon">🏥</div>
                <div className="health-icons">
                  <span>💊</span>
                  <span>🩺</span>
                  <span>📱</span>
                  <span>❤️</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title">Key Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📋</div>
              <h3>Digital Health Records</h3>
              <p>Maintain comprehensive digital health records with easy access to your medical history, prescriptions, and test results.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h3>Queue Management</h3>
              <p>Smart queue system for health camps and clinics. Get your token number and estimated wait time.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>SMS & Voice Reminders</h3>
              <p>Automated reminders for medications, checkups, and vaccinations via SMS and voice calls.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🗺️</div>
              <h3>Healthcare Directory</h3>
              <p>Find nearby hospitals, clinics, and healthcare providers with directions and contact information.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">📄</div>
              <h3>Digital Reports</h3>
              <p>Generate and download PDF health reports with QR codes for easy sharing and access.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🌍</div>
              <h3>Multi-language Support</h3>
              <p>Available in English, Hindi, and Marathi to serve diverse rural communities.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits-section">
        <div className="container">
          <div className="benefits-content">
            <div className="benefits-text">
              <h2>Why Choose Smart Health Rural Connect?</h2>
              <div className="benefits-list">
                <div className="benefit-item">
                  <span className="benefit-icon">✅</span>
                  <div>
                    <h4>Accessible Healthcare</h4>
                    <p>Designed specifically for rural areas with low network connectivity and simple interfaces.</p>
                  </div>
                </div>
                
                <div className="benefit-item">
                  <span className="benefit-icon">✅</span>
                  <div>
                    <h4>Government Schemes</h4>
                    <p>Stay informed about various government healthcare schemes and benefits available to you.</p>
                  </div>
                </div>
                
                <div className="benefit-item">
                  <span className="benefit-icon">✅</span>
                  <div>
                    <h4>Offline Support</h4>
                    <p>Works even with limited internet connectivity. Data syncs when connection is available.</p>
                  </div>
                </div>
                
                <div className="benefit-item">
                  <span className="benefit-icon">✅</span>
                  <div>
                    <h4>Free to Use</h4>
                    <p>Completely free platform to ensure healthcare accessibility for all rural communities.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="benefits-stats">
              <div className="stat-item">
                <div className="stat-number">10,000+</div>
                <div className="stat-label">Users Served</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">500+</div>
                <div className="stat-label">Healthcare Providers</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">50+</div>
                <div className="stat-label">Villages Connected</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Get Started?</h2>
            <p>Join thousands of rural families who are already using Smart Health Rural Connect for better healthcare access.</p>
            <div className="cta-buttons">
              {!isAuthenticated ? (
                <>
                  <Link to="/register" className="btn btn-large">
                    Register Now
                  </Link>
                  <Link to="/awareness" className="btn btn-outline btn-large">
                    Learn More
                  </Link>
                </>
              ) : (
                <Link to="/dashboard" className="btn btn-large">
                  Access Your Dashboard
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;