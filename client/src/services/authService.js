const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const authService = {
  login: async (username, password) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }
    
    // NOTE: Token persistence is now handled by Zustand store in the component
    
    return data;
  },
  recover: async (email) => {
    const response = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || 'La recuperación falló');
    }
    return data;
  }
};

export default authService;
