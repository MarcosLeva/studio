
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
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || 'Ocurrió un error inesperado.');
    }
    return response.json();
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
    // For login, we don't send the token, but for other post requests we might need it.
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
