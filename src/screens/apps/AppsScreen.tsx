import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { getApps } from '../../api/publisher';
import { App } from '../../types/publisher';

export default function AppsScreen() {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try { const res = await getApps(); setApps(res.data); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <View style={s.center}><ActivityIndicator color="#6366f1" /></View>;

  return (
    <View style={s.container}>
      <View style={s.header}><Text style={s.title}>My Apps</Text></View>
      <FlatList
        data={apps}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor="#6366f1" />}
        renderItem={({ item }) => (
          <View style={s.item}>
            <Text style={s.name}>{item.app_name}</Text>
            <Text style={s.sub}>{item.application_type} · {item.category} · {item.status}</Text>
            <Text style={s.url}>{item.app_url}</Text>
            <View style={s.stats}>
              <Text style={s.stat}>Imp: {item.impressions.toLocaleString()}</Text>
              <Text style={s.stat}>Clicks: {item.clicks.toLocaleString()}</Text>
              <Text style={s.stat}>€{item.revenue.toFixed(2)}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={s.empty}>No apps yet.</Text>}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#fff', padding: 20, paddingTop: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  title: { fontSize: 20, fontWeight: '700', color: '#111827' },
  item: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12, borderRadius: 12, padding: 16, elevation: 1 },
  name: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 2 },
  sub: { fontSize: 12, color: '#6366f1', marginBottom: 4 },
  url: { fontSize: 12, color: '#9ca3af', marginBottom: 8 },
  stats: { flexDirection: 'row', gap: 12 },
  stat: { fontSize: 12, color: '#6b7280' },
  empty: { textAlign: 'center', marginTop: 60, color: '#9ca3af', fontSize: 15 },
});
