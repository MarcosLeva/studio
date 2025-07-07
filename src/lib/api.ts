
import {toast} from '@/hooks/use-toast';
import { deleteCookie, getCookie } from './utils';

let accessToken: string | null = null;
let isRefreshing = false;
let failedQueue: { resolve: (value?: unknown) => void; reject: (reason?: any) => void; }[] = [];

const getApiUrl = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!apiUrl) {
    console.error('API base URL is not configured.');
    toast({
      variant: 'destructive',
      title: 'Error de Configuración',
      description:
        'La URL de la API no está configurada. Por favor, contacta al administrador.',
    });
    throw new Error('API_BASE_URL is not defined.');
  }
  return apiUrl;
};

const processQueue = (error: Error | null, data: any | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(data);
    }
  });
  failedQueue = [];
};

export const setToken = (token: string | null) => {
  accessToken = token;
};

const handleResponse = async (response: Response) => {
    const text = await response.text();
    const json = text ? JSON.parse(text) : {};

    if (!response.ok) {
        const error = new Error(json.message || `Error: ${response.statusText}`);
        (error as any).status = response.status;
        throw error;
    }
    
    if (json.success === false) {
      throw new Error(json.message || 'La API indicó un fallo en la operación.');
    }

    return json.data;
}

const refreshToken = async () => {
    if (isRefreshing) {
        return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
        });
    }

    isRefreshing = true;
    
    const token = getCookie('refresh_token');
    if (!token) {
        const error = new Error('Sesión no encontrada. Por favor, inicia sesión de nuevo.');
        processQueue(error, null);
        isRefreshing = false;
        return Promise.reject(error);
    }

    try {
        const url = `${getApiUrl()}/auth/refresh`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: token }),
        });

        const data = await handleResponse(response);
        const newAccessToken = data.access_token;
        setToken(newAccessToken);
        
        processQueue(null, data);
        return data;
    } catch (error) {
        processQueue(error as Error, null);
        setToken(null);
        deleteCookie('refresh_token');
        if (typeof window !== 'undefined') localStorage.removeItem('user');
        throw error;
    } finally {
        isRefreshing = false;
    }
}

const request = async (endpoint: string, options: RequestInit) => {
  const url = `${getApiUrl()}${endpoint}`;
  const headers = new Headers(options.headers);

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  try {
    const response = await fetch(url, { ...options, headers });
    return await handleResponse(response);
  } catch (error: any) {
    if (error.status === 401) {
      try {
        const refreshData = await refreshToken();
        
        const retryHeaders = new Headers(options.headers);
        retryHeaders.set('Authorization', `Bearer ${refreshData.access_token}`);
        const retryResponse = await fetch(url, { ...options, headers: retryHeaders });

        return handleResponse(retryResponse);
      } catch (refreshError) {
        throw refreshError;
      }
    }
    throw error;
  }
};


export const api = {
  async get(endpoint: string) {
    return request(endpoint, {
      method: 'GET',
    });
  },

  async post(endpoint: string, body: unknown) {
    return request(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  },

  async refreshSession() {
    const data = await refreshToken();
    // After a successful refresh, the user data is in data.user
    // And the new access token is already set by refreshToken()
    return data.user;
  }
};
