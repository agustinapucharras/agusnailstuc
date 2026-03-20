const BASE_URL = import.meta.env.PROD ? '/api/v1' : (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1');

// Helper to get headers with token
const getHeaders = (extraHeaders = {}) => {
  const authStore = JSON.parse(localStorage.getItem('auth-storage'));
  const token = authStore?.state?.token;
  
  return {
    'Content-Type': 'application/json',
    ...extraHeaders,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

// Generic request handler
const request = async (endpoint, method, body = null, options = {}) => {
  const { headers: extraHeaders = {}, ...otherOptions } = options;
  
  const config = {
    method,
    headers: getHeaders(extraHeaders),
    ...otherOptions
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, config);

    // Global 401 Handler (Token Expiry)
    if (res.status === 401) {
      console.warn('Sesión expirada, redirigiendo al login...');
      localStorage.removeItem('auth-storage');
      
      // Prevent reload loop if already on login page
      if (window.location.pathname !== '/admin') {
         window.location.href = '/admin';
      }
      throw new Error('Sesión expirada. Por favor inicie sesión nuevamente.');
    }

    // Handle No Content (204)
    if (res.status === 204) {
      return null;
    }

    // Parse Response
    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      // If parsing fails but status is OK, return text as message?
      // Or if it fails and status is error, throw status text
      data = { message: text };
    }

    // Check for API errors (non-2xx responses)
    if (!res.ok) {
        const errorMessage = data.error || data.message || `API Error: ${res.status} ${res.statusText}`;
        const error = new Error(errorMessage);
        error.data = data;
        error.status = res.status;
        throw error;
    }

    return data;
  } catch (error) {
    // If it's the session expired error, it's already handled (redirected), but we still throw 
    // so the caller doesn't try to use undefined data.
    if (error.message === 'Sesión expirada. Por favor inicie sesión nuevamente.') {
        // Optional: stop propagation? No, let the component handle loading state reset
    }
    throw error;
  }
};

export const api = {
  get: (endpoint, options = {}) => request(endpoint, 'GET', null, options),
  post: (endpoint, body, options = {}) => request(endpoint, 'POST', body, options),
  put: (endpoint, body, options = {}) => request(endpoint, 'PUT', body, options),
  patch: (endpoint, body, options = {}) => request(endpoint, 'PATCH', body, options),
  delete: (endpoint, options = {}) => request(endpoint, 'DELETE', null, options)
};
