import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  RefreshControl, TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { EarningsStackParamList } from '../../navigation/AppTabs';
import { getWallet } from '../../api/publisher';
import { WalletSummary, WalletActivity } from '../../types/publisher';

type Props = NativeStackScreenProps<EarningsStackParamList, 'Wallet'>;

// ── Constants ─────────────────────────────────────────────────────────────────

type TypeFilter = '' | 'earning' | 'payout' | 'invoice';

const TYPE_FILTERS: { key: TypeFilter; label: string }[] = [
  { key: '',        label: 'All' },
  { key: 'earning', label: 'Earnings' },
  { key: 'payout',  label: 'Payouts' },
  { key: 'invoice', label: 'Invoices' },
];

const TYPE_META: Record<string, { icon: string; color: string }> = {
  earning: { icon: '↑', color: '#10b981' },
  payout:  { icon: '↓', color: '#6366f1' },
  invoice: { icon: '≡', color: '#64748b' },
};

const STATUS_COLOR: Record<string, string> = {
  earned:     '#10b981',
  pending:    '#f59e0b',
  processing: '#3b82f6',
  completed:  '#6366f1',
  failed:     '#ef4444',
  cancelled:  '#9ca3af',
  reversed:   '#9ca3af',
};

// ── Sub-components ────────────────────────────────────────────────────────────

function SummaryHeader({
  summary,
  onRequestPayout,
}: {
  summary: WalletSummary;
  onRequestPayout: () => void;
}) {
  return (
    <View style={h.wrapper}>
      <View style={h.topRow}>
        <Text style={h.title}>Wallet</Text>
        <TouchableOpacity style={h.payoutBtn} onPress={onRequestPayout}>
          <Text style={h.payoutTxt}>Request Payout</Text>
        </TouchableOpacity>
      </View>

      <View style={h.balanceCard}>
        <Text style={h.balanceLabel}>Available Balance</Text>
        <Text style={h.balanceValue}>€{summary.available.toFixed(2)}</Text>
      </View>

      <View style={h.statsRow}>
        {([
          ['Earned',     summary.earned],
          ['Pending',    summary.pending],
          ['Paid Out',   summary.paid],
          ['This Month', summary.this_month],
        ] as [string, number][]).map(([label, val]) => (
          <View key={label} style={h.statCard}>
            <Text style={h.statLabel}>{label}</Text>
            <Text style={h.statVal}>€{val.toFixed(2)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const h = StyleSheet.create({
  wrapper: { backgroundColor: '#6366f1', paddingHorizontal: 20, paddingTop: 52, paddingBottom: 20 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '700', color: '#fff' },
  payoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 7,
  },
  payoutTxt: { fontSize: 13, fontWeight: '600', color: '#fff' },
  balanceCard: {
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14,
    padding: 18, marginBottom: 14, alignItems: 'center',
  },
  balanceLabel: { fontSize: 12, color: '#c7d2fe', marginBottom: 6, letterSpacing: 0.5 },
  balanceValue: { fontSize: 36, fontWeight: '800', color: '#fff' },
  statsRow: { flexDirection: 'row', gap: 8 },
  statCard: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10, padding: 10, alignItems: 'center',
  },
  statLabel: { fontSize: 9, color: '#c7d2fe', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.3 },
  statVal: { fontSize: 12, fontWeight: '700', color: '#fff' },
});

function ActivityItem({ item }: { item: WalletActivity }) {
  const meta = TYPE_META[item.type] ?? { icon: '•', color: '#9ca3af' };
  const isCredit = item.credit > 0;
  const amount = isCredit ? item.credit : item.debit;
  const statusColor = STATUS_COLOR[item.status] ?? '#9ca3af';

  return (
    <View style={a.card}>
      <View style={[a.iconCircle, { backgroundColor: meta.color + '18' }]}>
        <Text style={[a.icon, { color: meta.color }]}>{meta.icon}</Text>
      </View>
      <View style={a.body}>
        <Text style={a.typeLabel}>{item.type_label}</Text>
        <Text style={a.ref} numberOfLines={1}>{item.reference}</Text>
        <Text style={a.date}>{item.date}</Text>
      </View>
      <View style={a.right}>
        <Text style={[a.amount, { color: isCredit ? '#10b981' : '#374151' }]}>
          {isCredit ? '+' : '-'}€{amount.toFixed(4)}
        </Text>
        <View style={[a.badge, { backgroundColor: statusColor + '22' }]}>
          <Text style={[a.badgeTxt, { color: statusColor }]}>{item.status}</Text>
        </View>
      </View>
    </View>
  );
}

const a = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', marginHorizontal: 16, marginTop: 8,
    borderRadius: 12, padding: 14,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  iconCircle: {
    width: 38, height: 38, borderRadius: 19,
    justifyContent: 'center', alignItems: 'center',
  },
  icon: { fontSize: 18, fontWeight: '700' },
  body: { flex: 1 },
  typeLabel: { fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 2 },
  ref: { fontSize: 13, fontWeight: '600', color: '#111827', marginBottom: 2 },
  date: { fontSize: 11, color: '#9ca3af' },
  right: { alignItems: 'flex-end', gap: 6 },
  amount: { fontSize: 14, fontWeight: '700' },
  badge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  badgeTxt: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
});

// ── Main screen ───────────────────────────────────────────────────────────────

export default function WalletScreen({ navigation }: Props) {
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [activity, setActivity] = useState<WalletActivity[]>([]);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (pg: number, silent = false) => {
    if (pg === 1 && !silent) setLoading(true);
    if (pg > 1) setLoadingMore(true);
    try {
      const params: Record<string, unknown> = { page: pg };
      if (typeFilter) params.type = typeFilter;
      const res = await getWallet(params as any);
      setSummary(res.summary ?? null);
      setLastPage(res.last_page ?? 1);
      const rows: WalletActivity[] = res.data ?? [];
      if (pg === 1) {
        setActivity(rows);
      } else {
        setActivity((prev) => [...prev, ...rows]);
      }
      setPage(pg);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [typeFilter]);

  useEffect(() => { load(1); }, [load]);

  const handleFilterChange = (f: TypeFilter) => {
    setTypeFilter(f);
    // load() is called by the useEffect above on typeFilter change
  };

  const handleLoadMore = () => {
    if (!loadingMore && page < lastPage) load(page + 1);
  };

  const renderHeader = () => (
    <>
      {summary && (
        <SummaryHeader
          summary={summary}
          onRequestPayout={() => navigation.navigate('Payouts')}
        />
      )}

      {/* Type filter chips */}
      <View style={s.filterRow}>
        {TYPE_FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[s.filterChip, typeFilter === f.key && s.filterChipActive]}
            onPress={() => handleFilterChange(f.key)}
          >
            <Text style={[s.filterTxt, typeFilter === f.key && s.filterTxtActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activity.length > 0 && (
        <Text style={s.sectionLabel}>Activity</Text>
      )}
    </>
  );

  const renderFooter = () => {
    if (loadingMore) {
      return <ActivityIndicator style={{ marginVertical: 20 }} color="#6366f1" />;
    }
    if (page < lastPage) {
      return (
        <TouchableOpacity style={s.loadMoreBtn} onPress={handleLoadMore}>
          <Text style={s.loadMoreTxt}>Load More</Text>
        </TouchableOpacity>
      );
    }
    return null;
  };

  if (loading) {
    return <View style={s.center}><ActivityIndicator size="large" color="#6366f1" /></View>;
  }

  return (
    <FlatList
      style={s.container}
      data={activity}
      keyExtractor={(item, i) => `${item.reference}-${i}`}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(1, true); }}
          tintColor="#6366f1"
        />
      }
      ListHeaderComponent={renderHeader}
      renderItem={({ item }) => <ActivityItem item={item} />}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={
        <Text style={s.empty}>No activity for this filter.</Text>
      }
      contentContainerStyle={{ paddingBottom: 40 }}
    />
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  filterRow: {
    flexDirection: 'row', gap: 8, paddingHorizontal: 16,
    paddingVertical: 12, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16,
    borderWidth: 1, borderColor: '#e5e7eb',
  },
  filterChipActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  filterTxt: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  filterTxtActive: { color: '#fff' },

  sectionLabel: {
    fontSize: 12, fontWeight: '700', color: '#9ca3af',
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginHorizontal: 16, marginTop: 16, marginBottom: 4,
  },
  empty: { textAlign: 'center', marginTop: 60, color: '#9ca3af', fontSize: 15 },

  loadMoreBtn: {
    margin: 16, padding: 14, backgroundColor: '#fff',
    borderRadius: 10, alignItems: 'center',
    borderWidth: 1, borderColor: '#e5e7eb',
  },
  loadMoreTxt: { fontSize: 14, fontWeight: '600', color: '#6366f1' },
});
