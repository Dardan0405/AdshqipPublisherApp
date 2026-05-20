import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { getOverviewReport } from '../../api/publisher';
import { ReportOverviewRow } from '../../types/publisher';

export default function ReportsScreen() {
  const [rows, setRows] = useState<ReportOverviewRow[]>([]);
  const [summary, setSummary] = useState<{ total_impressions: number; total_clicks: number; total_earnings: number; ecpm: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try { const res = await getOverviewReport(); setRows(res.data); setSummary(res.summary); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <View style={s.center}><ActivityIndicator color="#6366f1" /></View>;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Overview Report</Text>
        {summary && (
          <View style={s.summaryRow}>
            <Text style={s.sum}>Imp: {summary.total_impressions.toLocaleString()}</Text>
            <Text style={s.sum}>Clicks: {summary.total_clicks.toLocaleString()}</Text>
            <Text style={s.sum}>€{summary.total_earnings.toFixed(2)}</Text>
            <Text style={s.sum}>eCPM: €{summary.ecpm.toFixed(2)}</Text>
          </View>
        )}
      </View>
      <View style={s.tableHeader}>
        <Text style={[s.col, { flex: 2 }]}>Date</Text>
        <Text style={s.col}>Imp</Text>
        <Text style={s.col}>Clk</Text>
        <Text style={s.col}>Earn €</Text>
      </View>
      <FlatList
        data={rows}
        keyExtractor={(item) => item.date}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor="#6366f1" />}
        renderItem={({ item }) => (
          <View style={s.row}>
            <Text style={[s.cell, { flex: 2 }]}>{item.date}</Text>
            <Text style={s.cell}>{Number(item.total_impressions).toLocaleString()}</Text>
            <Text style={s.cell}>{Number(item.total_clicks).toLocaleString()}</Text>
            <Text style={s.cell}>{Number(item.total_earnings).toFixed(4)}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={s.empty}>No data for this period.</Text>}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#fff', padding: 20, paddingTop: 52, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  title: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8 },
  summaryRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  sum: { fontSize: 12, color: '#6b7280', backgroundColor: '#f3f4f6', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  col: { flex: 1, fontSize: 12, fontWeight: '700', color: '#374151' },
  row: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f9fafb' },
  cell: { flex: 1, fontSize: 13, color: '#374151' },
  empty: { textAlign: 'center', marginTop: 60, color: '#9ca3af', fontSize: 15 },
});
