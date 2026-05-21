import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  TouchableOpacity, RefreshControl, Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SitesStackParamList } from '../../navigation/AppTabs';
import { getSites, deleteSite } from '../../api/publisher';
import { Site } from '../../types/publisher';
import { useTheme, AppColors } from '../../theme';

type Props = NativeStackScreenProps<SitesStackParamList, 'SitesList'>;

const statusColor: Record<string, string> = {
  active: '#10b981', pending_review: '#f59e0b', suspended: '#ef4444',
};

const makeStyles = (c: AppColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: c.card, padding: 20, paddingTop: 52, borderBottomWidth: 1, borderBottomColor: c.borderLight, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700', color: c.text },
  addBtn: { backgroundColor: c.primary, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  item: { backgroundColor: c.card, marginHorizontal: 16, marginTop: 12, borderRadius: 12, padding: 16, elevation: 1 },
  itemTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  itemName: { fontSize: 15, fontWeight: '600', color: c.text, flex: 1 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 11, color: '#fff', fontWeight: '600' },
  domain: { fontSize: 13, color: c.textLight, marginBottom: 8 },
  stats: { flexDirection: 'row', gap: 12 },
  stat: { fontSize: 12, color: c.textMuted },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  editBtn: { flex: 1, borderWidth: 1, borderColor: c.primary, borderRadius: 7, padding: 8, alignItems: 'center' },
  editBtnText: { color: c.primary, fontWeight: '600', fontSize: 13 },
  deleteBtn: { flex: 1, borderWidth: 1, borderColor: c.danger, borderRadius: 7, padding: 8, alignItems: 'center' },
  deleteBtnText: { color: c.danger, fontWeight: '600', fontSize: 13 },
  empty: { textAlign: 'center', marginTop: 60, color: c.textLight, fontSize: 15 },
  fab: { position: 'absolute', bottom: 24, right: 20, backgroundColor: c.primary, borderRadius: 24, paddingHorizontal: 18, paddingVertical: 12, elevation: 4 },
  fabText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});

export default function SitesScreen({ navigation }: Props) {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { colors: c } = useTheme();
  const s = makeStyles(c);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await getSites();
      setSites(res.data);
    } finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => load(true));
    load();
    return unsub;
  }, [navigation]);

  const confirmDelete = (id: number, name: string) =>
    Alert.alert('Delete Site', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try { await deleteSite(id); load(true); }
          catch { Alert.alert('Error', 'Failed to delete site.'); }
        },
      },
    ]);

  if (loading) return <View style={s.center}><ActivityIndicator color={c.primary} /></View>;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>My Sites</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => navigation.navigate('SiteForm', {})}>
          <Text style={s.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={sites}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={c.primary} />
        }
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
            <View style={s.actions}>
              <TouchableOpacity style={s.editBtn} onPress={() => navigation.navigate('SiteForm', { siteId: item.id })}>
                <Text style={s.editBtnText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.deleteBtn} onPress={() => confirmDelete(item.id, item.name)}>
                <Text style={s.deleteBtnText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={s.empty}>No sites yet. Add your first website!</Text>}
        contentContainerStyle={{ paddingBottom: 24 }}
      />

      <TouchableOpacity style={s.fab} onPress={() => navigation.navigate('AppsList')}>
        <Text style={s.fabText}>📱 My Apps</Text>
      </TouchableOpacity>
    </View>
  );
}
