export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface DashboardData {
  earnings: {
    today: number;
    this_week: number;
    this_month: number;
    last_month: number;
    forecast: number;
    forecast_pct: number;
  };
  metrics: {
    impressions: number;
    impressions_change: number;
    clicks: number;
    clicks_change: number;
    revenue: number;
    revenue_change: number;
  };
  chart_data: Array<{
    date: string;
    impressions: number;
    earnings: number;
  }>;
  balance: number;
}

export interface Site {
  id: number;
  name: string;
  domain: string;
  status: string;
  categories: string[];
  impressions: number;
  clicks: number;
  ctr: number;
  ecpm: number;
  revenue: number;
  created_at: string;
}

export interface App {
  id: number;
  app_name: string;
  app_url: string;
  application_type: string;
  category: string;
  status: string;
  impressions: number;
  clicks: number;
  ctr: number;
  revenue: number;
  created_at: string;
}

export interface AdBlock {
  id: number;
  name: string;
  format_key: string;
  size_key: string;
  zone_type: string;
  choose_type: 'web' | 'app';
  status: string;
  site: { id: number; name: string; domain: string } | null;
  mobile_app: { id: number; name: string } | null;
  impressions: number;
  clicks: number;
  ctr: number;
  ecpm: number;
  revenue: number;
  created_at: string;
}

export interface Payout {
  id: number;
  amount: number;
  currency: string;
  payment_method: string;
  payment_provider: string;
  payment_reference: string;
  payout_status: string;
  period_start: string;
  period_end: string;
  created_at: string;
  invoice_number?: string;
}

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface ReportOverviewRow {
  date: string;
  total_impressions: number;
  total_clicks: number;
  total_earnings: number;
  ecpm: number;
}

export interface GeoReportRow {
  country_code: string;
  total_impressions: number;
  total_clicks: number;
  total_earnings: number;
  ecpm: number;
}

export interface SiteReportRow {
  site_id: number;
  site_name: string;
  site_domain: string;
  total_impressions: number;
  total_clicks: number;
  total_earnings: number;
  ecpm: number;
}

export interface AppReportRow {
  mobile_app_id: number;
  app_name: string;
  total_impressions: number;
  total_clicks: number;
  total_earnings: number;
  ecpm: number;
}

export interface WalletSummary {
  earned: number;
  pending: number;
  paid: number;
  available: number;
  this_month: number;
}

export interface ReferralStats {
  total_referral_income: number;
  total_advertiser_referrals: number;
  total_publisher_referrals: number;
}
