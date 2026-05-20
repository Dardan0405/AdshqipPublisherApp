import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { getProfile, updatePayoutSettings } from '../../api/publisher';

const METHODS = [
  { key: 'bankwire', label: 'Bank Wire' },
  { key: 'paypal', label: 'PayPal' },
  { key: 'bitcoin', label: 'Bitcoin' },
  { key: 'usdt', label: 'USDT' },
];

export default function PaymentSettingsScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [method, setMethod] = useState('bankwire');
  const [details, setDetails] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      try {
        const res = await getProfile();
        const p = res.profile ?? {};
        if (p.payout_method) setMethod(p.payout_method);
        if (p.payout_details) setDetails(p.payout_details);
      } catch {
        Alert.alert('Error', 'Failed to load payment settings.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const setField = (key: string, val: string) =>
    setDetails((prev) => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await updatePayoutSettings({ payout_method: method, payout_details: details });
      Alert.alert('Saved', 'Payment settings updated.');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <View style={s.center}><ActivityIndicator color="#6366f1" /></View>;

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        <Text style={s.pageTitle}>Payment Settings</Text>

        <Text style={s.label}>Payout Method</Text>
        <View style={s.methodGrid}>
          {METHODS.map((m) => (
            <TouchableOpacity
              key={m.key}
              style={[s.methodBtn, method === m.key && s.methodBtnActive]}
              onPress={() => setMethod(m.key)}
            >
              <Text style={[s.methodTxt, method === m.key && s.methodTxtActive]}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {method === 'bankwire' && (
          <>
            <Text style={s.label}>Account Holder Name</Text>
            <TextInput style={s.input} value={details.account_name ?? ''} onChangeText={(v) => setField('account_name', v)} placeholder="Jane Doe" placeholderTextColor="#9ca3af" />
            <Text style={s.label}>IBAN</Text>
            <TextInput style={s.input} value={details.iban ?? ''} onChangeText={(v) => setField('iban', v)} placeholder="AL47 2121 1009 0000 0002 3569 8741" placeholderTextColor="#9ca3af" autoCapitalize="characters" />
            <Text style={s.label}>SWIFT / BIC</Text>
            <TextInput style={s.input} value={details.swift ?? ''} onChangeText={(v) => setField('swift', v)} placeholder="NCBAALTXXX" placeholderTextColor="#9ca3af" autoCapitalize="characters" />
            <Text style={s.label}>Bank Name</Text>
            <TextInput style={s.input} value={details.bank_name ?? ''} onChangeText={(v) => setField('bank_name', v)} placeholder="Raiffeisen Bank Albania" placeholderTextColor="#9ca3af" />
          </>
        )}

        {method === 'paypal' && (
          <>
            <Text style={s.label}>PayPal Email</Text>
            <TextInput style={s.input} value={details.email ?? ''} onChangeText={(v) => setField('email', v)} placeholder="you@paypal.com" placeholderTextColor="#9ca3af" keyboardType="email-address" autoCapitalize="none" />
          </>
        )}

        {(method === 'bitcoin' || method === 'usdt') && (
          <>
            <Text style={s.label}>{method === 'bitcoin' ? 'Bitcoin' : 'USDT (TRC-20)'} Wallet Address</Text>
            <TextInput style={s.input} value={details.wallet ?? ''} onChangeText={(v) => setField('wallet', v)} placeholder="Wallet address" placeholderTextColor="#9ca3af" autoCapitalize="none" />
          </>
        )}

        <TouchableOpacity style={s.btn} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Save Changes</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f3f4f6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: 24, paddingTop: 32, paddingBottom: 48 },
  pageTitle: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 28 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 14, marginBottom: 18, fontSize: 15, color: '#111827', backgroundColor: '#fff' },
  methodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  methodBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#fff' },
  methodBtnActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  methodTxt: { fontSize: 13, color: '#374151' },
  methodTxtActive: { color: '#fff', fontWeight: '600' },
  btn: { backgroundColor: '#6366f1', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
