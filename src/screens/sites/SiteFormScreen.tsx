import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SitesStackParamList } from '../../navigation/AppTabs';
import { createSite, updateSite, getSite } from '../../api/publisher';
import { useTheme, AppColors } from '../../theme';

type Props = NativeStackScreenProps<SitesStackParamList, 'SiteForm'>;

const makeStyles = (c: AppColors) => StyleSheet.create({
  flex: { flex: 1, backgroundColor: c.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: 24, paddingTop: 32 },
  title: { fontSize: 22, fontWeight: '700', color: c.text, marginBottom: 28 },
  label: { fontSize: 13, fontWeight: '600', color: c.textSub, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: c.border, borderRadius: 10, padding: 14, marginBottom: 20, fontSize: 15, color: c.text, backgroundColor: c.card },
  btn: { backgroundColor: c.primary, borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  cancelBtn: { marginTop: 16, alignItems: 'center' },
  cancelText: { fontSize: 15, color: c.textMuted },
});

export default function SiteFormScreen({ route, navigation }: Props) {
  const editId = route.params?.siteId;
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!editId);
  const { colors: c } = useTheme();
  const s = makeStyles(c);

  useEffect(() => {
    if (!editId) return;
    (async () => {
      try {
        const res = await getSite(editId);
        const site = res.data ?? res;
        setName(site.name ?? '');
        setUrl(site.domain ?? site.url ?? '');
      } catch {
        Alert.alert('Error', 'Failed to load site.');
        navigation.goBack();
      } finally {
        setFetching(false);
      }
    })();
  }, [editId]);

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Error', 'Site name is required.'); return; }
    if (!url.trim()) { Alert.alert('Error', 'URL is required.'); return; }
    setLoading(true);
    try {
      if (editId) {
        await updateSite(editId, { name: name.trim(), url: url.trim() });
        Alert.alert('Saved', 'Site updated successfully.');
      } else {
        await createSite({ name: name.trim(), url: url.trim() });
        Alert.alert('Created', 'Site added successfully.');
      }
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'Failed to save site.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <View style={s.center}><ActivityIndicator color={c.primary} /></View>;

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        <Text style={s.title}>{editId ? 'Edit Site' : 'Add Site'}</Text>

        <Text style={s.label}>Site Name</Text>
        <TextInput style={s.input} placeholder="My Blog" placeholderTextColor={c.textLight} value={name} onChangeText={setName} />

        <Text style={s.label}>Website URL</Text>
        <TextInput style={s.input} placeholder="https://example.com" placeholderTextColor={c.textLight} autoCapitalize="none" keyboardType="url" value={url} onChangeText={setUrl} />

        <TouchableOpacity style={s.btn} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>{editId ? 'Save Changes' : 'Add Site'}</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={s.cancelBtn} onPress={() => navigation.goBack()}>
          <Text style={s.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
