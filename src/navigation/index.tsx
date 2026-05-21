import React, { useEffect } from 'react';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import useAuthStore from '../stores/authStore';
import useThemeStore from '../stores/themeStore';
import { useTheme } from '../theme';
import AuthStack from './AuthStack';
import AppTabs from './AppTabs';
import { navigationRef } from './navigationRef';

export default function RootNavigator() {
  const { isAuthenticated, isLoading, loadToken } = useAuthStore();
  const { loadMode } = useThemeStore();
  const { isDark, colors } = useTheme();

  useEffect(() => {
    loadToken();
    loadMode();
  }, []);

  if (isLoading) {
    return (
      <View style={[styles.loader, { backgroundColor: colors.card }]}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  const navTheme = isDark
    ? { ...DarkTheme, colors: { ...DarkTheme.colors, background: colors.bg, card: colors.card, text: colors.text, border: colors.border } }
    : { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.bg, card: colors.card, text: colors.text, border: colors.border } };

  return (
    <NavigationContainer ref={navigationRef} theme={navTheme}>
      {isAuthenticated ? <AppTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
