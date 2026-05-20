import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import SecurityQuestionScreen from '../screens/auth/SecurityQuestionScreen';
import TwoFactorScreen from '../screens/auth/TwoFactorScreen';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  SecurityQuestion: { email: string };
  TwoFactor: { email: string; method: string };
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="SecurityQuestion" component={SecurityQuestionScreen} />
      <Stack.Screen name="TwoFactor" component={TwoFactorScreen} />
    </Stack.Navigator>
  );
}
