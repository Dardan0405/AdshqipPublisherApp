import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { getEarnings } from '../../api/publisher';
import { useTheme, AppColors } from '../../theme';

const makeStyles = (c: AppColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: c.card, padding: 20, paddingTop: 52, borderBottomWidth: 1, borderBottomColor: c.borderLight },
  title: { fontSize: 20, fontWeight: '700', color: c.text },
  total: { fontSize: 14, color: c.textMuted, marginTop: 4 },
  item: { backgroundColor: c.card, marginHorizontal: 16, marginTop: 12, borderRadius: 12, padding: 16, elevation: 1 },
  itemTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  month: { fontSize: 15, fontWeight: '700', color: c.text },
  amount: { fontSize: 15, fontWeight: '700', color: c.primary },
  day: { fontSize: 12, color: c.textMuted, marginBottom: 2 },
  more: { fontSize: 11, color: c.textLight, marginTop: 4 },
  empty: { textAlign: 'center', marginTop: 60, color: c.textLight, fontSize: 15 },
});

export default function EarningsScreen() {
  const [months, setMonths] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { colors: c } = useTheme();
  const s = makeStyles(c);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try { const res = await getEarnings(); setMonths(res.data); setTotal(res.total_revenue); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <View style={s.center}><ActivityIndicator color={c.primary} /></View>;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Earnings</Text>
        <Text style={s.total}>Total: €{total.toFixed(2)}</Text>
      </View>
      <FlatList
        data={months}
        keyExtractor={(item) => item.month}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={c.primary} />}
        renderItem={({ item }) => (
          <View style={s.item}>
            <View style={s.itemTop}>
              <Text style={s.month}>{item.month_formatted}</Text>
              <Text style={s.amount}>€{Number(item.revenue).toFixed(2)}</Text>
            </View>
            {item.daily_breakdown?.slice(0, 3).map((d: any) => (
              <Text key={d.date} style={s.day}>{d.date_formatted}  €{Number(d.revenue).toFixed(4)}</Text>
            ))}
            {item.daily_breakdown?.length > 3 && (
              <Text style={s.more}>+{item.daily_breakdown.length - 3} more days</Text>
            )}
          </View>
        )}
        ListEmptyComponent={<Text style={s.empty}>No earnings yet.</Text>}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </View>
  );
}
