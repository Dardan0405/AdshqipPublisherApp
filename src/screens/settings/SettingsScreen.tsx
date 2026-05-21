import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SettingsStackParamList } from '../../navigation/AppTabs';
import useAuthStore from '../../stores/authStore';
import useThemeStore, { ThemeMode } from '../../stores/themeStore';
import { useTheme, AppColors } from '../../theme';

type Props = NativeStackScreenProps<SettingsStackParamList, 'SettingsMenu'>;
type MenuRow = { label: string; icon: string; onPress: () => void; danger?: boolean };

const makeStyles = (c: AppColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg },
  header: { backgroundColor: c.headerBg, padding: 24, paddingTop: 56 },
  title: { fontSize: 22, fontWeight: '700', color: c.headerText },
  email: { fontSize: 13, color: c.headerSub, marginTop: 4 },
  role: { fontSize: 12, color: c.headerMuted, marginTop: 2 },
  menu: { backgroundColor: c.card, marginHorizontal: 16, marginTop: 20, borderRadius: 14, overflow: 'hidden', elevation: 2 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: c.borderLight },
  icon: { fontSize: 18, marginRight: 12, width: 28, textAlign: 'center' },
  label: { flex: 1, fontSize: 15, color: c.textSub },
  arrow: { fontSize: 20, color: c.border },
});

export default function SettingsScreen({ navigation }: Props) {
  const { user, logout } = useAuthStore();
  const { mode, setMode } = useThemeStore();
  const { colors: c } = useTheme();
  const s = makeStyles(c);

  const confirmLogout = () =>
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);

  const handleTheme = () => {
    const labels: Record<ThemeMode, string> = { light: 'Light', dark: 'Dark', system: 'System' };
    Alert.alert('Appearance', `Current: ${labels[mode]}`, [
      { text: 'Light', onPress: () => setMode('light') },
      { text: 'Dark', onPress: () => setMode('dark') },
      { text: 'System Default', onPress: () => setMode('system') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const rows: MenuRow[] = [
    { label: 'Personal Information', icon: '👤', onPress: () => navigation.navigate('PersonalInfo') },
    { label: 'Payment Settings', icon: '💳', onPress: () => navigation.navigate('PaymentSettings') },
    { label: 'Notification Settings', icon: '🔔', onPress: () => {} },
    { label: 'Appearance', icon: '🎨', onPress: handleTheme },
    { label: 'Two-Factor Authentication', icon: '🔐', onPress: () => navigation.navigate('TwoFactorSettings') },
    { label: 'API Keys', icon: '🔑', onPress: () => navigation.navigate('ApiKeys') },
    { label: 'KYC Verification', icon: '📋', onPress: () => navigation.navigate('KycVerification') },
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
