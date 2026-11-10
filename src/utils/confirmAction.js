import { Alert, Platform } from 'react-native';
export function confirmAction(title, message, confirmLabel = 'Excluir') {
  if (Platform.OS === 'web') return Promise.resolve(typeof globalThis.confirm === 'function' && globalThis.confirm(title + '\n\n' + message));
  return new Promise((resolve) => Alert.alert(title, message, [
    { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
    { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
  ], { cancelable: true, onDismiss: () => resolve(false) }));
}
