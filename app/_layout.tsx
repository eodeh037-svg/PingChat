import '../global.css';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Stack } from 'expo-router';
import { AuthProvider } from './context/AuthContext';

export default function Layout() {
  return (
    <SafeAreaProvider>
<AuthProvider>
      <Stack>
        <Stack.Screen
        name='(tabs) ' options={{headerShown:false}}
        />
        <Stack.Screen 
        name='index'
        options={{headerShown:false}}
        />
        <Stack.Screen
        name='login'
        options={{headerShown:false}}
        />
        <Stack.Screen
        name='signup'
        options={{headerShown:false}}
        />
      </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
