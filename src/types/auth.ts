export interface User {
  id: number;
  email: string;
  role: 'publisher';
  status: string;
  referral_code?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface SecurityQuestionPayload {
  email: string;
  answer: string;
}
