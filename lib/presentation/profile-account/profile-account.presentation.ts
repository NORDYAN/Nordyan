import { routes } from '@/constants/routes';
import { liveCopy, t } from '@/lib/i18n';
import { normalizeAccountFirstName } from '@/lib/domain/profile/account-first-name';

export const PROFILE_ACCOUNT_COPY = liveCopy({
  neutralDisplayName: () => t('profile.account.neutralName'),
  title: () => t('profile.account.title'),
  saveLabel: () => t('profile.account.save'),
  savingLabel: () => t('profile.account.saving'),
  saveSuccessMessage: () => t('profile.account.saveSuccess'),
  saveErrorMessage: () => t('profile.account.saveError'),
  loadErrorMessage: () => t('profile.account.loadError'),
  unauthenticatedMessage: () => t('profile.account.unauthenticated'),
  notFoundMessage: () => t('profile.account.notFound'),
});

export function resolveProfileAccountDisplayName(
  firstName: string | null | undefined,
): string {
  const normalized = normalizeAccountFirstName(firstName);
  if (normalized) {
    return normalized;
  }

  return PROFILE_ACCOUNT_COPY.neutralDisplayName;
}

export function resolveProfileAccountEmail(email: string | null | undefined): string {
  const trimmed = email?.trim();
  return trimmed ? trimmed : '—';
}

export function buildProfileAccountHeaderView(input: {
  firstName: string | null | undefined;
  email: string | null | undefined;
}): {
  displayName: string;
  email: string;
  accountRoute: typeof routes.profileAccount;
} {
  return {
    displayName: resolveProfileAccountDisplayName(input.firstName),
    email: resolveProfileAccountEmail(input.email),
    accountRoute: routes.profileAccount,
  };
}

export function buildAccountProfileFormView(input: {
  firstName: string | null | undefined;
  email: string | null | undefined;
}): {
  title: string;
  firstNameDraft: string;
  email: string;
  emailEditable: false;
} {
  return {
    title: PROFILE_ACCOUNT_COPY.title,
    firstNameDraft: input.firstName ?? '',
    email: resolveProfileAccountEmail(input.email),
    emailEditable: false,
  };
}
