import { clearMockToken, getCurrentUser, getMockToken, mockBingoCenters, mockRechargeHistory, mockUsers, setCurrentUser, setMockToken, simulateNetworkDelay } from './mockData';
import { ApiResponse, BingoCenter, LoginRequest, LoginResponse, MockUser, RechargeHistory, User } from './types';

class MockApiService {
  private baseUrl = 'https://api.example.com';

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    await simulateNetworkDelay();

    const user = mockUsers.find(
      u => u.username === credentials.username && u.password === credentials.password
    );

    if (user) {
      if (user.isBanned) {
        return {
          success: false,
          error: 'Your account has been banned',
        };
      }

      const token = `mock-jwt-token-${user.username}-${Date.now()}`;
      setMockToken(token);
      setCurrentUser(user);

      return {
        success: true,
        token,
        user: {
          username: user.username,
          full_name: user.full_name,
          email: user.email,
          password: user.password,
          role: user.role,
          profile_pic_url: user.profile_pic_url,
          isBanned: user.isBanned,
          createdAt: new Date().toISOString(),
        },
      };
    }

    return {
      success: false,
      error: 'Invalid username or password',
    };
  }

  async logout(): Promise<void> {
    await simulateNetworkDelay(200);
    clearMockToken();
  }

  async getCurrentUser(): Promise<ApiResponse<User | null>> {
    await simulateNetworkDelay(300);

    const user = getCurrentUser();
    if (!user) {
      return {
        data: null,
        success: false,
        error: 'No authenticated user',
      };
    }

    return {
      data: {
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        password: user.password,
        role: user.role,
        profile_pic_url: user.profile_pic_url,
        isBanned: user.isBanned,
        createdAt: new Date().toISOString(),
      },
      success: true,
    };
  }

  isAuthenticated(): boolean {
    return getMockToken() !== null;
  }

  // Operators management
  async getOperators(): Promise<ApiResponse<MockUser[]>> {
    await simulateNetworkDelay();
    const operators = mockUsers.filter(u => u.role === 'OPERATOR');
    return { data: operators, success: true };
  }

  async createOperator(data: Omit<MockUser, 'username'> & { username: string }): Promise<ApiResponse<MockUser>> {
    await simulateNetworkDelay();
    const newOperator: MockUser = {
      ...data,
      role: 'OPERATOR',
      isBanned: false,
      profile_pic_url: data.profile_pic_url || 'https://res.cloudinary.com/demo/image/upload/default_avatar.jpg',
    };
    mockUsers.push(newOperator);
    return { data: newOperator, success: true };
  }

  async toggleOperatorBan(username: string): Promise<ApiResponse<MockUser>> {
    await simulateNetworkDelay();
    const operator = mockUsers.find(u => u.username === username);
    if (operator) {
      operator.isBanned = !operator.isBanned;
      return { data: operator, success: true };
    }
    return { data: null as MockUser, success: false, error: 'Operator not found' };
  }

  async resetOperatorPassword(username: string, newPassword: string): Promise<ApiResponse<boolean>> {
    await simulateNetworkDelay();
    const operator = mockUsers.find(u => u.username === username);
    if (operator) {
      operator.password = newPassword;
      return { data: true, success: true };
    }
    return { data: false, success: false, error: 'Operator not found' };
  }

  // Bingo Centers management
  async getBingoCenters(createdBy?: string): Promise<ApiResponse<BingoCenter[]>> {
    await simulateNetworkDelay();
    let centers = mockBingoCenters;
    if (createdBy) {
      centers = centers.filter(c => c.createdBy === createdBy);
    }
    return { data: centers, success: true };
  }

  async createBingoCenter(data: Omit<BingoCenter, 'userID' | 'createdAt'>): Promise<ApiResponse<BingoCenter>> {
    await simulateNetworkDelay();
    const newCenter: BingoCenter = {
      ...data,
      userID: mockBingoCenters.length + 1,
      createdAt: new Date().toISOString(),
    };
    mockBingoCenters.push(newCenter);
    return { data: newCenter, success: true };
  }

  async rechargeBalance(data: {
    bingoCenterUsername: string;
    generatedAmount: number;
    actualAmount: number;
    debitedBy: string;
  }): Promise<ApiResponse<RechargeHistory>> {
    await simulateNetworkDelay();

    const center = mockBingoCenters.find(c => c.username === data.bingoCenterUsername);
    if (!center) {
      return { data: null as RechargeHistory, success: false, error: 'Bingo center not found' };
    }

    center.balance += data.generatedAmount;

    const recharge: RechargeHistory = {
      id: mockRechargeHistory.length + 1,
      actualAmount: data.actualAmount,
      generatedAmount: data.generatedAmount,
      bingoCenterUsername: data.bingoCenterUsername,
      debitedBy: data.debitedBy,
      timestamp: new Date().toISOString(),
    };
    mockRechargeHistory.push(recharge);

    return { data: recharge, success: true };
  }

  // Transactions
  async getRechargeHistory(debitedBy?: string): Promise<ApiResponse<RechargeHistory[]>> {
    await simulateNetworkDelay();
    let history = mockRechargeHistory;
    if (debitedBy) {
      history = history.filter(h => h.debitedBy === debitedBy);
    }
    return { data: history, success: true };
  }

  // Analytics
  async getSystemAnalytics(): Promise<ApiResponse<{
    totalBalance: number;
    activeCenters: number;
    todayGeneratedTopups: number;
  }>> {
    await simulateNetworkDelay();
    const totalBalance = mockBingoCenters.reduce((sum, c) => sum + c.balance, 0);
    const activeCenters = mockBingoCenters.length;
    const todayGeneratedTopups = mockRechargeHistory
      .filter(h => h.timestamp.startsWith(new Date().toISOString().split('T')[0]))
      .reduce((sum, h) => sum + h.generatedAmount, 0);

    return {
      data: {
        totalBalance,
        activeCenters,
        todayGeneratedTopups,
      },
      success: true,
    };
  }

  // Profile management
  async updateProfile(username: string, data: Partial<MockUser>): Promise<ApiResponse<MockUser>> {
    await simulateNetworkDelay();
    const user = mockUsers.find(u => u.username === username);
    if (user) {
      Object.assign(user, data);
      setCurrentUser(user);
      return { data: user, success: true };
    }
    return { data: null as MockUser, success: false, error: 'User not found' };
  }
}

export const mockApiService = new MockApiService();
export default mockApiService;
