import client from './client';
import { LoginPayload, RegisterPayload, AuthResponse, SecurityQuestionPayload } from '../types/auth';

export const login = (payload: LoginPayload) =>
  client.post<AuthResponse>('/login', payload).then((r) => r.data);

export const register = (payload: RegisterPayload) =>
  client.post<AuthResponse>('/register', payload).then((r) => r.data);

export const verifySecurityQuestion = (payload: SecurityQuestionPayload) =>
  client.post('/verify-security-question', payload).then((r) => r.data);

export const getMe = () =>
  client.get('/me').then((r) => r.data);
