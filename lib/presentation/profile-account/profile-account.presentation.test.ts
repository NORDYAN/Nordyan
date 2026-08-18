import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { routes } from '../../../constants/routes';

import {
  PROFILE_ACCOUNT_COPY,
  buildAccountProfileFormView,
  buildProfileAccountHeaderView,
  resolveProfileAccountDisplayName,
} from './profile-account.presentation';

describe('resolveProfileAccountDisplayName', () => {
  it('displays firstName when present', () => {
    assert.equal(resolveProfileAccountDisplayName('Anna'), 'Anna');
    assert.equal(resolveProfileAccountDisplayName('  Åsa  '), 'Åsa');
  });

  it('displays the neutral Konto label when firstName is missing', () => {
    assert.equal(resolveProfileAccountDisplayName(null), PROFILE_ACCOUNT_COPY.neutralDisplayName);
    assert.equal(resolveProfileAccountDisplayName(undefined), 'Konto');
    assert.equal(resolveProfileAccountDisplayName('   '), 'Konto');
  });

  it('never uses the email local-part as a name', () => {
    const view = buildProfileAccountHeaderView({
      firstName: null,
      email: 'nisse1975@example.com',
    });
    assert.equal(view.displayName, 'Konto');
    assert.equal(view.email, 'nisse1975@example.com');
    assert.equal(view.displayName.includes('nisse1975'), false);
    assert.equal(view.displayName.toLowerCase().includes('nisse'), false);
    assert.notEqual(view.displayName, 'nisse1975');
    assert.notEqual(view.displayName, 'Nisse1975');
  });
});

describe('buildProfileAccountHeaderView', () => {
  it('shows the saved firstName on the Profile card after update', () => {
    const before = buildProfileAccountHeaderView({
      firstName: null,
      email: 'anna@example.com',
    });
    const after = buildProfileAccountHeaderView({
      firstName: 'Anna',
      email: 'anna@example.com',
    });
    assert.equal(before.displayName, 'Konto');
    assert.equal(after.displayName, 'Anna');
    assert.equal(after.email, 'anna@example.com');
  });

  it('navigates the account card to the Konto & profil route', () => {
    const view = buildProfileAccountHeaderView({
      firstName: 'Anna',
      email: 'anna@example.com',
    });
    assert.equal(view.accountRoute, '/(tabs)/profile/account');
    assert.equal(view.accountRoute, routes.profileAccount);
    assert.equal(view.displayName, 'Anna');
  });
});

describe('buildAccountProfileFormView', () => {
  it('loads the existing firstName and shows email as read-only', () => {
    const view = buildAccountProfileFormView({
      firstName: 'Åsa',
      email: 'asa@example.com',
    });
    assert.equal(view.title, PROFILE_ACCOUNT_COPY.title);
    assert.equal(view.firstNameDraft, 'Åsa');
    assert.equal(view.email, 'asa@example.com');
    assert.equal(view.emailEditable, false);
  });

  it('uses an empty draft when firstName is missing', () => {
    const view = buildAccountProfileFormView({
      firstName: null,
      email: 'user@example.com',
    });
    assert.equal(view.firstNameDraft, '');
    assert.equal(view.email, 'user@example.com');
  });
});
