import client from './client';

// ── Dashboard ────────────────────────────────────────────────────────────────
export const getDashboard = () =>
  client.get('/publisher/dashboard').then((r) => r.data);

// ── Notifications ────────────────────────────────────────────────────────────
export const getNotifications = (page = 1) =>
  client.get('/publisher/notifications', { params: { page } }).then((r) => r.data);

export const markNotificationRead = (id: number) =>
  client.post(`/publisher/notifications/${id}/read`).then((r) => r.data);

export const markAllNotificationsRead = () =>
  client.post('/publisher/notifications/read-all').then((r) => r.data);

// ── Sites ────────────────────────────────────────────────────────────────────
export const getSites = (params?: { search?: string; page?: number }) =>
  client.get('/publisher/sites', { params }).then((r) => r.data);

export const getSite = (id: number) =>
  client.get(`/publisher/sites/${id}`).then((r) => r.data);

export const createSite = (data: { name: string; url: string; category_ids?: number[] }) =>
  client.post('/publisher/sites', data).then((r) => r.data);

export const updateSite = (id: number, data: { name: string; url: string; category_ids?: number[] }) =>
  client.put(`/publisher/sites/${id}`, data).then((r) => r.data);

export const deleteSite = (id: number) =>
  client.delete(`/publisher/sites/${id}`).then((r) => r.data);

// ── Apps ─────────────────────────────────────────────────────────────────────
export const getApps = (params?: { search?: string; page?: number }) =>
  client.get('/publisher/apps', { params }).then((r) => r.data);

export const getApp = (id: number) =>
  client.get(`/publisher/apps/${id}`).then((r) => r.data);

export const createApp = (data: { application_type: string; app_url: string; app_name: string; category: string }) =>
  client.post('/publisher/apps', data).then((r) => r.data);

export const updateApp = (id: number, data: { application_type: string; app_url: string; app_name: string; category: string }) =>
  client.put(`/publisher/apps/${id}`, data).then((r) => r.data);

export const deleteApp = (id: number) =>
  client.delete(`/publisher/apps/${id}`).then((r) => r.data);

// ── Ad Blocks ─────────────────────────────────────────────────────────────────
export const getAdBlocks = (params?: { search?: string; page?: number }) =>
  client.get('/publisher/adblocks', { params }).then((r) => r.data);

export const getAdBlock = (id: number) =>
  client.get(`/publisher/adblocks/${id}`).then((r) => r.data);

export const getAdBlockTag = (id: number) =>
  client.get(`/publisher/adblocks/${id}/tag`).then((r) => r.data);

export const createAdBlock = (data: Record<string, unknown>) =>
  client.post('/publisher/adblocks', data).then((r) => r.data);

export const updateAdBlock = (id: number, data: Record<string, unknown>) =>
  client.put(`/publisher/adblocks/${id}`, data).then((r) => r.data);

export const deleteAdBlock = (id: number) =>
  client.delete(`/publisher/adblocks/${id}`).then((r) => r.data);

// ── Reports ───────────────────────────────────────────────────────────────────
export const getOverviewReport = (params?: { start_date?: string; end_date?: string; page?: number }) =>
  client.get('/publisher/reports/overview', { params }).then((r) => r.data);

export const getGeoReport = (params?: { start_date?: string; end_date?: string }) =>
  client.get('/publisher/reports/geo', { params }).then((r) => r.data);

export const getSitesReport = (params?: { start_date?: string; end_date?: string }) =>
  client.get('/publisher/reports/sites', { params }).then((r) => r.data);

export const getAppsReport = (params?: { start_date?: string; end_date?: string }) =>
  client.get('/publisher/reports/apps', { params }).then((r) => r.data);

// ── Earnings ──────────────────────────────────────────────────────────────────
export const getEarnings = (params?: { start_month?: string; end_month?: string; page?: number }) =>
  client.get('/publisher/earnings', { params }).then((r) => r.data);

// ── Wallet ────────────────────────────────────────────────────────────────────
export const getWallet = (params?: { start_date?: string; end_date?: string; type?: string; page?: number }) =>
  client.get('/publisher/wallet', { params }).then((r) => r.data);

// ── Payouts ───────────────────────────────────────────────────────────────────
export const getPayouts = (page = 1) =>
  client.get('/publisher/payouts', { params: { page } }).then((r) => r.data);

export const getPayout = (id: number) =>
  client.get(`/publisher/payouts/${id}`).then((r) => r.data);

export const requestPayout = (data: { amount: number; notes?: string }) =>
  client.post('/publisher/payouts', data).then((r) => r.data);

// ── Referrals ─────────────────────────────────────────────────────────────────
export const getReferrals = (page = 1) =>
  client.get('/publisher/referrals', { params: { page } }).then((r) => r.data);

// ── Profile ───────────────────────────────────────────────────────────────────
export const getProfile = () =>
  client.get('/publisher/profile').then((r) => r.data);

export const updatePersonalInfo = (data: {
  first_name: string; last_name: string; gender?: string;
  date_of_birth?: string; mobile_number?: string;
  city?: string; state_region?: string; country_code?: string; postal_code?: string;
}) => client.put('/publisher/profile/personal', data).then((r) => r.data);

export const updatePayoutSettings = (data: {
  payout_method: string; payout_details: Record<string, string>; currency?: string;
}) => client.put('/publisher/profile/payout', data).then((r) => r.data);

// ── KYC ───────────────────────────────────────────────────────────────────────
export const getKyc = () =>
  client.get('/publisher/kyc').then((r) => r.data);

export const submitKyc = (formData: FormData) =>
  client.post('/publisher/kyc', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data);

// ── Two-Factor Auth ───────────────────────────────────────────────────────────
export const getTwoFactor = () =>
  client.get('/publisher/two-factor').then((r) => r.data);

export const updateTwoFactor = (data: {
  token_types: string[];
  two_factor_phone?: string | null;
  two_factor_email?: string | null;
}) => client.put('/publisher/two-factor', data).then((r) => r.data);

// ── API Keys ──────────────────────────────────────────────────────────────────
export const getApiKeys = () =>
  client.get('/publisher/api-keys').then((r) => r.data);

export const createApiKey = (data: { name: string; permissions?: string[]; rate_limit_per_minute?: number }) =>
  client.post('/publisher/api-keys', data).then((r) => r.data);

export const revokeApiKey = (id: number) =>
  client.post(`/publisher/api-keys/${id}/revoke`).then((r) => r.data);

export const activateApiKey = (id: number) =>
  client.post(`/publisher/api-keys/${id}/activate`).then((r) => r.data);

export const deleteApiKey = (id: number) =>
  client.delete(`/publisher/api-keys/${id}`).then((r) => r.data);
