export interface Category {
  id: string;
  name: string;
  aiModel: string;
  dateCreated: string;
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
}
