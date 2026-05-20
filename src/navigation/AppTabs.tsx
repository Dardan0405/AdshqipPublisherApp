import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';

import DashboardScreen from '../screens/dashboard/DashboardScreen';
import SitesScreen from '../screens/sites/SitesScreen';
import SiteFormScreen from '../screens/sites/SiteFormScreen';
import AppsScreen from '../screens/apps/AppsScreen';
import AppFormScreen from '../screens/apps/AppFormScreen';
import AdBlocksScreen from '../screens/adblocks/AdBlocksScreen';
import ReportsScreen from '../screens/reports/ReportsScreen';
import EarningsScreen from '../screens/earnings/EarningsScreen';
import WalletScreen from '../screens/wallet/WalletScreen';
import PayoutsScreen from '../screens/wallet/PayoutsScreen';
import ReferralsScreen from '../screens/referrals/ReferralsScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import PersonalInfoScreen from '../screens/settings/PersonalInfoScreen';
import PaymentSettingsScreen from '../screens/settings/PaymentSettingsScreen';

// ── Typed param lists ─────────────────────────────────────────────────────────

export type SitesStackParamList = {
  SitesList: undefined;
  SiteForm: { siteId?: number } | undefined;
  AppsList: undefined;
  AppForm: { appId?: number } | undefined;
  AdBlocks: undefined;
};

export type EarningsStackParamList = {
  EarningsList: undefined;
  Wallet: undefined;
  Payouts: undefined;
  Referrals: undefined;
};

export type SettingsStackParamList = {
  SettingsMenu: undefined;
  PersonalInfo: undefined;
  PaymentSettings: undefined;
};

// ── Stack navigators ──────────────────────────────────────────────────────────

const SitesStack = createNativeStackNavigator<SitesStackParamList>();
const EarningsStack = createNativeStackNavigator<EarningsStackParamList>();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();

function SitesStackNavigator() {
  return (
    <SitesStack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#fff' }, headerTintColor: '#6366f1' }}>
      <SitesStack.Screen name="SitesList" component={SitesScreen} options={{ title: 'My Sites' }} />
      <SitesStack.Screen name="SiteForm" component={SiteFormScreen} options={{ title: '' }} />
      <SitesStack.Screen name="AppsList" component={AppsScreen} options={{ title: 'My Apps' }} />
      <SitesStack.Screen name="AppForm" component={AppFormScreen} options={{ title: '' }} />
      <SitesStack.Screen name="AdBlocks" component={AdBlocksScreen} options={{ title: 'Ad Blocks' }} />
    </SitesStack.Navigator>
  );
}

function EarningsStackNavigator() {
  return (
    <EarningsStack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#fff' }, headerTintColor: '#6366f1' }}>
      <EarningsStack.Screen name="EarningsList" component={EarningsScreen} options={{ title: 'Earnings' }} />
      <EarningsStack.Screen name="Wallet" component={WalletScreen} options={{ title: 'Wallet' }} />
      <EarningsStack.Screen name="Payouts" component={PayoutsScreen} options={{ title: 'Payouts' }} />
      <EarningsStack.Screen name="Referrals" component={ReferralsScreen} options={{ title: 'Referrals' }} />
    </EarningsStack.Navigator>
  );
}

function SettingsStackNavigator() {
  return (
    <SettingsStack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#fff' }, headerTintColor: '#6366f1' }}>
      <SettingsStack.Screen name="SettingsMenu" component={SettingsScreen} options={{ title: 'Settings' }} />
      <SettingsStack.Screen name="PersonalInfo" component={PersonalInfoScreen} options={{ title: 'Personal Information' }} />
      <SettingsStack.Screen name="PaymentSettings" component={PaymentSettingsScreen} options={{ title: 'Payment Settings' }} />
    </SettingsStack.Navigator>
  );
}

// ── Tab navigator ─────────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator();

const icon = (label: string) =>
  ({ color }: { color: string }) => (
    <Text style={{ color, fontSize: 20 }}>{label}</Text>
  );

export default function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: { paddingBottom: 4 },
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardScreen}
        options={{ title: 'Dashboard', tabBarIcon: icon('📊') }}
      />
      <Tab.Screen
        name="SitesTab"
        component={SitesStackNavigator}
        options={{ title: 'Sites', tabBarIcon: icon('🌐') }}
      />
      <Tab.Screen
        name="ReportsTab"
        component={ReportsScreen}
        options={{ title: 'Reports', tabBarIcon: icon('📈') }}
      />
      <Tab.Screen
        name="EarningsTab"
        component={EarningsStackNavigator}
        options={{ title: 'Earnings', tabBarIcon: icon('💰') }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsStackNavigator}
        options={{ title: 'Settings', tabBarIcon: icon('⚙️') }}
      />
    </Tab.Navigator>
  );
}
