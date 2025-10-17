import api from './api';

export const healthService = {
  // Health Records
  createHealthRecord: async (data) => {
    const response = await api.post('/health', data);
    return response.data;
  },

  getHealthRecords: async (params = {}) => {
    const response = await api.get('/health', { params });
    return response.data;
  },

  getHealthRecord: async (id) => {
    const response = await api.get(`/health/${id}`);
    return response.data;
  },

  updateHealthRecord: async (id, data) => {
    const response = await api.put(`/health/${id}`, data);
    return response.data;
  },

  getHealthStats: async (userId) => {
    const response = await api.get(`/health/stats/${userId}`);
    return response.data;
  },

  // Queue Management
  addToQueue: async (data) => {
    const response = await api.post('/queue/add', data);
    return response.data;
  },

  getQueue: async (campId, params = {}) => {
    const response = await api.get(`/queue/${campId}`, { params });
    return response.data;
  },

  getQueuePosition: async (userId, campId) => {
    const response = await api.get(`/queue/position/${userId}/${campId}`);
    return response.data;
  },

  startConsultation: async (queueId) => {
    const response = await api.put(`/queue/start/${queueId}`);
    return response.data;
  },

  completeConsultation: async (queueId, notes) => {
    const response = await api.put(`/queue/complete/${queueId}`, { notes });
    return response.data;
  },

  cancelQueue: async (queueId) => {
    const response = await api.put(`/queue/cancel/${queueId}`);
    return response.data;
  },

  getQueueStats: async (campId) => {
    const response = await api.get(`/queue/stats/${campId}`);
    return response.data;
  },

  // Reports
  generateReport: async (healthRecordId) => {
    const response = await api.post(`/reports/generate/${healthRecordId}`);
    return response.data;
  },

  getDigitalReport: async (healthRecordId) => {
    const response = await api.get(`/reports/digital/${healthRecordId}`);
    return response.data;
  },

  getUserReports: async (userId) => {
    const response = await api.get(`/reports/user/${userId}`);
    return response.data;
  },

  downloadReport: (filename) => {
    return `${api.defaults.baseURL}/reports/download/${filename}`;
  },

  // Reminders
  createReminder: async (data) => {
    const response = await api.post('/reminders', data);
    return response.data;
  },

  getReminders: async (params = {}) => {
    const response = await api.get('/reminders', { params });
    return response.data;
  },

  getUpcomingReminders: async (userId) => {
    const response = await api.get('/reminders/upcoming', { 
      params: userId ? { userId } : {} 
    });
    return response.data;
  },

  updateReminder: async (id, data) => {
    const response = await api.put(`/reminders/${id}`, data);
    return response.data;
  },

  cancelReminder: async (id) => {
    const response = await api.put(`/reminders/${id}/cancel`);
    return response.data;
  },

  deleteReminder: async (id) => {
    const response = await api.delete(`/reminders/${id}`);
    return response.data;
  },

  getReminderStats: async () => {
    const response = await api.get('/reminders/stats');
    return response.data;
  },

  // Clinics
  getNearbyClinic: async (latitude, longitude, params = {}) => {
    const response = await api.get('/clinics/nearby', {
      params: { latitude, longitude, ...params }
    });
    return response.data;
  },

  getClinics: async (params = {}) => {
    const response = await api.get('/clinics', { params });
    return response.data;
  },

  getClinic: async (id) => {
    const response = await api.get(`/clinics/${id}`);
    return response.data;
  },

  getClinicTypes: async () => {
    const response = await api.get('/clinics/meta/types');
    return response.data;
  }
};