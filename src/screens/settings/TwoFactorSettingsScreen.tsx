import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  TouchableOpacity, TextInput, Alert, Switch, KeyboardAvoidingView, Platform,
} from 'react-native';
import { getTwoFactor, updateTwoFactor } from '../../api/publisher';

interface TfaMethod { key: string; label: string }

export default function TwoFactorSettingsScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [enabledMethods, setEnabledMethods] = useState<string[]>([]);
  const [availableMethods, setAvailableMethods] = useState<TfaMethod[]>([]);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [backupCount, setBackupCount] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const res = await getTwoFactor();
        setEnabledMethods(res.token_types ?? []);
        setAvailableMethods(res.available_methods ?? []);
        setPhone(res.two_factor_phone ?? '');
        setEmail(res.two_factor_email ?? '');
        setBackupCount(res.backup_codes_count ?? 0);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggle = (key: string) => {
    setEnabledMethods((prev) =>
      prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key]
    );
  };

  const handleSave = async () => {
    const needsPhone = enabledMethods.includes('sms') && !phone.trim();
    const needsEmail = enabledMethods.includes('email_otp') && !email.trim();
    if (needsPhone) { Alert.alert('Validation', 'Phone number is required for SMS 2FA.'); return; }
    if (needsEmail) { Alert.alert('Validation', 'Email address is required for Email OTP.'); return; }

    setSaving(true);
    try {
      await updateTwoFactor({
        token_types: enabledMethods,
        two_factor_phone: phone.trim() || null,
        two_factor_email: email.trim() || null,
      });
      Alert.alert('Saved', 'Two-factor authentication settings updated.');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <View style={s.center}><ActivityIndicator size="large" color="#6366f1" /></View>;
  }

  const isEnabled = enabledMethods.length > 0;

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">

        {/* Status banner */}
        <View style={[s.banner, isEnabled ? s.bannerOn : s.bannerOff]}>
          <View style={[s.bannerDot, { backgroundColor: isEnabled ? '#10b981' : '#9ca3af' }]} />
          <Text style={[s.bannerTxt, { color: isEnabled ? '#065f46' : '#6b7280' }]}>
            {isEnabled ? `2FA Enabled (${enabledMethods.length} method${enabledMethods.length > 1 ? 's' : ''})` : '2FA Disabled'}
          </Text>
        </View>

        {/* Method toggles */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Authentication Methods</Text>
          {availableMethods.map((method) => (
            <View key={method.key}>
              <View style={s.methodRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.methodLabel}>{method.label}</Text>
                  {method.key === 'backup_code' && backupCount > 0 && (
                    <Text style={s.methodSub}>{backupCount} unused codes</Text>
                  )}
                </View>
                <Switch
                  value={enabledMethods.includes(method.key)}
                  onValueChange={() => toggle(method.key)}
                  trackColor={{ false: '#e5e7eb', true: '#a5b4fc' }}
                  thumbColor={enabledMethods.includes(method.key) ? '#6366f1' : '#f4f3f4'}
                />
              </View>

              {/* Phone input when SMS enabled */}
              {method.key === 'sms' && enabledMethods.includes('sms') && (
                <View style={s.subInput}>
                  <Text style={s.subLabel}>Phone Number</Text>
                  <TextInput
                    style={s.input}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="+1 555 000 0000"
                    placeholderTextColor="#9ca3af"
                    keyboardType="phone-pad"
                  />
                </View>
              )}

              {/* Email input when Email OTP enabled */}
              {method.key === 'email_otp' && enabledMethods.includes('email_otp') && (
                <View style={s.subInput}>
                  <Text style={s.subLabel}>Email Address</Text>
                  <TextInput
                    style={s.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@example.com"
                    placeholderTextColor="#9ca3af"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Info box */}
        <View style={s.infoBox}>
          <Text style={s.infoTxt}>
            Enabling two-factor authentication adds an extra layer of security. You will be asked to verify your identity each time you log in.
          </Text>
        </View>

        <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveBtnTxt}>Save Settings</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f3f4f6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: 16, paddingBottom: 40 },

  banner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1,
  },
  bannerOn: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  bannerOff: { backgroundColor: '#f9fafb', borderColor: '#e5e7eb' },
  bannerDot: { width: 10, height: 10, borderRadius: 5 },
  bannerTxt: { fontSize: 14, fontWeight: '700' },

  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 1 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 16 },

  methodRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#f9fafb',
  },
  methodLabel: { fontSize: 15, color: '#111827', fontWeight: '500' },
  methodSub: { fontSize: 11, color: '#9ca3af', marginTop: 2 },

  subInput: { paddingLeft: 4, paddingBottom: 12, paddingTop: 4 },
  subLabel: { fontSize: 12, fontWeight: '600', color: '#6b7280', marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12,
    fontSize: 14, color: '#111827', backgroundColor: '#f9fafb',
  },

  infoBox: { backgroundColor: '#eef2ff', borderRadius: 10, padding: 14, marginBottom: 20 },
  infoTxt: { fontSize: 13, color: '#4338ca', lineHeight: 20 },

  saveBtn: { backgroundColor: '#6366f1', borderRadius: 10, padding: 15, alignItems: 'center' },
  saveBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
