import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { getSites } from '../../api/publisher';
import { Site } from '../../types/publisher';

const statusColor: Record<string, string> = { active: '#10b981', pending_review: '#f59e0b', suspended: '#ef4444' };

export default function SitesScreen() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await getSites();
      setSites(res.data);
    } finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <View style={s.center}><ActivityIndicator color="#6366f1" /></View>;

  return (
    <View style={s.container}>
      <View style={s.header}><Text style={s.title}>My Sites</Text></View>
      <FlatList
        data={sites}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor="#6366f1" />}
        renderItem={({ item }) => (
          <View style={s.item}>
            <View style={s.itemTop}>
              <Text style={s.itemName}>{item.name}</Text>
              <View style={[s.badge, { backgroundColor: statusColor[item.status] ?? '#9ca3af' }]}>
                <Text style={s.badgeText}>{item.status}</Text>
              </View>
            </View>
            <Text style={s.domain}>{item.domain}</Text>
            <View style={s.stats}>
              <Text style={s.stat}>Imp: {item.impressions.toLocaleString()}</Text>
              <Text style={s.stat}>Clicks: {item.clicks.toLocaleString()}</Text>
              <Text style={s.stat}>€{item.revenue.toFixed(2)}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={s.empty}>No sites yet. Add your first website!</Text>}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#fff', padding: 20, paddingTop: 52, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  title: { fontSize: 20, fontWeight: '700', color: '#111827' },
  item: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12, borderRadius: 12, padding: 16, elevation: 1 },
  itemTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  itemName: { fontSize: 15, fontWeight: '600', color: '#111827', flex: 1 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 11, color: '#fff', fontWeight: '600' },
  domain: { fontSize: 13, color: '#9ca3af', marginBottom: 8 },
  stats: { flexDirection: 'row', gap: 12 },
  stat: { fontSize: 12, color: '#6b7280' },
  empty: { textAlign: 'center', marginTop: 60, color: '#9ca3af', fontSize: 15 },
});
