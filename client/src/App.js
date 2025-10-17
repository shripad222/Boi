import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import HealthForm from './pages/HealthForm';
import QueueManagement from './pages/QueueManagement';
import Reports from './pages/Reports';
import HealthcareMap from './pages/HealthcareMap';
import Settings from './pages/Settings';
import DigitalReport from './pages/DigitalReport';
import Awareness from './pages/Awareness';
import Home from './pages/Home';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <Router>
            <div className="App">
              <Navbar />
              <main className="main-content">
                <Routes>
                  <Route path="/home" element={<Home />} />
                  <Route path="/awareness" element={<Awareness />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/report/:id" element={<DigitalReport />} />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/health-form"
                    element={
                      <ProtectedRoute roles={['doctor']}>
                        <HealthForm />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/health-form/:patientId"
                    element={
                      <ProtectedRoute roles={['doctor']}>
                        <HealthForm />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/queue"
                    element={
                      <ProtectedRoute>
                        <QueueManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/reports"
                    element={
                      <ProtectedRoute>
                        <Reports />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/healthcare-map"
                    element={
                      <ProtectedRoute>
                        <HealthcareMap />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <Settings />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/" element={<Navigate to="/home" replace />} />
                </Routes>
              </main>
            </div>
          </Router>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;