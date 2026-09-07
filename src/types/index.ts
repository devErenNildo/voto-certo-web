export interface User {
  id: number;
  name: string;
  username: string;
  role: 'CANDIDATO' | 'LIDERANCA';
  candidatoId: number | null;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LiderancaResponse {
  id: number;
  userId: number;
  name: string;
  username: string;
  telefone: string;
  dataNascimento?: string;
  bairro: string;
  totalChefes: number;
  totalIntegrantes: number;
  createdAt: string;
}

export interface ChefeFamiliaResponse {
  id: number;
  nome: string;
  cpf: string;
  tituloEleitor: string;
  zona: string;
  secao: string;
  telefone: string;
  dataNascimento?: string;
  endereco: string;
  fotoPerfil?: string | null;
  fotoTitulo?: string | null;
  liderancaId: number;
  liderancaNome: string;
  totalIntegrantes: number;
  createdAt: string;
  updatedAt?: string;
}

export interface IntegranteResponse {
  id: number;
  nome: string;
  tituloEleitor: string;
  zona: string;
  secao: string;
  telefone?: string;
  dataNascimento?: string;
  fotoPerfil?: string | null;
  fotoTitulo?: string | null;
  chefeFamiliaId: number;
  chefeFamiliaNome: string;
  createdAt: string;
  updatedAt?: string;
}

export interface DashboardResponse {
  totalLiderancas: number;
  totalChefesFamilia?: number;
  totalChefes?: number;
  totalIntegrantes: number;
  totalVotos?: number;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
  last: boolean;
  first: boolean;
  empty: boolean;
}
