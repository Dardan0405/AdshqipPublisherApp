import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { getDashboard } from '../../api/publisher';
import { DashboardData } from '../../types/publisher';
import useAuthStore from '../../stores/authStore';

const fmt = (n: number) => `€${n.toFixed(2)}`;
const fmtK = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

function StatCard({ label, value, change }: { label: string; value: string; change?: number }) {
  const pos = change !== undefined && change >= 0;
  return (
    <View style={s.card}>
      <Text style={s.cardLabel}>{label}</Text>
      <Text style={s.cardValue}>{value}</Text>
      {change !== undefined && (
        <Text style={[s.cardChange, { color: pos ? '#10b981' : '#ef4444' }]}>
          {pos ? '▲' : '▼'} {Math.abs(change)}%
        </Text>
      )}
    </View>
  );
}

export default function DashboardScreen() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const logout = useAuthStore((st) => st.logout);
  const user = useAuthStore((st) => st.user);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      setData(await getDashboard());
    } catch (err: any) {
      if (err?.response?.status === 401) logout();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return <View style={s.center}><ActivityIndicator size="large" color="#6366f1" /></View>;
  }

  return (
    <ScrollView
      style={s.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor="#6366f1" />}
    >
      <View style={s.header}>
        <Text style={s.greeting}>Welcome back 👋</Text>
        <Text style={s.email}>{user?.email}</Text>
        <Text style={s.balance}>Balance: {fmt(data?.balance ?? 0)}</Text>
      </View>

      <Text style={s.sectionTitle}>Earnings</Text>
      <View style={s.row}>
        <StatCard label="Today" value={fmt(data?.earnings.today ?? 0)} />
        <StatCard label="This Week" value={fmt(data?.earnings.this_week ?? 0)} />
      </View>
      <View style={s.row}>
        <StatCard label="This Month" value={fmt(data?.earnings.this_month ?? 0)} />
        <StatCard label="Last Month" value={fmt(data?.earnings.last_month ?? 0)} />
      </View>

      <Text style={s.sectionTitle}>Last 30 Days</Text>
      <View style={s.row}>
        <StatCard label="Impressions" value={fmtK(data?.metrics.impressions ?? 0)} change={data?.metrics.impressions_change} />
        <StatCard label="Clicks" value={fmtK(data?.metrics.clicks ?? 0)} change={data?.metrics.clicks_change} />
      </View>
      <View style={s.row}>
        <StatCard label="Revenue" value={fmt(data?.metrics.revenue ?? 0)} change={data?.metrics.revenue_change} />
        <StatCard label="Forecast" value={fmt(data?.earnings.forecast ?? 0)} change={data?.earnings.forecast_pct} />
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#6366f1', padding: 24, paddingTop: 56 },
  greeting: { fontSize: 22, fontWeight: '700', color: '#fff' },
  email: { fontSize: 13, color: '#c7d2fe', marginTop: 2 },
  balance: { fontSize: 16, color: '#fff', marginTop: 12, fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginHorizontal: 16, marginTop: 20, marginBottom: 10 },
  row: { flexDirection: 'row', paddingHorizontal: 12, gap: 8, marginBottom: 8 },
  card: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  cardLabel: { fontSize: 12, color: '#9ca3af', marginBottom: 4 },
  cardValue: { fontSize: 18, fontWeight: '700', color: '#111827' },
  cardChange: { fontSize: 12, marginTop: 2 },
});
