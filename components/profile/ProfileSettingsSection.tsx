import { StyleSheet, View } from 'react-native';

import { profileLayout } from '@/theme';

import { ProfileSectionHeading } from './ProfileSectionHeading';

type ProfileSettingsSectionProps = {
  title: string;
  children: React.ReactNode;
};

export function ProfileSettingsSection({ title, children }: ProfileSettingsSectionProps) {
  return (
    <View style={styles.section}>
      <ProfileSectionHeading title={title} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: profileLayout.sectionLabelGap,
  },
});
