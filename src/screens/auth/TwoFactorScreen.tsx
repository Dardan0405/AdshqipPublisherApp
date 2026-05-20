import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function TwoFactorScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Two-Factor Auth</Text>
      <Text style={styles.subtitle}>Coming in Phase 2</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6' },
  title: { fontSize: 22, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 14, color: '#9ca3af', marginTop: 8 },
});
