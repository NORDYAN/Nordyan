import { t } from '@/lib/i18n';

export function buildProfilePrivacyView() {
  return {
    title: t('profile.privacy'),
    deleteTitle: t('profile.privacy.delete.title'),
    body: t('profile.privacy.delete.body'),
    confirmCheck: t('profile.privacy.delete.confirmCheck'),
    action: t('profile.privacy.delete.action'),
    processing: t('profile.privacy.delete.processing'),
    error: t('profile.privacy.delete.error'),
    alertTitle: t('profile.privacy.delete.alertTitle'),
    alertMessage: t('profile.privacy.delete.alertMessage'),
    alertConfirm: t('profile.privacy.delete.alertConfirm'),
    cancel: t('common.cancel'),
  };
}
