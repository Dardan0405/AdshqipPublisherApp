import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SettingsStackParamList } from '../../navigation/AppTabs';
import useAuthStore from '../../stores/authStore';

type Props = NativeStackScreenProps<SettingsStackParamList, 'SettingsMenu'>;

type MenuRow = { label: string; icon: string; onPress: () => void; danger?: boolean };

export default function SettingsScreen({ navigation }: Props) {
  const { user, logout } = useAuthStore();

  const confirmLogout = () =>
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);

  const rows: MenuRow[] = [
    { label: 'Personal Information', icon: '👤', onPress: () => navigation.navigate('PersonalInfo') },
    { label: 'Payment Settings', icon: '💳', onPress: () => navigation.navigate('PaymentSettings') },
    { label: 'Notification Settings', icon: '🔔', onPress: () => {} },
    { label: 'Two-Factor Authentication', icon: '🔐', onPress: () => {} },
    { label: 'API Keys', icon: '🔑', onPress: () => {} },
    { label: 'KYC Verification', icon: '📋', onPress: () => {} },
    { label: 'Support Tickets', icon: '🎫', onPress: () => {} },
    { label: 'Activity Log', icon: '📝', onPress: () => {} },
    { label: 'Sign Out', icon: '🚪', onPress: confirmLogout, danger: true },
  ];

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Settings</Text>
        <Text style={s.email}>{user?.email}</Text>
        <Text style={s.role}>Publisher Account</Text>
      </View>

      <View style={s.menu}>
        {rows.map((row) => (
          <TouchableOpacity key={row.label} style={s.row} onPress={row.onPress}>
            <Text style={s.icon}>{row.icon}</Text>
            <Text style={[s.label, row.danger && { color: '#ef4444' }]}>{row.label}</Text>
            <Text style={s.arrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: { backgroundColor: '#6366f1', padding: 24, paddingTop: 56 },
  title: { fontSize: 22, fontWeight: '700', color: '#fff' },
  email: { fontSize: 13, color: '#c7d2fe', marginTop: 4 },
  role: { fontSize: 12, color: '#a5b4fc', marginTop: 2 },
  menu: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 20, borderRadius: 14, overflow: 'hidden', elevation: 2 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f9fafb' },
  icon: { fontSize: 18, marginRight: 12, width: 28, textAlign: 'center' },
  label: { flex: 1, fontSize: 15, color: '#374151' },
  arrow: { fontSize: 20, color: '#d1d5db' },
});
