import * as Linking from 'expo-linking';
import { Alert } from 'react-native';

import { t } from '@/lib/i18n';

export async function openMailtoUrl(url: string): Promise<void> {
  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert(t('common.mailUnavailable'));
      return;
    }
    await Linking.openURL(url);
  } catch {
    Alert.alert(t('common.mailUnavailable'));
  }
}
