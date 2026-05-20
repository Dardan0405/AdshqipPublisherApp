import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AuthStack';
import { verifySecurityQuestion } from '../../api/auth';
import useAuthStore from '../../stores/authStore';

type Props = NativeStackScreenProps<AuthStackParamList, 'SecurityQuestion'>;

export default function SecurityQuestionScreen({ route, navigation }: Props) {
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const { email, question } = route.params;

  const handleVerify = async () => {
    if (!answer.trim()) {
      Alert.alert('Error', 'Please enter your answer.');
      return;
    }
    setLoading(true);
    try {
      const data = await verifySecurityQuestion({ email, answer: answer.trim() });
      if (data.token && data.user) {
        await setAuth(data.token, data.user);
      } else {
        Alert.alert('Verified', 'Please sign in again.');
        navigation.navigate('Login');
      }
    } catch (err: any) {
      Alert.alert('Incorrect', err?.response?.data?.message ?? 'Wrong answer. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.container}>
      <View style={s.card}>
        <Text style={s.logo}>Adshqip</Text>
        <Text style={s.title}>Security Question</Text>
        {question ? <Text style={s.question}>"{question}"</Text> : null}
        <Text style={s.hint}>Please answer your security question to continue.</Text>

        <Text style={s.label}>Your Answer</Text>
        <TextInput
          style={s.input}
          placeholder="Enter answer"
          placeholderTextColor="#9ca3af"
          autoCapitalize="none"
          value={answer}
          onChangeText={setAnswer}
          onSubmitEditing={handleVerify}
          returnKeyType="go"
        />

        <TouchableOpacity style={s.btn} onPress={handleVerify} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Verify</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={s.linkWrap} onPress={() => navigation.navigate('Login')}>
          <Text style={s.link}>← Back to Sign In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', justifyContent: 'center', paddingHorizontal: 24 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 28, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  logo: { fontSize: 24, fontWeight: '800', color: '#6366f1', textAlign: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#111827', textAlign: 'center', marginBottom: 8 },
  question: { fontSize: 15, fontStyle: 'italic', color: '#374151', textAlign: 'center', marginBottom: 8 },
  hint: { fontSize: 13, color: '#6b7280', textAlign: 'center', marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 14, marginBottom: 16, fontSize: 15, color: '#111827', backgroundColor: '#fafafa' },
  btn: { backgroundColor: '#6366f1', borderRadius: 10, padding: 15, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  linkWrap: { marginTop: 20, alignItems: 'center' },
  link: { fontSize: 14, color: '#6366f1' },
});
