import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AuthStack';
import { login } from '../../api/auth';
import useAuthStore from '../../stores/authStore';
import { useTheme, AppColors } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const makeStyles = (c: AppColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg, justifyContent: 'center', paddingHorizontal: 24 },
  card: { backgroundColor: c.card, borderRadius: 16, padding: 28, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  logo: { fontSize: 30, fontWeight: '800', color: c.primary, textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 14, color: c.textMuted, textAlign: 'center', marginBottom: 28 },
  label: { fontSize: 13, fontWeight: '600', color: c.textSub, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: c.border, borderRadius: 10, padding: 14, marginBottom: 16, fontSize: 15, color: c.text, backgroundColor: c.input },
  btn: { backgroundColor: c.primary, borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 4 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  linkWrap: { marginTop: 20, alignItems: 'center' },
  link: { fontSize: 14, color: c.textMuted },
  linkBold: { color: c.primary, fontWeight: '600' },
});

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const { colors: c } = useTheme();
  const s = makeStyles(c);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Error', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const data = await login({ email: email.trim(), password });
      if (data.needs_security_question) {
        navigation.navigate('SecurityQuestion', { email: data.email ?? email.trim(), question: data.question ?? '' });
        return;
      }
      if (data.token && data.user) {
        await setAuth(data.token, data.user);
      } else {
        Alert.alert('Login Failed', data.message ?? 'Unable to sign in.');
      }
    } catch (err: any) {
      Alert.alert('Login Failed', err?.response?.data?.message ?? 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.card}>
        <Text style={s.logo}>Adshqip</Text>
        <Text style={s.subtitle}>Publisher Portal</Text>

        <Text style={s.label}>Email</Text>
        <TextInput style={s.input} placeholder="you@example.com" placeholderTextColor={c.textLight}
          autoCapitalize="none" keyboardType="email-address" autoComplete="email"
          value={email} onChangeText={setEmail} />

        <Text style={s.label}>Password</Text>
        <TextInput style={s.input} placeholder="••••••••" placeholderTextColor={c.textLight}
          secureTextEntry autoComplete="password" value={password} onChangeText={setPassword}
          onSubmitEditing={handleLogin} returnKeyType="go" />

        <TouchableOpacity style={s.btn} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Sign In</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={s.linkWrap} onPress={() => navigation.navigate('Register')}>
          <Text style={s.link}>Don't have an account? <Text style={s.linkBold}>Register</Text></Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
