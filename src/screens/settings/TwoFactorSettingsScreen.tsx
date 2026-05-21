import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  TouchableOpacity, TextInput, Alert, Switch, KeyboardAvoidingView, Platform,
} from 'react-native';
import { getTwoFactor, updateTwoFactor } from '../../api/publisher';
import { useTheme, AppColors } from '../../theme';

interface TfaMethod { key: string; label: string }

const makeStyles = (c: AppColors) => StyleSheet.create({
  flex: { flex: 1, backgroundColor: c.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: 16, paddingBottom: 40 },
  banner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1,
  },
  bannerOn: { backgroundColor: c.successBg, borderColor: c.successBorder },
  bannerOff: { backgroundColor: c.bg, borderColor: c.border },
  bannerDot: { width: 10, height: 10, borderRadius: 5 },
  bannerTxt: { fontSize: 14, fontWeight: '700' },
  card: { backgroundColor: c.card, borderRadius: 12, padding: 16, marginBottom: 16, elevation: 1 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: c.textSub, marginBottom: 16 },
  methodRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: c.borderLight,
  },
  methodLabel: { fontSize: 15, color: c.text, fontWeight: '500' },
  methodSub: { fontSize: 11, color: c.textLight, marginTop: 2 },
  subInput: { paddingLeft: 4, paddingBottom: 12, paddingTop: 4 },
  subLabel: { fontSize: 12, fontWeight: '600', color: c.textMuted, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: c.border, borderRadius: 10, padding: 12,
    fontSize: 14, color: c.text, backgroundColor: c.input,
  },
  infoBox: { backgroundColor: c.primaryBg, borderRadius: 10, padding: 14, marginBottom: 20 },
  infoTxt: { fontSize: 13, color: c.primaryBorder, lineHeight: 20 },
  saveBtn: { backgroundColor: c.primary, borderRadius: 10, padding: 15, alignItems: 'center' },
  saveBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

export default function TwoFactorSettingsScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabledMethods, setEnabledMethods] = useState<string[]>([]);
  const [availableMethods, setAvailableMethods] = useState<TfaMethod[]>([]);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [backupCount, setBackupCount] = useState(0);
  const { colors: c } = useTheme();
  const s = makeStyles(c);

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
    return <View style={s.center}><ActivityIndicator size="large" color={c.primary} /></View>;
  }

  const isEnabled = enabledMethods.length > 0;

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">

        <View style={[s.banner, isEnabled ? s.bannerOn : s.bannerOff]}>
          <View style={[s.bannerDot, { backgroundColor: isEnabled ? c.success : c.textMuted }]} />
          <Text style={[s.bannerTxt, { color: isEnabled ? c.success : c.textMuted }]}>
            {isEnabled ? `2FA Enabled (${enabledMethods.length} method${enabledMethods.length > 1 ? 's' : ''})` : '2FA Disabled'}
          </Text>
        </View>

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
                  trackColor={{ false: c.border, true: c.primaryMuted }}
                  thumbColor={enabledMethods.includes(method.key) ? c.primary : '#f4f3f4'}
                />
              </View>

              {method.key === 'sms' && enabledMethods.includes('sms') && (
                <View style={s.subInput}>
                  <Text style={s.subLabel}>Phone Number</Text>
                  <TextInput
                    style={s.input}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="+1 555 000 0000"
                    placeholderTextColor={c.textLight}
                    keyboardType="phone-pad"
                  />
                </View>
              )}

              {method.key === 'email_otp' && enabledMethods.includes('email_otp') && (
                <View style={s.subInput}>
                  <Text style={s.subLabel}>Email Address</Text>
                  <TextInput
                    style={s.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@example.com"
                    placeholderTextColor={c.textLight}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              )}
            </View>
          ))}
        </View>

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
