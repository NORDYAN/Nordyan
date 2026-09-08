import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { mapProfileRow } from './profile-mappers';
import type { Database } from '@/lib/supabase/database.types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

const baseRow: ProfileRow = {
  id: 'profile-1',
  user_id: 'user-1',
  first_name: null,
  date_of_birth: '1980-01-01',
  gender: 'male',
  height_cm: 180,
  weight_kg: 80,
  waist_cm: 90,
  neck_cm: 38,
  activity_level: 'moderately_active',
  goal: null,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

describe('mapProfileRow gender compatibility', () => {
  it('reads legacy other without crashing or remapping', () => {
    const profile = mapProfileRow({ ...baseRow, gender: 'other' });
    assert.equal(profile.gender, 'other');
  });

  it('reads male and female unchanged', () => {
    assert.equal(mapProfileRow({ ...baseRow, gender: 'male' }).gender, 'male');
    assert.equal(mapProfileRow({ ...baseRow, gender: 'female' }).gender, 'female');
  });

  it('maps unsupported gender strings to null', () => {
    assert.equal(mapProfileRow({ ...baseRow, gender: 'prefer_not_to_say' }).gender, null);
  });
});
