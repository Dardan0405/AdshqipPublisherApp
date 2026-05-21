import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SitesStackParamList } from '../../navigation/AppTabs';
import { getSites, getApps, createAdBlock, updateAdBlock, getAdBlockTag } from '../../api/publisher';
import { Site, App } from '../../types/publisher';
import { useTheme, AppColors } from '../../theme';

type Props = NativeStackScreenProps<SitesStackParamList, 'AdBlockForm'>;

const FORMATS = [
  { key: 'display_web',   label: 'Display Web' },
  { key: 'special_web',  label: 'Special Web' },
  { key: 'display_video', label: 'Video' },
];

const FORMAT_SIZES: Record<string, { key: string; label: string }[]> = {
  display_web: [
    { key: '300x250', label: '300×250' },
    { key: '728x90',  label: '728×90' },
    { key: '160x600', label: '160×600' },
    { key: '300x600', label: '300×600' },
    { key: '320x50',  label: '320×50' },
    { key: '970x250', label: '970×250' },
  ],
  special_web: [
    { key: 'native',       label: 'Native' },
    { key: 'interstitial', label: 'Interstitial' },
    { key: 'popunder',     label: 'Popunder' },
    { key: 'direct_link',  label: 'Direct Link' },
    { key: 'in_page_push', label: 'In-Page Push' },
    { key: 'social_bar',   label: 'Social Bar' },
    { key: 'text',         label: 'Text' },
  ],
  display_video: [
    { key: 'instream',  label: 'In-Stream' },
    { key: 'outstream', label: 'Out-Stream' },
    { key: 'rewarded',  label: 'Rewarded' },
  ],
};

const PLACEMENTS = [
  'header', 'sidebar', 'content', 'footer',
  'overlay', 'interstitial', 'push', 'popup',
];

const makeStyles = (c: AppColors) => StyleSheet.create({
  flex: { flex: 1, backgroundColor: c.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: 24, paddingTop: 32 },
  title: { fontSize: 22, fontWeight: '700', color: c.text, marginBottom: 28 },
  label: { fontSize: 13, fontWeight: '600', color: c.textSub, marginBottom: 8 },
  hint: { fontSize: 13, color: c.textLight, marginBottom: 16, fontStyle: 'italic' },
  spacer: { height: 12 },
  input: {
    borderWidth: 1, borderColor: c.border, borderRadius: 10,
    padding: 14, marginBottom: 20, fontSize: 15,
    color: c.text, backgroundColor: c.card,
  },
  toggleRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  toggleBtn: {
    flex: 1, paddingVertical: 11, borderRadius: 10,
    borderWidth: 1, borderColor: c.border,
    backgroundColor: c.card, alignItems: 'center',
  },
  toggleBtnActive: { backgroundColor: c.primary, borderColor: c.primary },
  toggleTxt: { fontSize: 14, fontWeight: '600', color: c.textSub },
  toggleTxtActive: { color: '#fff' },
  selectorCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: c.card, borderRadius: 10, padding: 14,
    marginBottom: 8, borderWidth: 1, borderColor: c.border,
  },
  selectorCardActive: { borderColor: c.primary, backgroundColor: c.primaryBg },
  selectorDot: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: c.border,
    justifyContent: 'center', alignItems: 'center',
  },
  selectorDotInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: c.primary },
  selectorName: { fontSize: 14, fontWeight: '600', color: c.textSub },
  selectorNameActive: { color: c.primary },
  selectorSub: { fontSize: 12, color: c.textLight, marginTop: 1 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: c.border, backgroundColor: c.card,
  },
  chipActive: { backgroundColor: c.primary, borderColor: c.primary },
  chipTxt: { fontSize: 13, color: c.textSub, fontWeight: '500' },
  chipTxtActive: { color: '#fff', fontWeight: '600' },
  saveBtn: {
    backgroundColor: c.primary, borderRadius: 10,
    padding: 16, alignItems: 'center', marginTop: 12,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  cancelBtn: { marginTop: 16, alignItems: 'center', marginBottom: 8 },
  cancelTxt: { fontSize: 15, color: c.textMuted },
});

export default function AdBlockFormScreen({ route, navigation }: Props) {
  const editId = route.params?.adBlockId;
  const [chooseType, setChooseType] = useState<'web' | 'app'>('web');
  const [sites, setSites] = useState<Site[]>([]);
  const [apps, setApps] = useState<App[]>([]);
  const [siteId, setSiteId] = useState<number | null>(null);
  const [appId, setAppId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [format, setFormat] = useState('display_web');
  const [size, setSize] = useState('300x250');
  const [placement, setPlacement] = useState('content');
  const [status, setStatus] = useState<'active' | 'paused'>('active');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const { colors: c } = useTheme();
  const s = makeStyles(c);

  useEffect(() => {
    (async () => {
      try {
        const [sRes, aRes] = await Promise.all([getSites(), getApps()]);
        const siteList: Site[] = sRes.data ?? [];
        const appList: App[] = aRes.data ?? [];
        setSites(siteList);
        setApps(appList);
        if (!editId) {
          if (siteList.length > 0) setSiteId(siteList[0].id);
          if (appList.length > 0) setAppId(appList[0].id);
        }
      } catch {
        Alert.alert('Error', 'Failed to load sites/apps.');
      } finally {
        if (!editId) setFetching(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!editId) return;
    getAdBlockTag(editId)
      .then((res) => {
        const d = res.editable ?? res;
        setChooseType(d.choose_type === 'app' ? 'app' : 'web');
        setSiteId(d.site_id ?? null);
        setAppId(d.mobile_app_id ?? null);
        setName(d.name ?? '');
        const fmt = d.format_id ?? 'display_web';
        setFormat(fmt);
        setSize(d.size_id ?? (FORMAT_SIZES[fmt]?.[0]?.key ?? ''));
        setPlacement(d.placement ?? 'content');
        setStatus(d.status === 'paused' ? 'paused' : 'active');
      })
      .catch(() => { Alert.alert('Error', 'Failed to load ad block.'); navigation.goBack(); })
      .finally(() => setFetching(false));
  }, [editId]);

  const handleFormatChange = (fmt: string) => {
    setFormat(fmt);
    const sizes = FORMAT_SIZES[fmt] ?? [];
    if (sizes.length > 0) setSize(sizes[0].key);
  };

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Validation', 'Ad block name is required.'); return; }
    if (chooseType === 'web' && !siteId) { Alert.alert('Validation', 'Please select a site.'); return; }
    if (chooseType === 'app' && !appId) { Alert.alert('Validation', 'Please select an app.'); return; }

    const payload: Record<string, unknown> = {
      choose_type: chooseType,
      site_id: chooseType === 'web' ? siteId : null,
      mobile_app_id: chooseType === 'app' ? appId : null,
      name: name.trim(),
      format_id: format,
      size_id: size || null,
      zone_type: format,
      placement,
      status,
    };

    setLoading(true);
    try {
      if (editId) {
        await updateAdBlock(editId, payload);
        Alert.alert('Saved', 'Ad block updated.');
      } else {
        await createAdBlock(payload);
        Alert.alert('Created', 'Ad block created. Tap "Tag" on the list to get your embed code.');
      }
      navigation.goBack();
    } catch (err: any) {
      const errors = err?.response?.data?.errors;
      const msg = errors
        ? Object.values(errors).flat().join('\n')
        : (err?.response?.data?.message ?? 'Failed to save ad block.');
      Alert.alert('Error', String(msg));
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <View style={s.center}><ActivityIndicator size="large" color={c.primary} /></View>;
  }

  const currentSizes = FORMAT_SIZES[format] ?? [];

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        <Text style={s.title}>{editId ? 'Edit Ad Block' : 'New Ad Block'}</Text>

        <Text style={s.label}>Type</Text>
        <View style={s.toggleRow}>
          {(['web', 'app'] as const).map((t) => (
            <TouchableOpacity
              key={t}
              style={[s.toggleBtn, chooseType === t && s.toggleBtnActive]}
              onPress={() => setChooseType(t)}
            >
              <Text style={[s.toggleTxt, chooseType === t && s.toggleTxtActive]}>
                {t === 'web' ? 'Web Site' : 'Mobile App'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {chooseType === 'web' && (
          <>
            <Text style={s.label}>Site</Text>
            {sites.length === 0 ? (
              <Text style={s.hint}>No sites yet. Add a site first.</Text>
            ) : (
              sites.map((site) => (
                <TouchableOpacity
                  key={site.id}
                  style={[s.selectorCard, siteId === site.id && s.selectorCardActive]}
                  onPress={() => setSiteId(site.id)}
                >
                  <View style={s.selectorDot}>
                    {siteId === site.id && <View style={s.selectorDotInner} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.selectorName, siteId === site.id && s.selectorNameActive]}>
                      {site.name}
                    </Text>
                    <Text style={s.selectorSub}>{site.domain}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
            <View style={s.spacer} />
          </>
        )}

        {chooseType === 'app' && (
          <>
            <Text style={s.label}>App</Text>
            {apps.length === 0 ? (
              <Text style={s.hint}>No apps yet. Add an app first.</Text>
            ) : (
              apps.map((app) => (
                <TouchableOpacity
                  key={app.id}
                  style={[s.selectorCard, appId === app.id && s.selectorCardActive]}
                  onPress={() => setAppId(app.id)}
                >
                  <View style={s.selectorDot}>
                    {appId === app.id && <View style={s.selectorDotInner} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.selectorName, appId === app.id && s.selectorNameActive]}>
                      {app.app_name}
                    </Text>
                    <Text style={s.selectorSub}>{app.app_url}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
            <View style={s.spacer} />
          </>
        )}

        <Text style={s.label}>Ad Block Name</Text>
        <TextInput
          style={s.input}
          placeholder="Sidebar Banner"
          placeholderTextColor={c.textLight}
          value={name}
          onChangeText={setName}
        />

        <Text style={s.label}>Format</Text>
        <View style={s.chipRow}>
          {FORMATS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[s.chip, format === f.key && s.chipActive]}
              onPress={() => handleFormatChange(f.key)}
            >
              <Text style={[s.chipTxt, format === f.key && s.chipTxtActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {currentSizes.length > 0 && (
          <>
            <Text style={s.label}>Size / Type</Text>
            <View style={s.chipRow}>
              {currentSizes.map((sz) => (
                <TouchableOpacity
                  key={sz.key}
                  style={[s.chip, size === sz.key && s.chipActive]}
                  onPress={() => setSize(sz.key)}
                >
                  <Text style={[s.chipTxt, size === sz.key && s.chipTxtActive]}>{sz.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <Text style={s.label}>Placement</Text>
        <View style={s.chipRow}>
          {PLACEMENTS.map((p) => (
            <TouchableOpacity
              key={p}
              style={[s.chip, placement === p && s.chipActive]}
              onPress={() => setPlacement(p)}
            >
              <Text style={[s.chipTxt, placement === p && s.chipTxtActive]}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.label}>Status</Text>
        <View style={s.toggleRow}>
          {(['active', 'paused'] as const).map((st) => (
            <TouchableOpacity
              key={st}
              style={[s.toggleBtn, status === st && s.toggleBtnActive]}
              onPress={() => setStatus(st)}
            >
              <Text style={[s.toggleTxt, status === st && s.toggleTxtActive]}>
                {st.charAt(0).toUpperCase() + st.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.saveBtnText}>{editId ? 'Save Changes' : 'Create Ad Block'}</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={s.cancelBtn} onPress={() => navigation.goBack()}>
          <Text style={s.cancelTxt}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
