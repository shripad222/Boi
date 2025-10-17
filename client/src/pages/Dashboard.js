import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/userService';
import { healthService } from '../services/healthService';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const { t } = useTranslation();
  const { user, isDoctor, isAdmin, isPatient } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upcomingReminders, setUpcomingReminders] = useState([]);
  const [timeRange, setTimeRange] = useState('monthly'); // daily, weekly, monthly, yearly
  const [healthAlerts, setHealthAlerts] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    fetchUpcomingReminders();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const data = await userService.getDashboard();
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUpcomingReminders = async () => {
    try {
      const data = await healthService.getUpcomingReminders();
      setUpcomingReminders(data.reminders || []);
      
      // Check for overdue checkups
      const alerts = [];
      if (dashboardData?.statistics?.nextCheckup) {
        const nextCheckup = new Date(dashboardData.statistics.nextCheckup);
        const today = new Date();
        const daysDiff = Math.ceil((nextCheckup - today) / (1000 * 60 * 60 * 24));
        
        if (daysDiff < 0) {
          alerts.push({
            type: 'danger',
            message: `Your checkup is overdue by ${Math.abs(daysDiff)} days. Please schedule an appointment.`
          });
        } else if (daysDiff <= 3) {
          alerts.push({
            type: 'warning',
            message: `Your next checkup is in ${daysDiff} days. Don't forget to visit your doctor.`
          });
        } else if (daysDiff <= 7) {
          alerts.push({
            type: 'info',
            message: `Your next checkup is scheduled in ${daysDiff} days.`
          });
        }
      }
      
      setHealthAlerts(alerts);
    } catch (error) {
      console.error('Failed to fetch reminders:', error);
    }
  };

  const getFilteredTrends = (trends, range) => {
    if (!trends || trends.length === 0) return trends;
    
    const now = new Date();
    let startDate;
    
    switch (range) {
      case 'daily':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
        break;
      case 'weekly':
        startDate = new Date(now.getTime() - 4 * 7 * 24 * 60 * 60 * 1000); // Last 4 weeks
        break;
      case 'monthly':
        startDate = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000); // Last 6 months
        break;
      case 'yearly':
        startDate = new Date(now.getTime() - 3 * 365 * 24 * 60 * 60 * 1000); // Last 3 years
        break;
      default:
        return trends;
    }
    
    return trends.filter(item => new Date(item.date) >= startDate);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const filteredBPTrends = getFilteredTrends(dashboardData?.trends?.bloodPressure, timeRange);
  const filteredWeightTrends = getFilteredTrends(dashboardData?.trends?.weight, timeRange);
  const filteredSugarTrends = getFilteredTrends(dashboardData?.trends?.bloodSugar, timeRange);

  const bloodPressureData = {
    labels: filteredBPTrends?.map(item => new Date(item.date).toLocaleDateString()) || [],
    datasets: [
      {
        label: 'Systolic',
        data: filteredBPTrends?.map(item => item.systolic) || [],
        borderColor: '#dc3545',
        backgroundColor: 'rgba(220, 53, 69, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Diastolic',
        data: filteredBPTrends?.map(item => item.diastolic) || [],
        borderColor: '#007bff',
        backgroundColor: 'rgba(0, 123, 255, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const weightData = {
    labels: filteredWeightTrends?.map(item => new Date(item.date).toLocaleDateString()) || [],
    datasets: [
      {
        label: 'Weight (kg)',
        data: filteredWeightTrends?.map(item => item.weight) || [],
        borderColor: '#28a745',
        backgroundColor: 'rgba(40, 167, 69, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'BMI',
        data: filteredWeightTrends?.map(item => item.bmi) || [],
        borderColor: '#ffc107',
        backgroundColor: 'rgba(255, 193, 7, 0.1)',
        tension: 0.4,
        yAxisID: 'y1',
      },
    ],
  };

  const bloodSugarData = {
    labels: filteredSugarTrends?.map(item => new Date(item.date).toLocaleDateString()) || [],
    datasets: [
      {
        label: 'Fasting',
        data: filteredSugarTrends?.map(item => item.fasting) || [],
        borderColor: '#17a2b8',
        backgroundColor: 'rgba(23, 162, 184, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Post Meal',
        data: filteredSugarTrends?.map(item => item.postMeal) || [],
        borderColor: '#6f42c1',
        backgroundColor: 'rgba(111, 66, 193, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const healthScoreData = {
    labels: ['Excellent', 'Good', 'Fair', 'Poor'],
    datasets: [
      {
        data: [25, 45, 20, 10], // Sample data - calculate based on health metrics
        backgroundColor: ['#28a745', '#ffc107', '#fd7e14', '#dc3545'],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="container dashboard fade-in">
      <div className="dashboard-header">
        <h1 className="dashboard-title">
          {t('dashboard.welcome')}, {user?.name}!
        </h1>
        <p className="dashboard-subtitle">
          {t('dashboard.title')} - {user?.role.charAt(0).toUpperCase() + user?.role.slice(1)}
        </p>
        
        {/* Health Alerts */}
        {healthAlerts.length > 0 && (
          <div className="health-alerts">
            {healthAlerts.map((alert, index) => (
              <div key={index} className={`alert alert-${alert.type}`}>
                {alert.message}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">
            {dashboardData?.statistics?.totalRecords || 0}
          </div>
          <div className="stat-label">
            {t('dashboard.totalRecords')}
          </div>
        </div>

        {isPatient && (
          <>
            <div className="stat-card">
              <div className="stat-number">
                {dashboardData?.statistics?.lastCheckup 
                  ? new Date(dashboardData.statistics.lastCheckup).toLocaleDateString()
                  : 'N/A'
                }
              </div>
              <div className="stat-label">
                {t('dashboard.lastCheckup')}
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-number">
                {dashboardData?.statistics?.nextCheckup 
                  ? new Date(dashboardData.statistics.nextCheckup).toLocaleDateString()
                  : 'N/A'
                }
              </div>
              <div className="stat-label">
                {t('dashboard.nextCheckup')}
              </div>
            </div>
          </>
        )}

        <div className="stat-card">
          <div className="stat-number">
            {upcomingReminders.length}
          </div>
          <div className="stat-label">
            {t('dashboard.upcomingReminders')}
          </div>
        </div>
      </div>

      {/* Time Range Selector for Patients */}
      {isPatient && (
        <div className="time-range-selector">
          <h3>Health Trends</h3>
          <div className="time-buttons">
            {[
              { key: 'daily', label: 'Last 7 Days' },
              { key: 'weekly', label: 'Last 4 Weeks' },
              { key: 'monthly', label: 'Last 6 Months' },
              { key: 'yearly', label: 'Last 3 Years' }
            ].map(({ key, label }) => (
              <button
                key={key}
                className={`btn ${timeRange === key ? '' : 'btn-outline'}`}
                onClick={() => setTimeRange(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-2">
        {/* Health Trends Charts */}
        {isPatient && dashboardData?.trends && (
          <>
            {filteredBPTrends?.length > 0 && (
              <div className="chart-container">
                <h3 className="chart-title">Blood Pressure Trends</h3>
                <Line data={bloodPressureData} options={{
                  ...chartOptions,
                  scales: {
                    y: {
                      beginAtZero: false,
                      min: 60,
                      max: 180,
                      title: {
                        display: true,
                        text: 'mmHg'
                      }
                    }
                  }
                }} />
              </div>
            )}

            {filteredWeightTrends?.length > 0 && (
              <div className="chart-container">
                <h3 className="chart-title">Weight & BMI Trends</h3>
                <Line data={weightData} options={{
                  ...chartOptions,
                  scales: {
                    y: {
                      type: 'linear',
                      display: true,
                      position: 'left',
                      title: {
                        display: true,
                        text: 'Weight (kg)'
                      }
                    },
                    y1: {
                      type: 'linear',
                      display: true,
                      position: 'right',
                      title: {
                        display: true,
                        text: 'BMI'
                      },
                      grid: {
                        drawOnChartArea: false,
                      },
                    }
                  }
                }} />
              </div>
            )}

            {filteredSugarTrends?.length > 0 && (
              <div className="chart-container">
                <h3 className="chart-title">Blood Sugar Trends</h3>
                <Line data={bloodSugarData} options={{
                  ...chartOptions,
                  scales: {
                    y: {
                      beginAtZero: false,
                      min: 70,
                      max: 250,
                      title: {
                        display: true,
                        text: 'mg/dL'
                      }
                    }
                  }
                }} />
              </div>
            )}

            {/* Health Score Doughnut Chart */}
            <div className="chart-container">
              <h3 className="chart-title">Overall Health Score</h3>
              <Doughnut data={healthScoreData} options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        return context.label + ': ' + context.parsed + '%';
                      }
                    }
                  }
                }
              }} />
            </div>
          </>
        )}

        {/* Recent Health Records */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">{t('dashboard.recentRecords')}</h3>
          </div>
          {dashboardData?.recentRecords?.length > 0 ? (
            <div>
              {dashboardData.recentRecords.map((record) => (
                <div key={record._id} className="queue-item">
                  <div className="queue-patient-info">
                    <div className="queue-patient-name">
                      {new Date(record.checkupDate).toLocaleDateString()}
                    </div>
                    <div className="queue-patient-details">
                      Doctor: {record.doctorId?.name || 'Unknown'}
                      {record.diagnosis?.primary && (
                        <span> • {record.diagnosis.primary}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>{t('dashboard.noRecords')}</p>
          )}
        </div>

        {/* Upcoming Reminders */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">{t('dashboard.upcomingReminders')}</h3>
          </div>
          {upcomingReminders.length > 0 ? (
            <div>
              {upcomingReminders.slice(0, 5).map((reminder) => (
                <div key={reminder._id} className="queue-item">
                  <div className="queue-patient-info">
                    <div className="queue-patient-name">
                      {reminder.title}
                    </div>
                    <div className="queue-patient-details">
                      {new Date(reminder.scheduledDate).toLocaleString()}
                    </div>
                  </div>
                  <div className={`queue-status ${reminder.type}`}>
                    {reminder.type}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No upcoming reminders</p>
          )}
        </div>
      </div>

      {/* Latest Vitals (for patients) */}
      {isPatient && dashboardData?.latestVitals && Object.keys(dashboardData.latestVitals).length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Latest Vital Signs</h3>
          </div>
          <div className="grid grid-3">
            {dashboardData.latestVitals.bloodPressure?.systolic && (
              <div className="stat-card">
                <div className="stat-number">
                  {dashboardData.latestVitals.bloodPressure.systolic}/
                  {dashboardData.latestVitals.bloodPressure.diastolic}
                </div>
                <div className="stat-label">Blood Pressure (mmHg)</div>
              </div>
            )}
            
            {dashboardData.latestVitals.bloodSugar?.fasting && (
              <div className="stat-card">
                <div className="stat-number">
                  {dashboardData.latestVitals.bloodSugar.fasting}
                </div>
                <div className="stat-label">Blood Sugar (mg/dL)</div>
              </div>
            )}
            
            {dashboardData.latestVitals.heartRate && (
              <div className="stat-card">
                <div className="stat-number">
                  {dashboardData.latestVitals.heartRate}
                </div>
                <div className="stat-label">Heart Rate (bpm)</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Quick Actions</h3>
        </div>
        <div className="grid grid-3">
          {isDoctor && (
            <button 
              className="btn"
              onClick={() => window.location.href = '/health-form'}
            >
              📋 New Health Record
            </button>
          )}
          
          <button 
            className="btn btn-secondary"
            onClick={() => window.location.href = '/queue'}
          >
            👥 View Queue
          </button>
          
          <button 
            className="btn btn-secondary"
            onClick={() => window.location.href = '/reports'}
          >
            📄 View Reports
          </button>
          
          <button 
            className="btn btn-secondary"
            onClick={() => window.location.href = '/healthcare-map'}
          >
            🗺️ Find Healthcare
          </button>
          
          {isPatient && (
            <button 
              className="btn btn-secondary"
              onClick={() => window.location.href = '/settings'}
            >
              ⚙️ Settings
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;