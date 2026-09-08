import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';

import { routes } from '../../../constants/routes';
import { setActiveLocale, t } from '../../i18n';
import { buildProfileAccountHeaderView } from '../profile-account/profile-account.presentation';

import {
  PROFILE_HOME_COMING_SOON_LABEL,
  PROFILE_HOME_HEALTH_PROFILE_SUBTITLE,
  PROFILE_HOME_MEASUREMENTS_SUBTITLE,
  buildProfileHomeView,
  listProfileHomeComingSoonDeadRows,
  listProfileHomeComingSoonNavRows,
  listProfileHomeComingSoonRows,
  listProfileHomeNavigableRoutes,
  listProfileHomeSectionTitles,
} from './profile-home.presentation';

describe('buildProfileHomeView', () => {
  afterEach(() => {
    setActiveLocale('sv');
  });

  const view = buildProfileHomeView();
  const sectionRows = view.sections.flatMap((section) => section.rows);
  const healthRows = view.sections.find((section) => section.id === 'health')?.rows ?? [];

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

  it('keeps Hälsa row order as profile, measurements, sources, Food Scanner, blood tests', () => {
    assert.deepEqual(
      healthRows.map((row) => row.id),
      ['health-profile', 'measurements', 'health-data-sources', 'food-scanner', 'blood-tests'],
    );
  });

  it('keeps Språk active under Konto & inställningar', () => {
    const row = sectionRows.find((item) => item.id === 'language');
    assert.equal(row?.status, 'active');
    if (row?.status === 'active') {
      assert.equal(row.title, 'Språk');
      assert.equal(row.route, routes.profileLanguage);
      assert.equal(row.showChevron, true);
    }
    const accountRows = view.sections.find((section) => section.id === 'account-settings')?.rows ?? [];
    assert.deepEqual(
      accountRows.map((row) => row.id),
      ['language', 'subscription', 'notifications'],
    );
  });

  it('keeps Integritet och data active', () => {
    const row = sectionRows.find((item) => item.id === 'privacy-and-data');
    assert.equal(row?.status, 'active');
    if (row?.status === 'active') {
      assert.equal(row.title, 'Integritet och data');
      assert.equal(row.route, routes.profilePrivacy);
      assert.equal(row.showChevron, true);
    }
  });

  it('makes the four informational coming-soon rows tappable with Kommer snart and chevron', () => {
    const navRows = listProfileHomeComingSoonNavRows(view);
    assert.deepEqual(
      navRows.map((row) => row.id),
      ['health-data-sources', 'food-scanner', 'blood-tests', 'subscription'],
    );
    assert.deepEqual(
      navRows.map((row) => row.title),
      ['Hälsodatakällor', 'Food Scanner', 'Blodprover', 'Abonnemang'],
    );
    assert.deepEqual(
      navRows.map((row) => row.route),
      [
        routes.profileHealthDataSources,
        routes.profileFoodScanner,
        routes.profileBloodTests,
        routes.profileSubscription,
      ],
    );
    for (const row of navRows) {
      assert.equal(row.status, 'comingSoon');
      assert.equal(row.subtitle, PROFILE_HOME_COMING_SOON_LABEL);
      assert.equal(row.showChevron, true);
      assert.ok(row.route);
    }
  });

  it('keeps remaining future rows as Kommer snart without navigation or chevron', () => {
    const deadRows = listProfileHomeComingSoonDeadRows(view);
    assert.deepEqual(deadRows.map((row) => row.id), []);
    assert.equal(listProfileHomeComingSoonRows(view).length, 4);
  });

  it('makes Aviseringar live, tappable, and without Kommer snart', () => {
    const row = sectionRows.find((item) => item.id === 'notifications');
    assert.equal(row?.status, 'active');
    if (row && row.id === 'notifications' && row.status === 'active') {
      assert.equal(row.title, 'Aviseringar');
      assert.equal(row.showChevron, true);
      assert.equal(row.route, routes.profileNotifications);
      assert.equal('subtitle' in row, false);
    }
  });

  it('makes Hjälp och support live, tappable, and without Kommer snart', () => {
    const row = sectionRows.find((item) => item.id === 'help-and-support');
    assert.equal(row?.status, 'active');
    if (row && row.id === 'help-and-support' && row.status === 'active') {
      assert.equal(row.title, 'Hjälp och support');
      assert.equal(row.showChevron, true);
      assert.equal(row.route, null);
      assert.equal(row.action, 'mailto-help');
      assert.equal('subtitle' in row, false);
    }
  });

  it('makes Ge feedback live, tappable, and without Kommer snart', () => {
    const row = sectionRows.find((item) => item.id === 'feedback');
    assert.equal(row?.status, 'active');
    if (row && row.id === 'feedback' && row.status === 'active') {
      assert.equal(row.title, 'Ge feedback');
      assert.equal(row.showChevron, true);
      assert.equal(row.route, null);
      assert.equal(row.action, 'mailto-feedback');
      assert.equal('subtitle' in row, false);
    }
  });

  it('exposes live and informational coming-soon routes, not dead teasers', () => {
    const navigable = listProfileHomeNavigableRoutes(view);
    assert.deepEqual(navigable, [
      routes.profileAccount,
      routes.profileHealthProfile,
      routes.healthMeasurementHistory,
      routes.profileHealthDataSources,
      routes.profileFoodScanner,
      routes.profileBloodTests,
      routes.profileLanguage,
      routes.profileSubscription,
      routes.profileNotifications,
      routes.profilePrivacy,
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

  it('keeps SV/NB titles for future health rows', () => {
    setActiveLocale('nb');
    const nbView = buildProfileHomeView();
    const health = nbView.sections.find((section) => section.id === 'health')?.rows ?? [];
    assert.deepEqual(
      health.map((row) => row.title),
      ['Helseprofil', 'Målinger', 'Helsedatakilder', 'Food Scanner', 'Blodprøver'],
    );
    assert.equal(t('home.greeting.default', undefined, 'sv'), 'Din hälsa idag');
    assert.equal(t('home.greeting.default', undefined, 'nb'), 'Din helse i dag');
    assert.equal(
      t('profile.bloodTests.safety.body', undefined, 'sv'),
      'NORDYAN ger pedagogisk tolkning i sammanhang med dina uppgifter. Det ersätter inte läkare, diagnos eller behandling.',
    );
    assert.equal(
      t('profile.bloodTests.safety.body', undefined, 'nb'),
      'NORDYAN gir pedagogisk tolkning i sammenheng med opplysningene dine. Det erstatter ikke lege, diagnose eller behandling.',
    );
  });
});
