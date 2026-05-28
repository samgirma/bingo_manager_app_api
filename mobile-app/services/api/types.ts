export type UserRole = 'ADMIN' | 'OPERATOR';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: User;
  error?: string;
}

export interface User {
  username: string;
  full_name: string;
  email: string;
  password?: string;
  role: UserRole;
  profile_pic_url?: string;
  isBanned: boolean;
  createdAt: string;
}

export interface BingoCenter {
  userID: number;
  username: string;
  password: string;
  balance: number;
  mac_address: string;
  createdBy: string;
  createdAt: string;
}

export interface RechargeHistory {
  id: number;
  actualAmount: number;
  generatedAmount: number;
  bingoCenterUsername: string;
  debitedBy: string;
  timestamp: string;
}

export interface ApiResponse<T> {
  data: T | null;
  success: boolean;
  error?: string;
}

export interface EncryptedFilePayload {
  fileName: string;
  iv: string;
  ciphertext: string;
  keyFingerprint: string;
  format: 'AES-256-CBC';
  timestamp: string;
  fileContent: string;
}

export interface MockUser {
  username: string;
  password?: string;
  full_name: string;
  email: string;
  role: UserRole;
  profile_pic_url?: string;
  isBanned: boolean;
}
