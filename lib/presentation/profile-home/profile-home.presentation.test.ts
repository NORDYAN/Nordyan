import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { routes } from '../../../constants/routes';
import { buildProfileAccountHeaderView } from '../profile-account/profile-account.presentation';

import {
  PROFILE_HOME_COMING_SOON_LABEL,
  PROFILE_HOME_HEALTH_PROFILE_SUBTITLE,
  PROFILE_HOME_MEASUREMENTS_SUBTITLE,
  buildProfileHomeView,
  listProfileHomeComingSoonRows,
  listProfileHomeNavigableRoutes,
  listProfileHomeSectionTitles,
} from './profile-home.presentation';

describe('buildProfileHomeView', () => {
  const view = buildProfileHomeView();
  const comingSoonRows = listProfileHomeComingSoonRows(view);
  const sectionRows = view.sections.flatMap((section) => section.rows);

  it('uses the final section order', () => {
    assert.deepEqual(listProfileHomeSectionTitles(view), [
      'Hälsa',
      'Konto & inställningar',
      'Support & integritet',
    ]);
    assert.equal(listProfileHomeSectionTitles(view).includes('Konto'), false);
    assert.equal(view.sections.every((section) => section.rows.length > 0), true);
  });

  it('keeps the account card active and navigating to Konto & profil', () => {
    assert.equal(view.accountCard.visible, true);
    assert.equal(view.accountCard.status, 'active');
    assert.equal(view.accountCard.route, routes.profileAccount);
  });

  it('keeps Hälsoprofil active', () => {
    const row = sectionRows.find((item) => item.id === 'health-profile');
    assert.equal(row?.status, 'active');
    if (row?.status === 'active') {
      assert.equal(row.title, 'Hälsoprofil');
      assert.equal(row.subtitle, PROFILE_HOME_HEALTH_PROFILE_SUBTITLE);
      assert.equal(row.route, routes.profileHealthProfile);
      assert.equal(row.showChevron, true);
    }
  });

  it('keeps Mätningar active', () => {
    const row = sectionRows.find((item) => item.id === 'measurements');
    assert.equal(row?.status, 'active');
    if (row?.status === 'active') {
      assert.equal(row.title, 'Mätningar');
      assert.equal(row.subtitle, PROFILE_HOME_MEASUREMENTS_SUBTITLE);
      assert.equal(row.route, routes.healthMeasurementHistory);
      assert.equal(row.showChevron, true);
    }
  });

  it('keeps Språk active under Konto & inställningar', () => {
    const row = sectionRows.find((item) => item.id === 'language');
    assert.equal(row?.status, 'active');
    if (row?.status === 'active') {
      assert.equal(row.title, 'Språk');
      assert.equal(row.route, routes.profileLanguage);
      assert.equal(row.showChevron, true);
    }
  });

  it('renders all six future rows as Kommer snart without navigation or chevron', () => {
    assert.deepEqual(
      comingSoonRows.map((row) => row.id),
      [
        'health-data-sources',
        'subscription',
        'notifications',
        'privacy-and-data',
        'help-and-support',
        'feedback',
      ],
    );
    assert.equal(comingSoonRows.length, 6);
    assert.deepEqual(
      comingSoonRows.map((row) => row.title),
      [
        'Hälsodatakällor',
        'Abonnemang',
        'Aviseringar',
        'Integritet och data',
        'Hjälp och support',
        'Ge feedback',
      ],
    );
    for (const row of comingSoonRows) {
      assert.equal(row.status, 'comingSoon');
      assert.equal(row.subtitle, PROFILE_HOME_COMING_SOON_LABEL);
      assert.equal(row.showChevron, false);
      assert.equal(row.route, null);
    }
  });

  it('does not expose navigateTodo or coming-soon routes', () => {
    const navigable = listProfileHomeNavigableRoutes(view);
    assert.deepEqual(navigable, [
      routes.profileAccount,
      routes.profileHealthProfile,
      routes.healthMeasurementHistory,
      routes.profileLanguage,
    ]);
  });

  it('keeps Logga ut active without a chevron', () => {
    assert.equal(view.signOut.status, 'active');
    assert.equal(view.signOut.title, 'Logga ut');
    assert.equal(view.signOut.showChevron, false);
  });

  it('does not infer a name from the email local-part', () => {
    const header = buildProfileAccountHeaderView({
      firstName: null,
      email: 'nisse1975@example.com',
    });
    assert.equal(header.displayName, 'Konto');
    assert.equal(header.email, 'nisse1975@example.com');
    assert.notEqual(header.displayName, 'nisse1975');
  });
});
