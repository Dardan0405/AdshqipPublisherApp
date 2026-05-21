import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SitesStackParamList } from '../../navigation/AppTabs';
import { createApp, updateApp, getApp } from '../../api/publisher';
import { useTheme, AppColors } from '../../theme';

type Props = NativeStackScreenProps<SitesStackParamList, 'AppForm'>;

const APP_TYPES = ['telegram_mini_app', 'android', 'ios', 'web_app'];

const makeStyles = (c: AppColors) => StyleSheet.create({
  flex: { flex: 1, backgroundColor: c.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: 24, paddingTop: 32 },
  title: { fontSize: 22, fontWeight: '700', color: c.text, marginBottom: 28 },
  label: { fontSize: 13, fontWeight: '600', color: c.textSub, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: c.border, borderRadius: 10, padding: 14, marginBottom: 20, fontSize: 15, color: c.text, backgroundColor: c.card },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  typeBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: c.border, backgroundColor: c.card },
  typeBtnActive: { backgroundColor: c.primary, borderColor: c.primary },
  typeTxt: { fontSize: 12, color: c.textSub },
  typeTxtActive: { color: '#fff', fontWeight: '600' },
  btn: { backgroundColor: c.primary, borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  cancelBtn: { marginTop: 16, alignItems: 'center' },
  cancelText: { fontSize: 15, color: c.textMuted },
});

export default function AppFormScreen({ route, navigation }: Props) {
  const editId = route.params?.appId;
  const [appName, setAppName] = useState('');
  const [appUrl, setAppUrl] = useState('');
  const [appType, setAppType] = useState('telegram_mini_app');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!editId);
  const { colors: c } = useTheme();
  const s = makeStyles(c);

  useEffect(() => {
    if (!editId) return;
    (async () => {
      try {
        const res = await getApp(editId);
        const app = res.data ?? res;
        setAppName(app.app_name ?? '');
        setAppUrl(app.app_url ?? '');
        setAppType(app.application_type ?? 'telegram_mini_app');
        setCategory(app.category ?? '');
      } catch {
        Alert.alert('Error', 'Failed to load app.');
        navigation.goBack();
      } finally {
        setFetching(false);
      }
    })();
  }, [editId]);

  const handleSave = async () => {
    if (!appName.trim()) { Alert.alert('Error', 'App name is required.'); return; }
    if (!appUrl.trim()) { Alert.alert('Error', 'App URL is required.'); return; }
    setLoading(true);
    try {
      const payload = { application_type: appType, app_url: appUrl.trim(), app_name: appName.trim(), category: category.trim() };
      if (editId) {
        await updateApp(editId, payload);
        Alert.alert('Saved', 'App updated successfully.');
      } else {
        await createApp(payload);
        Alert.alert('Created', 'App added successfully.');
      }
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'Failed to save app.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <View style={s.center}><ActivityIndicator color={c.primary} /></View>;

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        <Text style={s.title}>{editId ? 'Edit App' : 'Add App'}</Text>

        <Text style={s.label}>App Type</Text>
        <View style={s.typeRow}>
          {APP_TYPES.map((t) => (
            <TouchableOpacity key={t} style={[s.typeBtn, appType === t && s.typeBtnActive]} onPress={() => setAppType(t)}>
              <Text style={[s.typeTxt, appType === t && s.typeTxtActive]}>{t.replace(/_/g, ' ')}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.label}>App Name</Text>
        <TextInput style={s.input} placeholder="My Telegram Mini App" placeholderTextColor={c.textLight} value={appName} onChangeText={setAppName} />

        <Text style={s.label}>App URL</Text>
        <TextInput style={s.input} placeholder="https://t.me/my_bot/app" placeholderTextColor={c.textLight} autoCapitalize="none" keyboardType="url" value={appUrl} onChangeText={setAppUrl} />

        <Text style={s.label}>Category (optional)</Text>
        <TextInput style={s.input} placeholder="Entertainment" placeholderTextColor={c.textLight} value={category} onChangeText={setCategory} />

        <TouchableOpacity style={s.btn} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>{editId ? 'Save Changes' : 'Add App'}</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={s.cancelBtn} onPress={() => navigation.goBack()}>
          <Text style={s.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
