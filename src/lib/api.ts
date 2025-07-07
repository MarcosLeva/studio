
import {toast} from '@/hooks/use-toast';

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

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export const setToken = (token: string | null) => {
  accessToken = token;
};

const handleResponse = async (response: Response) => {
    // On a 401, we don't parse the body right away, we let the caller handle the refresh logic.
    if (response.status === 401) {
        return Promise.reject(response);
    }

    const json = await response.json();

    if (!response.ok) {
        throw new Error(json.message || `Error: ${response.statusText}`);
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

    try {
        const url = `${getApiUrl()}/auth/refresh`;
        const response = await fetch(url, {
            method: 'POST',
            credentials: 'include', // This sends the HttpOnly cookie to the backend
        });

        if (!response.ok) {
            const error = new Error('Session expired. Please log in again.');
            processQueue(error, null);
            setToken(null);
            if (typeof window !== 'undefined') localStorage.removeItem('user');
            throw error;
        }

        const data = await handleResponse(response);
        const newAccessToken = data.access_token;
        setToken(newAccessToken);
        processQueue(null, newAccessToken);
        return newAccessToken;
    } catch (error) {
        processQueue(error as Error, null);
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
    if (response.status === 401) {
        await refreshToken();
        headers.set('Authorization', `Bearer ${accessToken}`);
        const retryResponse = await fetch(url, { ...options, headers });
        return handleResponse(retryResponse);
    }
    return handleResponse(response);
  } catch (error) {
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
    await refreshToken();
    return this.get('/auth/profile');
  }
};
