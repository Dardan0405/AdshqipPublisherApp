import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AuthStack';
import { verifySecurityQuestion } from '../../api/auth';
import useAuthStore from '../../stores/authStore';

type Props = NativeStackScreenProps<AuthStackParamList, 'SecurityQuestion'>;

export default function SecurityQuestionScreen({ route }: Props) {
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const { email } = route.params;

  const handleVerify = async () => {
    if (!answer) { Alert.alert('Error', 'Please enter your answer.'); return; }
    setLoading(true);
    try {
      const data = await verifySecurityQuestion({ email, answer });
      if (data.token) await setAuth(data.token, data.user);
    } catch (err: any) {
      Alert.alert('Incorrect', err?.response?.data?.message ?? 'Wrong answer. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Security Question</Text>
        <Text style={styles.subtitle}>Please answer your security question to continue.</Text>
        <TextInput
          style={styles.input}
          placeholder="Your answer"
          placeholderTextColor="#9ca3af"
          value={answer}
          onChangeText={setAnswer}
        />
        <TouchableOpacity style={styles.btn} onPress={handleVerify} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Verify</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', justifyContent: 'center', paddingHorizontal: 24 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 28, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  title: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6b7280', marginBottom: 24 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 14, marginBottom: 14, fontSize: 15, color: '#111827' },
  btn: { backgroundColor: '#6366f1', borderRadius: 10, padding: 15, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
