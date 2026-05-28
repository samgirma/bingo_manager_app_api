import { MockUser } from './types';

export const mockUsers: MockUser[] = [
  {
    username: 'admin',
    password: 'admin123',
    full_name: 'System Administrator',
    email: 'admin@bingo.com',
    role: 'ADMIN',
    profile_pic_url: 'https://res.cloudinary.com/demo/image/upload/v1234567890/admin_avatar.jpg',
    isBanned: false,
  },
  {
    username: 'operator1',
    password: 'operator123',
    full_name: 'John Operator',
    email: 'john@bingo.com',
    role: 'OPERATOR',
    profile_pic_url: 'https://res.cloudinary.com/demo/image/upload/v1234567890/operator1_avatar.jpg',
    isBanned: false,
  },
];

export const mockBingoCenters: BingoCenter[] = [
  {
    userID: 1,
    username: 'bingo_center_001',
    password: 'center123',
    balance: 5000.00,
    mac_address: '00:1A:2B:3C:4D:5E',
    createdBy: 'operator1',
    createdAt: '2026-01-15T10:30:00Z',
  },
  {
    userID: 2,
    username: 'bingo_center_002',
    password: 'center456',
    balance: 3200.50,
    mac_address: '00:1A:2B:3C:4D:5F',
    createdBy: 'operator1',
    createdAt: '2026-02-20T14:45:00Z',
  },
];

export const mockRechargeHistory: RechargeHistory[] = [
  {
    id: 1,
    actualAmount: 1000.00,
    generatedAmount: 1200.00,
    bingoCenterUsername: 'bingo_center_001',
    debitedBy: 'operator1',
    timestamp: '2026-05-14T10:30:00Z',
  },
  {
    id: 2,
    actualAmount: 500.00,
    generatedAmount: 600.00,
    bingoCenterUsername: 'bingo_center_002',
    debitedBy: 'operator1',
    timestamp: '2026-05-14T11:45:00Z',
  },
];

let mockToken: string | null = null;
let currentUser: MockUser | null = null;

export const getMockToken = (): string | null => mockToken;
export const setMockToken = (token: string | null): void => { mockToken = token; };
export const getCurrentUser = (): MockUser | null => currentUser;
export const setCurrentUser = (user: MockUser | null): void => { currentUser = user; };
export const clearMockToken = (): void => { mockToken = null; currentUser = null; };

export const simulateNetworkDelay = (ms: number = 500): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};
