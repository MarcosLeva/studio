export interface Category {
  id: string;
  name: string;
  aiModel: string;
  createdAt: string;
  description: string;
  prompt: string;
  instructions: string;
}

export interface ScanResult {
  id: string;
  category: string;
  catalogName: string;
  dateScanned: string;
  analysis: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    avatar: string;
    role: string;
    status: 'activo' | 'inactivo' | 'pendiente' | 'suspendido';
}
