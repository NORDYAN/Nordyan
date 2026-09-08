import { authService } from '@/lib/services/auth/auth.service';

import { clearDeletedUserLocalData } from './clear-account-local-data.runtime';
import { deleteCurrentAccount, type DeleteAccountSession } from './delete-current-account';

export function deleteCurrentAccountForApp(session: DeleteAccountSession | null) {
  return deleteCurrentAccount({
    session,
    authClient: {
      signOut: () => authService.signOut(),
    },
    clearLocalData: clearDeletedUserLocalData,
  });
}
