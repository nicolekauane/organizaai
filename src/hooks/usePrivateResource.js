import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { createPrivateResource } from '../auth/privateResource';
export function usePrivateResource(loader, role) {
  const resource = useMemo(() => createPrivateResource(loader, role), [loader, role]);
  const state = useSyncExternalStore(resource.subscribe, resource.getSnapshot, resource.getSnapshot);
  useFocusEffect(useCallback(() => {
    resource.activate();
    let foreground = AppState.currentState === 'active' || AppState.currentState === null;
    if (foreground) void resource.reload();
    const subscription = AppState.addEventListener('change', next => {
      foreground = next === 'active';
      if (foreground) void resource.reload(); else resource.clear();
    });
    const interval = setInterval(() => { if (foreground) void resource.reload(); }, 30000);
    return () => { clearInterval(interval); subscription.remove(); resource.deactivate(); };
  }, [resource]));
  return { ...state, reload: resource.reload, resource };
}
