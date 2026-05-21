import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl,
  TouchableOpacity, TextInput, Modal, Alert, ScrollView, Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { getApiKeys, createApiKey, revokeApiKey, activateApiKey, deleteApiKey } from '../../api/publisher';
import { useTheme, AppColors } from '../../theme';

interface ApiKeyItem {
  id: number;
  name: string;
  api_key: string;
  permissions: string[];
  status: string;
  rate_limit_per_minute: number;
  last_used_at: string | null;
  created_at: string;
}

const PERMISSIONS = [
  { key: 'read_reports',    label: 'Read Reports' },
  { key: 'manage_sites',    label: 'Manage Sites' },
  { key: 'manage_adblocks', label: 'Manage AdBlocks' },
];

const STATUS_COLOR: Record<string, string> = { active: '#10b981', revoked: '#ef4444' };

function SecretModal({
  data,
  onClose,
  c,
}: {
  data: { api_key: string; api_secret: string } | null;
  onClose: () => void;
  c: AppColors;
}) {
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  if (!data) return null;

  const copy = async (text: string, which: 'key' | 'secret') => {
    await Clipboard.setStringAsync(text);
    if (which === 'key') { setCopiedKey(true); setTimeout(() => setCopiedKey(false), 2500); }
    else                 { setCopiedSecret(true); setTimeout(() => setCopiedSecret(false), 2500); }
  };

  return (
    <Modal visible animationType="slide" transparent presentationStyle="overFullScreen">
      <View style={m.overlay}>
        <View style={[m.sheet, { backgroundColor: c.card }]}>
          <Text style={[m.title, { color: c.text }]}>Key Created</Text>
          <Text style={m.warn}>Save the secret now — it will not be shown again.</Text>

          <Text style={[m.fieldLabel, { color: c.textLight }]}>API Key (Public)</Text>
          <View style={m.codeRow}>
            <Text style={m.code} selectable numberOfLines={1}>{data.api_key}</Text>
            <TouchableOpacity style={m.copyBtn} onPress={() => copy(data.api_key, 'key')}>
              <Text style={m.copyTxt}>{copiedKey ? 'Copied' : 'Copy'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={[m.fieldLabel, { color: c.textLight }]}>API Secret</Text>
          <View style={m.codeRow}>
            <Text style={m.code} selectable numberOfLines={1}>{data.api_secret}</Text>
            <TouchableOpacity style={[m.copyBtn, m.copySecret]} onPress={() => copy(data.api_secret, 'secret')}>
              <Text style={m.copyTxt}>{copiedSecret ? 'Copied' : 'Copy'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={m.doneBtn} onPress={onClose}>
            <Text style={m.doneTxt}>I have saved my credentials</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const m = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  warn: { fontSize: 13, color: '#ef4444', marginBottom: 20, fontWeight: '600' },
  fieldLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 6 },
  codeRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 10, marginBottom: 16, overflow: 'hidden' },
  code: { flex: 1, color: '#e2e8f0', fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', padding: 12 },
  copyBtn: { backgroundColor: '#6366f1', padding: 12 },
  copySecret: { backgroundColor: '#10b981' },
  copyTxt: { color: '#fff', fontWeight: '700', fontSize: 12 },
  doneBtn: { backgroundColor: '#111827', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 4 },
  doneTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
});

function CreateKeyModal({
  visible,
  onClose,
  onCreated,
  c,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: (data: { api_key: string; api_secret: string }) => void;
  c: AppColors;
}) {
  const [name, setName] = useState('');
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  const togglePerm = (key: string) =>
    setSelectedPerms((prev) => prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]);

  const handleCreate = async () => {
    if (!name.trim()) { Alert.alert('Validation', 'Key name is required.'); return; }
    setCreating(true);
    try {
      const res = await createApiKey({ name: name.trim(), permissions: selectedPerms });
      setName('');
      setSelectedPerms([]);
      onCreated({ api_key: res.api_key, api_secret: res.api_secret });
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'Failed to create key.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <View style={cm.overlay}>
        <View style={[cm.sheet, { backgroundColor: c.card }]}>
          <Text style={[cm.title, { color: c.text }]}>New API Key</Text>

          <Text style={[cm.label, { color: c.textSub }]}>Key Name</Text>
          <TextInput
            style={[cm.input, { borderColor: c.border, color: c.text, backgroundColor: c.input }]}
            value={name}
            onChangeText={setName}
            placeholder="My Integration"
            placeholderTextColor={c.textLight}
          />

          <Text style={[cm.label, { color: c.textSub }]}>Permissions</Text>
          <View style={cm.perms}>
            {PERMISSIONS.map((p) => (
              <TouchableOpacity
                key={p.key}
                style={[cm.permChip, { borderColor: c.border, backgroundColor: c.card },
                  selectedPerms.includes(p.key) && { backgroundColor: c.primary, borderColor: c.primary }]}
                onPress={() => togglePerm(p.key)}
              >
                <Text style={[cm.permTxt, { color: c.textSub },
                  selectedPerms.includes(p.key) && { color: '#fff', fontWeight: '600' }]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={[cm.createBtn, { backgroundColor: c.primary }]} onPress={handleCreate} disabled={creating}>
            {creating ? <ActivityIndicator color="#fff" /> : <Text style={cm.createTxt}>Generate Key</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={cm.cancelBtn} onPress={onClose}>
            <Text style={[cm.cancelTxt, { color: c.textLight }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const cm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 14 },
  perms: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  permChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  permTxt: { fontSize: 13 },
  createBtn: { borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 10 },
  createTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
  cancelBtn: { alignItems: 'center' },
  cancelTxt: { fontSize: 14 },
});

function KeyCard({
  item,
  onRevoke,
  onActivate,
  onDelete,
  c,
}: {
  item: ApiKeyItem;
  onRevoke: () => void;
  onActivate: () => void;
  onDelete: () => void;
  c: AppColors;
}) {
  const statusColor = STATUS_COLOR[item.status] ?? '#9ca3af';

  return (
    <View style={[kc.card, { backgroundColor: c.card }]}>
      <View style={kc.top}>
        <View style={{ flex: 1 }}>
          <Text style={[kc.name, { color: c.text }]}>{item.name}</Text>
          <Text style={[kc.key, { color: c.textLight }]} numberOfLines={1}>{item.api_key}</Text>
        </View>
        <View style={[kc.badge, { backgroundColor: statusColor + '22' }]}>
          <Text style={[kc.badgeTxt, { color: statusColor }]}>{item.status}</Text>
        </View>
      </View>

      {item.permissions.length > 0 && (
        <View style={kc.permRow}>
          {item.permissions.map((p) => (
            <View key={p} style={[kc.permTag, { backgroundColor: c.primaryBg }]}>
              <Text style={[kc.permTxt, { color: c.primary }]}>{p.replace(/_/g, ' ')}</Text>
            </View>
          ))}
        </View>
      )}

      <Text style={[kc.meta, { color: c.textLight }]}>
        {item.last_used_at ? `Last used: ${item.last_used_at.slice(0, 10)}` : 'Never used'}
        {'  ·  '}Created: {item.created_at?.slice(0, 10)}
      </Text>

      <View style={[kc.actions, { borderTopColor: c.borderLight }]}>
        {item.status === 'active' ? (
          <TouchableOpacity style={[kc.actionBtn, { borderColor: c.dangerBg }]} onPress={onRevoke}>
            <Text style={[kc.revokeTxt, { color: c.danger }]}>Revoke</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[kc.actionBtn, { borderColor: c.successBorder }]} onPress={onActivate}>
            <Text style={[kc.activateTxt, { color: c.success }]}>Activate</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[kc.actionBtn, { borderColor: c.dangerBg }]} onPress={onDelete}>
          <Text style={[kc.deleteTxt, { color: c.danger }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const kc = StyleSheet.create({
  card: { marginHorizontal: 16, marginTop: 10, borderRadius: 12, padding: 16, elevation: 1 },
  top: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  name: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  key: { fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  badge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  badgeTxt: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  permRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  permTag: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  permTxt: { fontSize: 11, fontWeight: '500' },
  meta: { fontSize: 11, marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 8, borderTopWidth: 1, paddingTop: 12 },
  actionBtn: { flex: 1, borderRadius: 8, paddingVertical: 8, alignItems: 'center', borderWidth: 1 },
  revokeTxt: { fontSize: 13, fontWeight: '600' },
  activateTxt: { fontSize: 13, fontWeight: '600' },
  deleteTxt: { fontSize: 13, fontWeight: '600' },
});

const makeStyles = (c: AppColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: c.card, paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: c.borderLight,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: c.text },
  headerSub: { fontSize: 12, color: c.textLight, marginTop: 2 },
  addBtn: { backgroundColor: c.primary, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 7 },
  addBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyTxt: { fontSize: 15, color: c.textLight, marginBottom: 16 },
  emptyBtn: { backgroundColor: c.primary, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12 },
  emptyBtnTxt: { color: '#fff', fontWeight: '600', fontSize: 14 },
});

export default function ApiKeysScreen() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [secretData, setSecretData] = useState<{ api_key: string; api_secret: string } | null>(null);
  const { colors: c } = useTheme();
  const s = makeStyles(c);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await getApiKeys();
      setKeys(res.data ?? []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRevoke = (id: number) => {
    Alert.alert('Revoke Key', 'Revoke this API key? It will stop working immediately.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Revoke', style: 'destructive', onPress: async () => {
        await revokeApiKey(id);
        setKeys((prev) => prev.map((k) => k.id === id ? { ...k, status: 'revoked' } : k));
      }},
    ]);
  };

  const handleActivate = async (id: number) => {
    await activateApiKey(id);
    setKeys((prev) => prev.map((k) => k.id === id ? { ...k, status: 'active' } : k));
  };

  const handleDelete = (id: number) => {
    Alert.alert('Delete Key', 'Permanently delete this API key?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await deleteApiKey(id);
        setKeys((prev) => prev.filter((k) => k.id !== id));
      }},
    ]);
  };

  if (loading) {
    return <View style={s.center}><ActivityIndicator size="large" color={c.primary} /></View>;
  }

  return (
    <View style={s.container}>
      <FlatList
        data={keys}
        keyExtractor={(k) => String(k.id)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={c.primary} />
        }
        ListHeaderComponent={
          <View style={s.listHeader}>
            <View>
              <Text style={s.headerTitle}>API Keys</Text>
              <Text style={s.headerSub}>{keys.length} key{keys.length !== 1 ? 's' : ''}</Text>
            </View>
            <TouchableOpacity style={s.addBtn} onPress={() => setShowCreate(true)}>
              <Text style={s.addBtnTxt}>+ New Key</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <KeyCard
            item={item}
            onRevoke={() => handleRevoke(item.id)}
            onActivate={() => handleActivate(item.id)}
            onDelete={() => handleDelete(item.id)}
            c={c}
          />
        )}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyTxt}>No API keys yet.</Text>
            <TouchableOpacity style={s.emptyBtn} onPress={() => setShowCreate(true)}>
              <Text style={s.emptyBtnTxt}>Create your first key</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 40 }}
      />

      <CreateKeyModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={(data) => {
          setShowCreate(false);
          setSecretData(data);
          load(true);
        }}
        c={c}
      />

      <SecretModal
        data={secretData}
        onClose={() => setSecretData(null)}
        c={c}
      />
    </View>
  );
}
