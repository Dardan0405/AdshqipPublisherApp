import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  RefreshControl, TouchableOpacity, Dimensions,
} from 'react-native';
import Svg, {
  Path, Line, Text as SvgText, Defs, LinearGradient, Stop,
} from 'react-native-svg';
import { getDashboard } from '../../api/publisher';
import { DashboardData } from '../../types/publisher';
import useAuthStore from '../../stores/authStore';

const fmt = (n: number) => `€${n.toFixed(2)}`;
const fmtK = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
const SCREEN_W = Dimensions.get('window').width;

type ChartMode = 'earnings' | 'impressions';

function EarningsChart({
  data,
  mode,
}: {
  data: Array<{ date: string; impressions: number; earnings: number }>;
  mode: ChartMode;
}) {
  if (!data || data.length < 2) return null;

  const W = SCREEN_W - 32;
  const H = 150;
  const PL = 46, PR = 12, PT = 10, PB = 28;
  const cW = W - PL - PR;
  const cH = H - PT - PB;

  const values = data.map((d) => (mode === 'earnings' ? d.earnings : d.impressions));
  const maxV = Math.max(...values, 0.001);

  const scaleX = (i: number) => PL + (i / (data.length - 1)) * cW;
  const scaleY = (v: number) => PT + cH - (v / maxV) * cH;

  const pts = data.map((d, i) => ({
    x: scaleX(i),
    y: scaleY(mode === 'earnings' ? d.earnings : d.impressions),
  }));

  const linePath = pts
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ');
  const areaPath = `${linePath} L${pts[pts.length - 1].x.toFixed(1)},${(PT + cH).toFixed(1)} L${pts[0].x.toFixed(1)},${(PT + cH).toFixed(1)} Z`;

  const yLabels = [
    { v: 0, y: scaleY(0) },
    { v: maxV / 2, y: scaleY(maxV / 2) },
    { v: maxV, y: scaleY(maxV) },
  ];

  const midIdx = Math.floor(data.length / 2);
  const xLabels = [
    { label: data[0].date.slice(5), x: scaleX(0) },
    { label: data[midIdx].date.slice(5), x: scaleX(midIdx) },
    { label: data[data.length - 1].date.slice(5), x: scaleX(data.length - 1) },
  ];

  const formatY = (v: number) =>
    mode === 'earnings'
      ? `€${v >= 100 ? v.toFixed(0) : v.toFixed(2)}`
      : v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0);

  return (
    <Svg width={W} height={H}>
      <Defs>
        <LinearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#6366f1" stopOpacity="0.25" />
          <Stop offset="1" stopColor="#6366f1" stopOpacity="0" />
        </LinearGradient>
      </Defs>
      {yLabels.map((l, i) => (
        <Line key={i} x1={PL} y1={l.y} x2={W - PR} y2={l.y} stroke="#e5e7eb" strokeWidth={1} />
      ))}
      <Path d={areaPath} fill="url(#areaGrad)" />
      <Path
        d={linePath}
        fill="none"
        stroke="#6366f1"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {yLabels.map((l, i) => (
        <SvgText key={i} x={PL - 4} y={l.y + 4} fontSize={9} fill="#9ca3af" textAnchor="end">
          {formatY(l.v)}
        </SvgText>
      ))}
      {xLabels.map((l, i) => (
        <SvgText key={i} x={l.x} y={H - 6} fontSize={9} fill="#9ca3af" textAnchor="middle">
          {l.label}
        </SvgText>
      ))}
    </Svg>
  );
}

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
  const [chartMode, setChartMode] = useState<ChartMode>('earnings');
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
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(true); }}
          tintColor="#6366f1"
        />
      }
    >
      <View style={s.header}>
        <Text style={s.greeting}>Welcome back</Text>
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

      <View style={s.chartSection}>
        <View style={s.chartHeader}>
          <Text style={s.sectionTitle2}>Last 30 Days</Text>
          <View style={s.chartToggle}>
            <TouchableOpacity
              style={[s.toggleBtn, chartMode === 'earnings' && s.toggleBtnActive]}
              onPress={() => setChartMode('earnings')}
            >
              <Text style={[s.toggleText, chartMode === 'earnings' && s.toggleTextActive]}>
                Earn
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.toggleBtn, chartMode === 'impressions' && s.toggleBtnActive]}
              onPress={() => setChartMode('impressions')}
            >
              <Text style={[s.toggleText, chartMode === 'impressions' && s.toggleTextActive]}>
                Impr
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={s.chartContainer}>
          <EarningsChart data={data?.chart_data ?? []} mode={chartMode} />
        </View>
      </View>

      <View style={s.row}>
        <StatCard
          label="Impressions"
          value={fmtK(data?.metrics.impressions ?? 0)}
          change={data?.metrics.impressions_change}
        />
        <StatCard
          label="Clicks"
          value={fmtK(data?.metrics.clicks ?? 0)}
          change={data?.metrics.clicks_change}
        />
      </View>
      <View style={[s.row, { marginBottom: 32 }]}>
        <StatCard
          label="Revenue"
          value={fmt(data?.metrics.revenue ?? 0)}
          change={data?.metrics.revenue_change}
        />
        <StatCard
          label="Forecast"
          value={fmt(data?.earnings.forecast ?? 0)}
          change={data?.earnings.forecast_pct}
        />
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
  sectionTitle: {
    fontSize: 16, fontWeight: '700', color: '#374151',
    marginHorizontal: 16, marginTop: 20, marginBottom: 10,
  },
  sectionTitle2: { fontSize: 16, fontWeight: '700', color: '#374151' },
  row: { flexDirection: 'row', paddingHorizontal: 12, gap: 8, marginBottom: 8 },
  card: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  cardLabel: { fontSize: 12, color: '#9ca3af', marginBottom: 4 },
  cardValue: { fontSize: 18, fontWeight: '700', color: '#111827' },
  cardChange: { fontSize: 12, marginTop: 2 },
  chartSection: {
    marginHorizontal: 16, marginTop: 20, marginBottom: 12,
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  chartHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12,
  },
  chartContainer: { alignItems: 'center' },
  chartToggle: { flexDirection: 'row', gap: 6 },
  toggleBtn: {
    paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 20, backgroundColor: '#f3f4f6',
  },
  toggleBtnActive: { backgroundColor: '#6366f1' },
  toggleText: { fontSize: 12, fontWeight: '600', color: '#6b7280' },
  toggleTextActive: { color: '#fff' },
});
