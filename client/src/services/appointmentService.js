import { api } from './api';

export const appointmentService = {
  getServices: async () => {
    return await api.get('/services'); // Endpoint we need to ensure exists or add
  },

  getAvailableSlots: async (dateStr, serviceId = '') => {
    // Expects dateStr in YYYY-MM-DD
    let url = `/appointments/slots?date=${dateStr}`;
    if (serviceId) url += `&serviceId=${serviceId}`;
    return await api.get(url);
  },

  createAppointment: async (payload) => {
    return await api.post('/appointments', payload);
  },

  getAppointments: async (dateStr) => {
    const token = localStorage.getItem('adminToken');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    
    let url = '/appointments';
    if (dateStr) url += `?date=${dateStr}`;

    return await api.get(url, { headers });
  },

  updateStatus: async (id, status) => {
      const token = localStorage.getItem('adminToken');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      return await api.patch(`/appointments/${id}/status`, { status }, { headers });
  }
};
