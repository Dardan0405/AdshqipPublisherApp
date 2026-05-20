import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { getWallet } from '../../api/publisher';
import { WalletSummary } from '../../types/publisher';

const statusColor: Record<string, string> = { earned: '#10b981', pending: '#f59e0b', completed: '#6366f1', failed: '#ef4444' };

export default function WalletScreen() {
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try { const res = await getWallet(); setSummary(res.summary); setActivity(res.data); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <View style={s.center}><ActivityIndicator color="#6366f1" /></View>;

  return (
    <View style={s.container}>
      {summary && (
        <View style={s.header}>
          <Text style={s.title}>Wallet</Text>
          <View style={s.balanceBox}>
            <Text style={s.balanceLabel}>Available Balance</Text>
            <Text style={s.balanceValue}>€{summary.available.toFixed(2)}</Text>
          </View>
          <View style={s.summaryRow}>
            {[['Earned', summary.earned], ['Pending', summary.pending], ['Paid Out', summary.paid], ['This Month', summary.this_month]].map(([label, val]) => (
              <View key={label as string} style={s.sumCard}>
                <Text style={s.sumLabel}>{label}</Text>
                <Text style={s.sumVal}>€{(val as number).toFixed(2)}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
      <FlatList
        data={activity}
        keyExtractor={(_, i) => String(i)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor="#6366f1" />}
        renderItem={({ item }) => (
          <View style={s.item}>
            <View style={s.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.ref}>{item.reference}</Text>
                <Text style={s.date}>{item.date}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[s.amount, { color: item.credit > 0 ? '#10b981' : '#ef4444' }]}>
                  {item.credit > 0 ? `+€${item.credit.toFixed(4)}` : `-€${item.debit.toFixed(4)}`}
                </Text>
                <View style={[s.badge, { backgroundColor: statusColor[item.status] ?? '#9ca3af' }]}>
                  <Text style={s.badgeText}>{item.status}</Text>
                </View>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={s.empty}>No activity yet.</Text>}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#6366f1', padding: 20, paddingTop: 52 },
  title: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 16 },
  balanceBox: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 16, marginBottom: 16 },
  balanceLabel: { fontSize: 12, color: '#c7d2fe', marginBottom: 4 },
  balanceValue: { fontSize: 28, fontWeight: '800', color: '#fff' },
  summaryRow: { flexDirection: 'row', gap: 8 },
  sumCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 8, padding: 10, alignItems: 'center' },
  sumLabel: { fontSize: 10, color: '#c7d2fe', marginBottom: 2 },
  sumVal: { fontSize: 13, fontWeight: '700', color: '#fff' },
  item: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 8, borderRadius: 10, padding: 14, elevation: 1 },
  itemRow: { flexDirection: 'row' },
  ref: { fontSize: 13, fontWeight: '600', color: '#111827' },
  date: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  amount: { fontSize: 14, fontWeight: '700' },
  badge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginTop: 4 },
  badgeText: { fontSize: 10, color: '#fff', fontWeight: '600' },
  empty: { textAlign: 'center', marginTop: 60, color: '#9ca3af', fontSize: 15 },
});
