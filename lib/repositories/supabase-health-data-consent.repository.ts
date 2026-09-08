import type { Result } from '@/lib/core';
import {
  HEALTH_DATA_CONSENT_POLICY_VERSION,
  HEALTH_DATA_CONSENT_TYPE,
  consentUserIdDiagnosticSuffix,
  isCurrentHealthDataConsentGrant,
  logAuthenticatedConsentDiagnostic,
  type HealthDataConsentGrant,
} from '@/lib/domain/health-data-consent';
import { missingSupabaseConfigError } from '@/lib/repositories/profile-mappers';
import type { HealthDataConsentRepository } from '@/lib/repositories/health-data-consent.repository';
import { getSupabaseClient } from '@/lib/supabase/client';

function alreadyExists(error: { code?: string; message?: string } | null): boolean {
  const code = error?.code?.toLowerCase() ?? '';
  const message = error?.message?.toLowerCase() ?? '';
  return code === '23505' || message.includes('duplicate') || message.includes('unique');
}

export class SupabaseHealthDataConsentRepository implements HealthDataConsentRepository {
  async hasActiveCurrentConsent(userId: string): Promise<Result<boolean>> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { ok: false, error: missingSupabaseConfigError() };
    }

    const { data, error } = await supabase
      .from('health_data_consents')
      .select('id')
      .eq('user_id', userId)
      .eq('consent_type', HEALTH_DATA_CONSENT_TYPE)
      .eq('policy_version', HEALTH_DATA_CONSENT_POLICY_VERSION)
      .is('withdrawn_at', null)
      .maybeSingle();

    if (error) {
      logAuthenticatedConsentDiagnostic('select', {
        userIdPresent: true,
        userIdSuffix: consentUserIdDiagnosticSuffix(userId),
        consentType: HEALTH_DATA_CONSENT_TYPE,
        policyVersion: HEALTH_DATA_CONSENT_POLICY_VERSION,
        supabaseCode: error.code ?? null,
        supabaseMessage: error.message,
        rowReturned: false,
      });
      return {
        ok: false,
        error: { code: 'INTEGRATION', message: error.message, cause: error },
      };
    }

    logAuthenticatedConsentDiagnostic('select', {
      userIdPresent: true,
      userIdSuffix: consentUserIdDiagnosticSuffix(userId),
      consentType: HEALTH_DATA_CONSENT_TYPE,
      policyVersion: HEALTH_DATA_CONSENT_POLICY_VERSION,
      rowReturned: data !== null,
    });

    return { ok: true, value: data !== null };
  }

  async insertGrant(
    userId: string,
    grant: HealthDataConsentGrant,
  ): Promise<Result<{ inserted: boolean }>> {
    if (!isCurrentHealthDataConsentGrant(grant)) {
      return { ok: true, value: { inserted: false } };
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return { ok: false, error: missingSupabaseConfigError() };
    }

    const { data, error } = await supabase
      .from('health_data_consents')
      .insert({
        user_id: userId,
        consent_type: grant.consentType,
        policy_version: grant.policyVersion,
        granted_at: grant.grantedAt,
        withdrawn_at: null,
      })
      .select('id')
      .maybeSingle();

    if (error) {
      if (alreadyExists(error)) {
        logAuthenticatedConsentDiagnostic('insert', {
          attemptedInsert: true,
          userIdPresent: true,
          userIdSuffix: consentUserIdDiagnosticSuffix(userId),
          consentType: grant.consentType,
          policyVersion: grant.policyVersion,
          uniqueConflict: true,
          rowReturned: false,
        });
        return { ok: true, value: { inserted: false } };
      }

      logAuthenticatedConsentDiagnostic('insert', {
        attemptedInsert: true,
        userIdPresent: true,
        userIdSuffix: consentUserIdDiagnosticSuffix(userId),
        consentType: grant.consentType,
        policyVersion: grant.policyVersion,
        supabaseCode: error.code ?? null,
        supabaseMessage: error.message,
        rowReturned: false,
      });
      return {
        ok: false,
        error: { code: 'INTEGRATION', message: error.message, cause: error },
      };
    }

    logAuthenticatedConsentDiagnostic('insert', {
      attemptedInsert: true,
      userIdPresent: true,
      userIdSuffix: consentUserIdDiagnosticSuffix(userId),
      consentType: grant.consentType,
      policyVersion: grant.policyVersion,
      rowReturned: data !== null,
    });

    return { ok: true, value: { inserted: true } };
  }
}

export const supabaseHealthDataConsentRepository = new SupabaseHealthDataConsentRepository();
