# Password recovery — native build verification

Expo Go is useful for screen and service checks, but it is not release evidence for
email-to-app recovery links.

## Required Supabase configuration

- Add `nordyan://auth/recovery-callback` to Auth redirect URLs.
- Keep the recovery email template on Supabase's recovery confirmation URL so
  `resetPasswordForEmail(..., { redirectTo })` returns a PKCE code to that callback.
- Do not put access tokens, refresh tokens, passwords, or email addresses in custom URLs.

## Repeat in every release channel

Run the complete matrix in:

1. iOS development build
2. Android development build
3. TestFlight
4. Play internal build

## Test matrix

1. From Logga in, open Glömt lösenord?, submit a valid email, and verify the neutral response.
2. Confirm resend remains disabled for 60 seconds and then sends another recovery email.
3. Open the newest email on the same device. Verify NORDYAN opens
   `auth/recovery-callback`, exchanges PKCE, and displays the new-password screen.
4. Submit mismatched and short passwords. Verify localized validation and no navigation.
5. Submit a valid password. Verify confirmation, then continue through the authenticated
   root gate to the existing account.
6. Reopen the consumed link and test an expired and malformed link. Verify the safe error
   state and Skicka/Send en ny återställningslänk action.
7. Begin with an anonymous onboarding draft present, recover an existing account, and verify
   no pending profile, Initial Lifestyle data, or snapshot is attached to that account.
8. Repeat the complete matrix in Swedish and Norwegian Bokmål.

Inspect logs only for failures. No log line may contain an email, password, callback code,
PKCE verifier, JWT, session token, or user identifier.
