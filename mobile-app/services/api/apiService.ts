import type { ApiResponse, BingoCenter, EncryptedFilePayload, LoginRequest, LoginResponse, RechargeHistory, User } from './types';
import * as SecureStore from 'expo-secure-store';

const BASE_URL =  ' https://gotta-medium-mega-strike.trycloudflare.com ' //__DEV__ ? 'http://localhost:3000' : 'https://api.bingomanager.com';

const REMEMBERED_TOKEN_KEY = 'bingo_remembered_token';
const REMEMBERED_USER_KEY = 'bingo_remembered_user';
const REMEMBERED_EXPIRY_KEY = 'bingo_remembered_expiry';
const REMEMBER_DAYS = 7;

class ApiService {
  private token: string | null = null;
  private currentUser: User | null = null;

  private get headers(): Record<string, string> {
    const h: Record<string, string> = {
      'Content-Type': 'application/json',
      'bypass-tunnel-reminder': 'true',
    };
    if (this.token) h['Authorization'] = `Bearer ${this.token}`;
    return h;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    const { apiResponse } = await this.requestRaw<T>(path, options);
    return apiResponse;
  }

  /** Like `request` but also returns the full JSON body so callers can
   *  access extra backend fields (e.g. `encryptedFile`). */
  private async requestRaw<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<{ apiResponse: ApiResponse<T>; body: Record<string, unknown> }> {
    try {
      const res = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: { ...this.headers, ...(options.headers as Record<string, string> || {}) },
      });
      const body = await res.json();
      if (!res.ok) {
        return { apiResponse: { data: null, success: false, error: body.error || `HTTP ${res.status}` }, body };
      }
      return { apiResponse: { data: body.data ?? body, success: true }, body };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error';
      return { apiResponse: { data: null, success: false, error: msg }, body: {} };
    }
  }

  // ── Auth ──────────────────────────────────────────────────────

  async login(credentials: LoginRequest, rememberMe = false): Promise<LoginResponse> {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    const body = await res.json();
    if (!res.ok || !body.success) {
      return { success: false, error: body.error || 'Login failed' };
    }
    this.token = body.token;
    this.currentUser = body.user;

    if (rememberMe) {
      const expiry = Date.now() + REMEMBER_DAYS * 24 * 60 * 60 * 1000;
      await SecureStore.setItemAsync(REMEMBERED_TOKEN_KEY, body.token);
      await SecureStore.setItemAsync(REMEMBERED_USER_KEY, JSON.stringify(body.user));
      await SecureStore.setItemAsync(REMEMBERED_EXPIRY_KEY, String(expiry));
    }

    return body;
  }

  async logout(): Promise<void> {
    await this.request('/api/auth/logout', { method: 'POST' });
    this.token = null;
    this.currentUser = null;
    await this.clearRememberedSession();
  }

  /** Restore a previously remembered session. Returns true if a valid token was restored. */
  async restoreRememberedSession(): Promise<boolean> {
    try {
      const expiryStr = await SecureStore.getItemAsync(REMEMBERED_EXPIRY_KEY);
      if (!expiryStr) return false;

      const expiry = Number(expiryStr);
      if (Date.now() > expiry) {
        await this.clearRememberedSession();
        return false;
      }

      const token = await SecureStore.getItemAsync(REMEMBERED_TOKEN_KEY);
      const userJson = await SecureStore.getItemAsync(REMEMBERED_USER_KEY);
      if (!token || !userJson) return false;

      this.token = token;
      this.currentUser = JSON.parse(userJson);
      return true;
    } catch {
      await this.clearRememberedSession();
      return false;
    }
  }

  async clearRememberedSession(): Promise<void> {
    await SecureStore.deleteItemAsync(REMEMBERED_TOKEN_KEY).catch(() => {});
    await SecureStore.deleteItemAsync(REMEMBERED_USER_KEY).catch(() => {});
    await SecureStore.deleteItemAsync(REMEMBERED_EXPIRY_KEY).catch(() => {});
  }

  async getCurrentUser(): Promise<ApiResponse<User | null>> {
    const res = await this.request<User>('/api/auth/me');
    if (res.success && res.data) this.currentUser = res.data;
    return res;
  }

  isAuthenticated(): boolean {
    return this.token !== null;
  }

  getCurrentUserSync(): (User & { password?: string }) | null {
    return this.currentUser;
  }

  // ── Operators ─────────────────────────────────────────────────

  async getOperators(): Promise<ApiResponse<User[]>> {
    return this.request<User[]>('/api/operators');
  }

  async createOperator(data: {
    username: string;
    full_name: string;
    email: string;
    password: string;
    profile_pic_url?: string;
  }): Promise<ApiResponse<User>> {
    return this.request<User>('/api/operators', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async toggleOperatorBan(username: string): Promise<ApiResponse<User>> {
    return this.request<User>(`/api/operators/${encodeURIComponent(username)}/ban`, {
      method: 'PUT',
    });
  }

  async resetOperatorPassword(username: string, newPassword: string): Promise<ApiResponse<boolean>> {
    return this.request<boolean>(`/api/operators/${encodeURIComponent(username)}/reset-password`, {
      method: 'PUT',
      body: JSON.stringify({ newPassword }),
    });
  }

  // ── Bingo Centers ─────────────────────────────────────────────

  async getBingoCenters(createdBy?: string): Promise<ApiResponse<BingoCenter[]>> {
    const qs = createdBy ? `?createdBy=${encodeURIComponent(createdBy)}` : '';
    return this.request<BingoCenter[]>(`/api/bingo-centers${qs}`);
  }

  async createBingoCenter(data: {
    full_name: string;
    username: string;
    password: string;
    mac_address: string;
    balance: number;
    actualAmount: number;
    createdBy?: string;
  }): Promise<ApiResponse<BingoCenter> & { encryptedFile?: EncryptedFilePayload }> {
    const { apiResponse, body } = await this.requestRaw<BingoCenter>('/api/bingo-centers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return Object.assign(apiResponse, { encryptedFile: body.encryptedFile as EncryptedFilePayload | undefined });
  }

  async rechargeBalance(data: {
    bingoCenterUsername: string;
    generatedAmount: number;
    actualAmount: number;
    debitedBy: string;
  }): Promise<ApiResponse<RechargeHistory> & { encryptedFile?: EncryptedFilePayload }> {
    const { apiResponse, body } = await this.requestRaw<RechargeHistory>('/api/bingo-centers/recharge', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return Object.assign(apiResponse, { encryptedFile: body.encryptedFile as EncryptedFilePayload | undefined });
  }

  // ── Transactions ──────────────────────────────────────────────

  async getRechargeHistory(debitedBy?: string): Promise<ApiResponse<RechargeHistory[]>> {
    const qs = debitedBy ? `?debitedBy=${encodeURIComponent(debitedBy)}` : '';
    return this.request<RechargeHistory[]>(`/api/transactions${qs}`);
  }

  // ── Analytics ─────────────────────────────────────────────────

  async getSystemAnalytics(): Promise<ApiResponse<{
    totalBalance: number;
    activeCenters: number;
    todayGeneratedTopups: number;
  }>> {
    return this.request('/api/analytics');
  }

  // ── Profile ───────────────────────────────────────────────────

  async updateProfile(username: string, data: Partial<User>): Promise<ApiResponse<User>> {
    return this.request<User>('/api/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async uploadProfilePic(uri: string): Promise<ApiResponse<{ profile_pic_url: string; width: number; height: number }>> {
    try {
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'profile.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      // On web, fetch the URI as a Blob first; on native, use the { uri, name, type } trick
      if (uri.startsWith('http://') || uri.startsWith('https://') || uri.startsWith('blob:') || uri.startsWith('data:')) {
        const resp = await fetch(uri);
        const blob = await resp.blob();
        formData.append('image', blob, filename);
      } else {
        // Native (file:// URIs) — React Native's FormData polyfill handles this
        formData.append('image', { uri, name: filename, type } as unknown as Blob);
      }

      const res = await fetch(`${BASE_URL}/api/upload/profile-pic`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.token}` },
        body: formData,
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        return { data: null, success: false, error: body.error || `HTTP ${res.status}` };
      }
      if (body.data?.profile_pic_url && this.currentUser) {
        this.currentUser = { ...this.currentUser, profile_pic_url: body.data.profile_pic_url };
      }
      return { data: body.data, success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      return { data: null, success: false, error: msg };
    }
  }

  // ── Password Reset ──────────────────────────────────────────

  async forgotPassword(email: string): Promise<ApiResponse<{ message: string }>> {
    return this.request('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async verifyOtp(email: string, otp: string): Promise<ApiResponse<{ message: string }>> {
    return this.request('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  }

  async resetPassword(email: string, otp: string, newPassword: string): Promise<ApiResponse<{ message: string }>> {
    return this.request('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, otp, newPassword }),
    });
  }
}

export const apiService = new ApiService();
export default apiService;
