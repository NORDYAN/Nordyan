import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { colors, profileLayout } from '@/theme';

type ProfileSettingsCardProps = {
  children: React.ReactNode;
};

export function ProfileSettingsCard({ children }: ProfileSettingsCardProps) {
  return (
    <Card padding={0} borderRadius={profileLayout.settingsCardRadius} style={styles.card}>
      {children}
    </Card>
  );
}

type ProfileSettingsDividerProps = {
  visible?: boolean;
};

export function ProfileSettingsDivider({ visible = true }: ProfileSettingsDividerProps) {
  if (!visible) {
    return null;
  }

  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    backgroundColor: colors.homeBorder,
  },
});
