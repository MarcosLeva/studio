
import {toast} from '@/hooks/use-toast';

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

const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('authToken');
  }
  return null;
};

const handleResponse = async (response: Response) => {
    const json = await response.json();

    if (!response.ok) {
        // Handles HTTP errors (e.g., 401, 404, 500)
        throw new Error(json.message || `Error: ${response.statusText}`);
    }
    
    if (json.success === false) {
      // Handles logical errors from the API (e.g., bad input where status is 200 OK)
      throw new Error(json.message || 'La API indicó un fallo en la operación.');
    }

    // Returns the actual data from the response payload
    return json.data;
}

export const api = {
  async get(endpoint: string) {
    const url = `${getApiUrl()}${endpoint}`;
    const token = getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });
    return handleResponse(response);
  },

  async post(endpoint: string, body: unknown) {
    const url = `${getApiUrl()}${endpoint}`;
    const token = getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token && endpoint !== '/auth/login') {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    
    return handleResponse(response);
  },
};
