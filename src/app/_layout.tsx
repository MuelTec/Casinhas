/** Layout raiz: proteção por PIN + pilha de navegação. */

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { PinGate } from '@/components/PinGate';
import { colors } from '@/constants/theme';
import { AppProvider, useApp } from '@/context/AppContext';

function Conteudo() {
  const { carregando, precisaCriarPin, bloqueado } = useApp();

  if (carregando) {
    return (
      <View style={estilos.carregando}>
        <ActivityIndicator size="large" color={colors.primaria} />
      </View>
    );
  }

  if (precisaCriarPin || bloqueado) {
    return (
      <SafeAreaProvider>
        <PinGate modo={precisaCriarPin ? 'criar' : 'bloquear'} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.primaria },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: colors.fundo },
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="casa-form" options={{ presentation: 'modal', title: 'Casa' }} />
      </Stack>
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  return (
    <AppProvider>
      <StatusBar style="light" />
      <Conteudo />
    </AppProvider>
  );
}

const estilos = StyleSheet.create({
  carregando: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.fundo,
  },
});
