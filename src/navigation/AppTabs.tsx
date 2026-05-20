import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';

import DashboardScreen from '../screens/dashboard/DashboardScreen';
import SitesScreen from '../screens/sites/SitesScreen';
import AppsScreen from '../screens/apps/AppsScreen';
import AdBlocksScreen from '../screens/adblocks/AdBlocksScreen';
import ReportsScreen from '../screens/reports/ReportsScreen';
import EarningsScreen from '../screens/earnings/EarningsScreen';
import WalletScreen from '../screens/wallet/WalletScreen';
import ReferralsScreen from '../screens/referrals/ReferralsScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';

const Tab = createBottomTabNavigator();
const SitesStack = createNativeStackNavigator();
const EarningsStack = createNativeStackNavigator();

function SitesStackNavigator() {
  return (
    <SitesStack.Navigator>
      <SitesStack.Screen name="Sites" component={SitesScreen} />
      <SitesStack.Screen name="Apps" component={AppsScreen} />
      <SitesStack.Screen name="AdBlocks" component={AdBlocksScreen} />
    </SitesStack.Navigator>
  );
}

function EarningsStackNavigator() {
  return (
    <EarningsStack.Navigator>
      <EarningsStack.Screen name="Earnings" component={EarningsScreen} />
      <EarningsStack.Screen name="Wallet" component={WalletScreen} />
      <EarningsStack.Screen name="Referrals" component={ReferralsScreen} />
    </EarningsStack.Navigator>
  );
}

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
        component={SettingsScreen}
        options={{ title: 'Settings', tabBarIcon: icon('⚙️') }}
      />
    </Tab.Navigator>
  );
}
