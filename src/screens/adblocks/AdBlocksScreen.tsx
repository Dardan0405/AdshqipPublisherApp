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

type Props = NativeStackScreenProps<SitesStackParamList, 'AdBlocks'>;

// ── Status badge ──────────────────────────────────────────────────────────────

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

// ── Embed code modal ──────────────────────────────────────────────────────────

interface TagModalProps {
  visible: boolean;
  adBlockName: string;
  jsCode: string;
  onClose: () => void;
}

function TagModal({ visible, adBlockName, jsCode, onClose }: TagModalProps) {
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
        <View style={m.sheet}>
          <Text style={m.title}>Embed Code</Text>
          <Text style={m.sub}>{adBlockName}</Text>

          <ScrollView style={m.codeBox} nestedScrollEnabled>
            <Text style={m.code} selectable>{jsCode}</Text>
          </ScrollView>

          <View style={m.btnRow}>
            <TouchableOpacity style={[m.btn, m.copyBtn]} onPress={handleCopy}>
              <Text style={m.copyTxt}>{copied ? 'Copied!' : 'Copy'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[m.btn, m.shareBtn]} onPress={handleShare}>
              <Text style={m.shareTxt}>Share</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={m.closeBtn} onPress={onClose}>
            <Text style={m.closeTxt}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const m = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, paddingBottom: 40, maxHeight: '80%',
  },
  title: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 4 },
  sub: { fontSize: 13, color: '#9ca3af', marginBottom: 16 },
  codeBox: {
    backgroundColor: '#1e293b', borderRadius: 10, padding: 14,
    maxHeight: 200, marginBottom: 16,
  },
  code: { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 11, color: '#e2e8f0', lineHeight: 18 },
  btnRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  btn: { flex: 1, borderRadius: 10, padding: 13, alignItems: 'center' },
  copyBtn: { backgroundColor: '#6366f1' },
  copyTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
  shareBtn: { backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb' },
  shareTxt: { color: '#374151', fontWeight: '600', fontSize: 14 },
  closeBtn: { alignItems: 'center', paddingTop: 4 },
  closeTxt: { fontSize: 15, color: '#9ca3af' },
});

// ── Main screen ───────────────────────────────────────────────────────────────

export default function AdBlocksScreen({ navigation }: Props) {
  const [zones, setZones] = useState<AdBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tagModal, setTagModal] = useState<{ name: string; code: string } | null>(null);
  const [tagLoading, setTagLoading] = useState<number | null>(null);

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
    return <View style={s.center}><ActivityIndicator size="large" color="#6366f1" /></View>;
  }

  return (
    <View style={s.container}>
      <FlatList
        data={zones}
        keyExtractor={(z) => String(z.id)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor="#6366f1" />
        }
        ListHeaderComponent={
          <View style={s.listHeader}>
            <Text style={s.listTitle}>Ad Blocks</Text>
            <TouchableOpacity
              style={s.addBtn}
              onPress={() => navigation.navigate('AdBlockForm', {})}
            >
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
                  ? <ActivityIndicator size="small" color="#6366f1" />
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
            <TouchableOpacity
              style={s.emptyAddBtn}
              onPress={() => navigation.navigate('AdBlockForm', {})}
            >
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
        />
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  listHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  listTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  addBtn: {
    backgroundColor: '#6366f1', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 7,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  card: {
    backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12,
    borderRadius: 12, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  name: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 2 },
  sub: { fontSize: 12, color: '#6366f1', marginBottom: 2 },
  parent: { fontSize: 12, color: '#9ca3af' },

  stats: { flexDirection: 'row', gap: 12, flexWrap: 'wrap', marginBottom: 12 },
  stat: { fontSize: 12, color: '#6b7280' },

  actions: { flexDirection: 'row', gap: 8, borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 12 },
  actionBtn: {
    flex: 1, borderRadius: 8, paddingVertical: 8, alignItems: 'center',
    borderWidth: 1, borderColor: '#e5e7eb',
  },
  actionTagBtn: { borderColor: '#6366f1' },
  actionDeleteBtn: { borderColor: '#fee2e2' },
  actionEdit: { fontSize: 13, fontWeight: '600', color: '#374151' },
  actionTag: { fontSize: 13, fontWeight: '600', color: '#6366f1' },
  actionDelete: { fontSize: 13, fontWeight: '600', color: '#ef4444' },

  emptyContainer: { alignItems: 'center', marginTop: 80 },
  empty: { fontSize: 15, color: '#9ca3af', marginBottom: 16 },
  emptyAddBtn: { backgroundColor: '#6366f1', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12 },
  emptyAddTxt: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
