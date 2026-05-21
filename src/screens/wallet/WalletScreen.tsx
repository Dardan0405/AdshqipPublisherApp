import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  RefreshControl, TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { EarningsStackParamList } from '../../navigation/AppTabs';
import { getWallet } from '../../api/publisher';
import { WalletSummary, WalletActivity } from '../../types/publisher';
import { useTheme, AppColors } from '../../theme';

type Props = NativeStackScreenProps<EarningsStackParamList, 'Wallet'>;

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

function SummaryHeader({
  summary,
  onRequestPayout,
  c,
}: {
  summary: WalletSummary;
  onRequestPayout: () => void;
  c: AppColors;
}) {
  return (
    <View style={[h.wrapper, { backgroundColor: c.headerBg }]}>
      <View style={h.topRow}>
        <Text style={[h.title, { color: c.headerText }]}>Wallet</Text>
        <TouchableOpacity style={h.payoutBtn} onPress={onRequestPayout}>
          <Text style={h.payoutTxt}>Request Payout</Text>
        </TouchableOpacity>
      </View>

      <View style={h.balanceCard}>
        <Text style={[h.balanceLabel, { color: c.headerSub }]}>Available Balance</Text>
        <Text style={[h.balanceValue, { color: c.headerText }]}>€{summary.available.toFixed(2)}</Text>
      </View>

      <View style={h.statsRow}>
        {([
          ['Earned',     summary.earned],
          ['Pending',    summary.pending],
          ['Paid Out',   summary.paid],
          ['This Month', summary.this_month],
        ] as [string, number][]).map(([label, val]) => (
          <View key={label} style={h.statCard}>
            <Text style={[h.statLabel, { color: c.headerSub }]}>{label}</Text>
            <Text style={[h.statVal, { color: c.headerText }]}>€{val.toFixed(2)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const h = StyleSheet.create({
  wrapper: { paddingHorizontal: 20, paddingTop: 52, paddingBottom: 20 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '700' },
  payoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 7,
  },
  payoutTxt: { fontSize: 13, fontWeight: '600', color: '#fff' },
  balanceCard: {
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14,
    padding: 18, marginBottom: 14, alignItems: 'center',
  },
  balanceLabel: { fontSize: 12, marginBottom: 6, letterSpacing: 0.5 },
  balanceValue: { fontSize: 36, fontWeight: '800' },
  statsRow: { flexDirection: 'row', gap: 8 },
  statCard: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10, padding: 10, alignItems: 'center',
  },
  statLabel: { fontSize: 9, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.3 },
  statVal: { fontSize: 12, fontWeight: '700' },
});

function ActivityItem({ item, c }: { item: WalletActivity; c: AppColors }) {
  const meta = TYPE_META[item.type] ?? { icon: '•', color: '#9ca3af' };
  const isCredit = item.credit > 0;
  const amount = isCredit ? item.credit : item.debit;
  const statusColor = STATUS_COLOR[item.status] ?? '#9ca3af';

  return (
    <View style={[a.card, { backgroundColor: c.card }]}>
      <View style={[a.iconCircle, { backgroundColor: meta.color + '18' }]}>
        <Text style={[a.icon, { color: meta.color }]}>{meta.icon}</Text>
      </View>
      <View style={a.body}>
        <Text style={[a.typeLabel, { color: c.textLight }]}>{item.type_label}</Text>
        <Text style={[a.ref, { color: c.text }]} numberOfLines={1}>{item.reference}</Text>
        <Text style={[a.date, { color: c.textLight }]}>{item.date}</Text>
      </View>
      <View style={a.right}>
        <Text style={[a.amount, { color: isCredit ? c.success : c.textSub }]}>
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
    marginHorizontal: 16, marginTop: 8,
    borderRadius: 12, padding: 14,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  iconCircle: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  icon: { fontSize: 18, fontWeight: '700' },
  body: { flex: 1 },
  typeLabel: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 2 },
  ref: { fontSize: 13, fontWeight: '600', marginBottom: 2 },
  date: { fontSize: 11 },
  right: { alignItems: 'flex-end', gap: 6 },
  amount: { fontSize: 14, fontWeight: '700' },
  badge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  badgeTxt: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
});

const makeStyles = (c: AppColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  filterRow: {
    flexDirection: 'row', gap: 8, paddingHorizontal: 16,
    paddingVertical: 12, backgroundColor: c.card,
    borderBottomWidth: 1, borderBottomColor: c.borderLight,
  },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: c.border },
  filterChipActive: { backgroundColor: c.primary, borderColor: c.primary },
  filterTxt: { fontSize: 13, fontWeight: '600', color: c.textMuted },
  filterTxtActive: { color: '#fff' },
  sectionLabel: {
    fontSize: 12, fontWeight: '700', color: c.textLight,
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginHorizontal: 16, marginTop: 16, marginBottom: 4,
  },
  empty: { textAlign: 'center', marginTop: 60, color: c.textLight, fontSize: 15 },
  loadMoreBtn: {
    margin: 16, padding: 14, backgroundColor: c.card,
    borderRadius: 10, alignItems: 'center',
    borderWidth: 1, borderColor: c.border,
  },
  loadMoreTxt: { fontSize: 14, fontWeight: '600', color: c.primary },
});

export default function WalletScreen({ navigation }: Props) {
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [activity, setActivity] = useState<WalletActivity[]>([]);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { colors: c } = useTheme();
  const s = makeStyles(c);

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

  const handleFilterChange = (f: TypeFilter) => { setTypeFilter(f); };
  const handleLoadMore = () => { if (!loadingMore && page < lastPage) load(page + 1); };

  const renderHeader = () => (
    <>
      {summary && (
        <SummaryHeader
          summary={summary}
          onRequestPayout={() => navigation.navigate('Payouts')}
          c={c}
        />
      )}
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
      {activity.length > 0 && <Text style={s.sectionLabel}>Activity</Text>}
    </>
  );

  const renderFooter = () => {
    if (loadingMore) {
      return <ActivityIndicator style={{ marginVertical: 20 }} color={c.primary} />;
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
    return <View style={s.center}><ActivityIndicator size="large" color={c.primary} /></View>;
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
          tintColor={c.primary}
        />
      }
      ListHeaderComponent={renderHeader}
      renderItem={({ item }) => <ActivityItem item={item} c={c} />}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={<Text style={s.empty}>No activity for this filter.</Text>}
      contentContainerStyle={{ paddingBottom: 40 }}
    />
  );
}
