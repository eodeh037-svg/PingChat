import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: 'AIzaSyByobrtihuNSD7GSGzYGalKi-eKovaDOQM',
  authDomain: 'ping-ce71c.firebaseapp.com',
  projectId: 'ping-ce71c',
  storageBucket: 'ping-ce71c.firebasestorage.app',
  messagingSenderId: '240936981509',
  appId: '1:240936981509:web:c14ccc602bd6b80c80386c',
  measurementId: 'G-67WQTPRTTL',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

function createAuth() {
  if (Platform.OS === 'web') {
    return getAuth(app);
  }

  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'auth/already-initialized'
    ) {
      return getAuth(app);
    }

    throw error;
  }
}

export const auth = createAuth();
export const db = getFirestore(app);
