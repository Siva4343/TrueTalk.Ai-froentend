import { useState, useCallback } from 'react';
import { API_BASE, API_ENDPOINTS } from '../utils/constants';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }, []);

  const handleRequest = useCallback(async (endpoint, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
          ...getAuthHeaders(),
          ...options.headers,
        },
      });

      // Handle 401 Unauthorized
      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.reload();
        throw new Error('Session expired. Please login again.');
      }

      let responseData;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      if (!response.ok) {
        throw new Error(
          responseData.detail || 
          responseData.message || 
          responseData.error || 
          `Request failed with status ${response.status}`
        );
      }

      setData(responseData);
      return responseData;
    } catch (err) {
      const errorMessage = err.message || 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  const get = useCallback(async (endpoint, queryParams = {}) => {
    const queryString = Object.keys(queryParams).length
      ? `?${new URLSearchParams(queryParams).toString()}`
      : '';
    return handleRequest(`${endpoint}${queryString}`, { method: 'GET' });
  }, [handleRequest]);

  const post = useCallback(async (endpoint, body = {}) => {
    return handleRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }, [handleRequest]);

  const put = useCallback(async (endpoint, body = {}) => {
    return handleRequest(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }, [handleRequest]);

  const patch = useCallback(async (endpoint, body = {}) => {
    return handleRequest(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }, [handleRequest]);

  const del = useCallback(async (endpoint) => {
    return handleRequest(endpoint, { method: 'DELETE' });
  }, [handleRequest]);

  const uploadFile = useCallback(async (endpoint, file, fieldName = 'image') => {
    const formData = new FormData();
    formData.append(fieldName, file);

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: formData,
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.detail || 'Upload failed');
      }

      setData(responseData);
      return responseData;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setData(null);
  }, []);

  return {
    // Request methods
    get,
    post,
    put,
    patch,
    delete: del,
    uploadFile,
    
    // State
    loading,
    error,
    data,
    
    // Utilities
    reset,
    setError,
    setLoading,
  };
};

export const useProductApi = () => {
  const api = useApi();

  const getProducts = useCallback(async (params = {}) => {
    return api.get(API_ENDPOINTS.PRODUCTS, params);
  }, [api]);

  const getProduct = useCallback(async (id) => {
    return api.get(`${API_ENDPOINTS.PRODUCTS}${id}/`);
  }, [api]);

  const createProduct = useCallback(async (productData) => {
    return api.post(API_ENDPOINTS.PRODUCTS, productData);
  }, [api]);

  const updateProduct = useCallback(async (id, productData) => {
    return api.put(`${API_ENDPOINTS.PRODUCTS}${id}/`, productData);
  }, [api]);

  const deleteProduct = useCallback(async (id) => {
    return api.delete(`${API_ENDPOINTS.PRODUCTS}${id}/`);
  }, [api]);

  return {
    // Product-specific methods
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    
    // Inherited state and methods
    ...api,
  };
};

export const useAuthApi = () => {
  const api = useApi();

  const login = useCallback(async (username, password) => {
    return api.post(API_ENDPOINTS.TOKEN, { username, password });
  }, [api]);

  const refreshToken = useCallback(async () => {
    const refresh = localStorage.getItem('refresh_token');
    if (!refresh) throw new Error('No refresh token available');
    
    return api.post(API_ENDPOINTS.TOKEN_REFRESH, { refresh });
  }, [api]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    api.reset();
  }, [api]);

  return {
    // Auth-specific methods
    login,
    refreshToken,
    logout,
    
    // Inherited state and methods
    ...api,
  };
};