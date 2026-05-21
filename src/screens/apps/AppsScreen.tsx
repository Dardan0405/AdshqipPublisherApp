import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  TouchableOpacity, RefreshControl, Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SitesStackParamList } from '../../navigation/AppTabs';
import { getApps, deleteApp } from '../../api/publisher';
import { App } from '../../types/publisher';
import { useTheme, AppColors } from '../../theme';

type Props = NativeStackScreenProps<SitesStackParamList, 'AppsList'>;

const statusColor: Record<string, string> = {
  active: '#10b981', pending_review: '#f59e0b', suspended: '#ef4444',
};

const makeStyles = (c: AppColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: c.card, padding: 20, paddingTop: 16, borderBottomWidth: 1, borderBottomColor: c.borderLight, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700', color: c.text },
  addBtn: { backgroundColor: c.primary, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  item: { backgroundColor: c.card, marginHorizontal: 16, marginTop: 12, borderRadius: 12, padding: 16, elevation: 1 },
  itemTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  itemName: { fontSize: 15, fontWeight: '600', color: c.text, flex: 1 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 11, color: '#fff', fontWeight: '600' },
  sub: { fontSize: 13, color: c.textLight, marginBottom: 8, textTransform: 'capitalize' },
  stats: { flexDirection: 'row', gap: 12 },
  stat: { fontSize: 12, color: c.textMuted },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  editBtn: { flex: 1, borderWidth: 1, borderColor: c.primary, borderRadius: 7, padding: 8, alignItems: 'center' },
  editBtnText: { color: c.primary, fontWeight: '600', fontSize: 13 },
  deleteBtn: { flex: 1, borderWidth: 1, borderColor: c.danger, borderRadius: 7, padding: 8, alignItems: 'center' },
  deleteBtnText: { color: c.danger, fontWeight: '600', fontSize: 13 },
  empty: { textAlign: 'center', marginTop: 60, color: c.textLight, fontSize: 15 },
});

export default function AppsScreen({ navigation }: Props) {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { colors: c } = useTheme();
  const s = makeStyles(c);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try { const res = await getApps(); setApps(res.data); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => load(true));
    load();
    return unsub;
  }, [navigation]);

  const confirmDelete = (id: number, name: string) =>
    Alert.alert('Delete App', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try { await deleteApp(id); load(true); }
          catch { Alert.alert('Error', 'Failed to delete app.'); }
        },
      },
    ]);

  if (loading) return <View style={s.center}><ActivityIndicator color={c.primary} /></View>;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>My Apps</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => navigation.navigate('AppForm', {})}>
          <Text style={s.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={apps}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={c.primary} />
        }
        renderItem={({ item }) => (
          <View style={s.item}>
            <View style={s.itemTop}>
              <Text style={s.itemName}>{item.app_name}</Text>
              <View style={[s.badge, { backgroundColor: statusColor[item.status] ?? '#9ca3af' }]}>
                <Text style={s.badgeText}>{item.status}</Text>
              </View>
            </View>
            <Text style={s.sub}>{item.application_type.replace(/_/g, ' ')} · {item.category || 'No category'}</Text>
            <View style={s.stats}>
              <Text style={s.stat}>Imp: {item.impressions.toLocaleString()}</Text>
              <Text style={s.stat}>Clicks: {item.clicks.toLocaleString()}</Text>
              <Text style={s.stat}>€{item.revenue.toFixed(2)}</Text>
            </View>
            <View style={s.actions}>
              <TouchableOpacity style={s.editBtn} onPress={() => navigation.navigate('AppForm', { appId: item.id })}>
                <Text style={s.editBtnText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.deleteBtn} onPress={() => confirmDelete(item.id, item.app_name)}>
                <Text style={s.deleteBtnText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={s.empty}>No apps yet. Add your first app!</Text>}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </View>
  );
}
