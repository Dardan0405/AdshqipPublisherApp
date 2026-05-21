import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl,
  TouchableOpacity, Modal, ScrollView, Alert, Share, Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SitesStackParamList } from '../../navigation/AppTabs';
import { getAdBlocks, deleteAdBlock, getAdBlockTag } from '../../api/publisher';
import { AdBlock } from '../../types/publisher';
import { useTheme, AppColors } from '../../theme';

type Props = NativeStackScreenProps<SitesStackParamList, 'AdBlocks'>;

const STATUS_COLOR: Record<string, string> = {
  active: '#10b981', paused: '#f59e0b', archived: '#6b7280',
};

function Badge({ status }: { status: string }) {
  return (
    <View style={[sb.badge, { backgroundColor: (STATUS_COLOR[status] ?? '#6b7280') + '22' }]}>
      <Text style={[sb.text, { color: STATUS_COLOR[status] ?? '#6b7280' }]}>
        {status}
      </Text>
    </View>
  );
}
const sb = StyleSheet.create({
  badge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start' },
  text: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
});

interface TagModalProps {
  visible: boolean;
  adBlockName: string;
  jsCode: string;
  onClose: () => void;
  c: AppColors;
}

function TagModal({ visible, adBlockName, jsCode, onClose, c }: TagModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(jsCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShare = () => {
    Share.share({ message: jsCode, title: `Embed code: ${adBlockName}` });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <View style={m.overlay}>
        <View style={[m.sheet, { backgroundColor: c.card }]}>
          <Text style={[m.title, { color: c.text }]}>Embed Code</Text>
          <Text style={[m.sub, { color: c.textLight }]}>{adBlockName}</Text>

          <ScrollView style={m.codeBox} nestedScrollEnabled>
            <Text style={m.code} selectable>{jsCode}</Text>
          </ScrollView>

          <View style={m.btnRow}>
            <TouchableOpacity style={[m.btn, m.copyBtn]} onPress={handleCopy}>
              <Text style={m.copyTxt}>{copied ? 'Copied!' : 'Copy'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[m.btn, { backgroundColor: c.bg, borderWidth: 1, borderColor: c.border }]} onPress={handleShare}>
              <Text style={[m.shareTxt, { color: c.textSub }]}>Share</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={m.closeBtn} onPress={onClose}>
            <Text style={[m.closeTxt, { color: c.textLight }]}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const m = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40, maxHeight: '80%' },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  sub: { fontSize: 13, marginBottom: 16 },
  codeBox: { backgroundColor: '#1e293b', borderRadius: 10, padding: 14, maxHeight: 200, marginBottom: 16 },
  code: { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 11, color: '#e2e8f0', lineHeight: 18 },
  btnRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  btn: { flex: 1, borderRadius: 10, padding: 13, alignItems: 'center' },
  copyBtn: { backgroundColor: '#6366f1' },
  copyTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
  shareTxt: { fontWeight: '600', fontSize: 14 },
  closeBtn: { alignItems: 'center', paddingTop: 4 },
  closeTxt: { fontSize: 15 },
});

const makeStyles = (c: AppColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: c.card, paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: c.borderLight,
  },
  listTitle: { fontSize: 20, fontWeight: '700', color: c.text },
  addBtn: { backgroundColor: c.primary, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 7 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  card: {
    backgroundColor: c.card, marginHorizontal: 16, marginTop: 12,
    borderRadius: 12, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  name: { fontSize: 15, fontWeight: '600', color: c.text, marginBottom: 2 },
  sub: { fontSize: 12, color: c.primary, marginBottom: 2 },
  parent: { fontSize: 12, color: c.textLight },
  stats: { flexDirection: 'row', gap: 12, flexWrap: 'wrap', marginBottom: 12 },
  stat: { fontSize: 12, color: c.textMuted },
  actions: { flexDirection: 'row', gap: 8, borderTopWidth: 1, borderTopColor: c.borderLight, paddingTop: 12 },
  actionBtn: { flex: 1, borderRadius: 8, paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: c.border },
  actionTagBtn: { borderColor: c.primary },
  actionDeleteBtn: { borderColor: c.dangerBg },
  actionEdit: { fontSize: 13, fontWeight: '600', color: c.textSub },
  actionTag: { fontSize: 13, fontWeight: '600', color: c.primary },
  actionDelete: { fontSize: 13, fontWeight: '600', color: c.danger },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  empty: { fontSize: 15, color: c.textLight, marginBottom: 16 },
  emptyAddBtn: { backgroundColor: c.primary, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12 },
  emptyAddTxt: { color: '#fff', fontWeight: '600', fontSize: 14 },
});

export default function AdBlocksScreen({ navigation }: Props) {
  const [zones, setZones] = useState<AdBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tagModal, setTagModal] = useState<{ name: string; code: string } | null>(null);
  const [tagLoading, setTagLoading] = useState<number | null>(null);
  const { colors: c } = useTheme();
  const s = makeStyles(c);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await getAdBlocks();
      setZones(res.data ?? []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = (zone: AdBlock) => {
    Alert.alert(
      'Delete Ad Block',
      `Delete "${zone.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              await deleteAdBlock(zone.id);
              setZones((prev) => prev.filter((z) => z.id !== zone.id));
            } catch {
              Alert.alert('Error', 'Failed to delete ad block.');
            }
          },
        },
      ],
    );
  };

  const handleGetTag = async (zone: AdBlock) => {
    setTagLoading(zone.id);
    try {
      const res = await getAdBlockTag(zone.id);
      const code = res.codes?.js ?? res.ad_code ?? '';
      setTagModal({ name: zone.name, code });
    } catch {
      Alert.alert('Error', 'Failed to load embed code.');
    } finally {
      setTagLoading(null);
    }
  };

  if (loading) {
    return <View style={s.center}><ActivityIndicator size="large" color={c.primary} /></View>;
  }

  return (
    <View style={s.container}>
      <FlatList
        data={zones}
        keyExtractor={(z) => String(z.id)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={c.primary} />
        }
        ListHeaderComponent={
          <View style={s.listHeader}>
            <Text style={s.listTitle}>Ad Blocks</Text>
            <TouchableOpacity style={s.addBtn} onPress={() => navigation.navigate('AdBlockForm', {})}>
              <Text style={s.addBtnText}>+ Add</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.cardTop}>
              <View style={{ flex: 1 }}>
                <Text style={s.name}>{item.name}</Text>
                <Text style={s.sub}>
                  {item.format_key}{item.size_key ? ` · ${item.size_key}` : ''}
                </Text>
                <Text style={s.parent}>{item.site?.name ?? item.mobile_app?.name ?? '—'}</Text>
              </View>
              <Badge status={item.status} />
            </View>

            <View style={s.stats}>
              <Text style={s.stat}>Imp: {item.impressions.toLocaleString()}</Text>
              <Text style={s.stat}>Clk: {item.clicks.toLocaleString()}</Text>
              <Text style={s.stat}>eCPM: €{item.ecpm.toFixed(2)}</Text>
              <Text style={s.stat}>€{item.revenue.toFixed(2)}</Text>
            </View>

            <View style={s.actions}>
              <TouchableOpacity
                style={s.actionBtn}
                onPress={() => navigation.navigate('AdBlockForm', { adBlockId: item.id })}
              >
                <Text style={s.actionEdit}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.actionBtn, s.actionTagBtn]}
                onPress={() => handleGetTag(item)}
                disabled={tagLoading === item.id}
              >
                {tagLoading === item.id
                  ? <ActivityIndicator size="small" color={c.primary} />
                  : <Text style={s.actionTag}>Get Tag</Text>}
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.actionBtn, s.actionDeleteBtn]}
                onPress={() => handleDelete(item)}
              >
                <Text style={s.actionDelete}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={s.emptyContainer}>
            <Text style={s.empty}>No ad blocks yet.</Text>
            <TouchableOpacity style={s.emptyAddBtn} onPress={() => navigation.navigate('AdBlockForm', {})}>
              <Text style={s.emptyAddTxt}>Create your first ad block</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 32 }}
      />

      {tagModal && (
        <TagModal
          visible
          adBlockName={tagModal.name}
          jsCode={tagModal.code}
          onClose={() => setTagModal(null)}
          c={c}
        />
      )}
    </View>
  );
}
