import React, { useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AuthStack';
import client from '../../api/client';
import useAuthStore from '../../stores/authStore';

type Props = NativeStackScreenProps<AuthStackParamList, 'TwoFactor'>;

export default function TwoFactorScreen({ route, navigation }: Props) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const refs = Array.from({ length: 6 }, () => useRef<TextInput>(null));
  const setAuth = useAuthStore((s) => s.setAuth);
  const { email, method } = route.params;

  const handleDigit = (val: string, idx: number) => {
    const cleaned = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[idx] = cleaned;
    setDigits(next);
    if (cleaned && idx < 5) refs[idx + 1].current?.focus();
  };

  const handleBackspace = (key: string, idx: number) => {
    if (key === 'Backspace' && !digits[idx] && idx > 0) {
      refs[idx - 1].current?.focus();
    }
  };

  const handleVerify = async () => {
    const code = digits.join('');
    if (code.length < 6) {
      Alert.alert('Error', 'Please enter the full 6-digit code.');
      return;
    }
    setLoading(true);
    try {
      const res = await client.post('/two-factor/verify', { email, code, method }).then((r) => r.data);
      if (res.token && res.user) {
        await setAuth(res.token, res.user);
      } else {
        Alert.alert('Failed', res.message ?? 'Verification failed.');
      }
    } catch (err: any) {
      Alert.alert('Invalid Code', err?.response?.data?.message ?? 'The code is incorrect or expired.');
      setDigits(['', '', '', '', '', '']);
      refs[0].current?.focus();
    } finally {
      setLoading(false);
    }
  };

  const methodLabel: Record<string, string> = {
    totp: 'Authenticator App',
    email: 'Email',
    sms: 'SMS',
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.card}>
        <Text style={s.logo}>Adshqip</Text>
        <Text style={s.title}>Two-Factor Auth</Text>
        <Text style={s.subtitle}>
          Enter the 6-digit code sent via {methodLabel[method] ?? method}.
        </Text>

        <View style={s.codeRow}>
          {digits.map((d, i) => (
            <TextInput
              key={i}
              ref={refs[i]}
              style={[s.digitBox, d ? s.digitBoxFilled : null]}
              value={d}
              onChangeText={(v) => handleDigit(v, i)}
              onKeyPress={({ nativeEvent }) => handleBackspace(nativeEvent.key, i)}
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
              selectTextOnFocus
            />
          ))}
        </View>

        <TouchableOpacity style={s.btn} onPress={handleVerify} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Verify</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={s.linkWrap} onPress={() => navigation.navigate('Login')}>
          <Text style={s.link}>← Back to Sign In</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', justifyContent: 'center', paddingHorizontal: 24 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 28, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  logo: { fontSize: 24, fontWeight: '800', color: '#6366f1', textAlign: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#111827', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 13, color: '#6b7280', textAlign: 'center', marginBottom: 28 },
  codeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  digitBox: { width: 44, height: 54, borderWidth: 1.5, borderColor: '#d1d5db', borderRadius: 10, fontSize: 22, fontWeight: '700', color: '#111827', backgroundColor: '#fafafa' },
  digitBoxFilled: { borderColor: '#6366f1', backgroundColor: '#eef2ff' },
  btn: { backgroundColor: '#6366f1', borderRadius: 10, padding: 15, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  linkWrap: { marginTop: 20, alignItems: 'center' },
  link: { fontSize: 14, color: '#6366f1' },
});
