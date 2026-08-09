import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  validateDailyPayload,
  validateQuestionnairePayload,
  parseDateLocal,
} from '../src/lib/validators/studyValidators.js';

describe('studyValidators', () => {
  it('parseDateLocal accepts valid dates', () => {
    const r = parseDateLocal('2026-07-17');
    assert.equal(r.ok, true);
  });

  it('validateDailyPayload rejects missing context', () => {
    const r = validateDailyPayload({
      client_record_id: 'abc',
      date_local: '2026-07-17',
      tz: 'Europe/Madrid',
      timestamp: new Date().toISOString(),
      kss: 5,
      pvt: { times: [200, 250], falseStarts: 0 },
    });
    assert.equal(r.ok, false);
  });

  it('validateQuestionnairePayload requires 21 items for DASS21_FULL', () => {
    const items = Array.from({ length: 21 }, (_, i) => ({ id: `dass_${i + 1}`, value: 1 }));
    const r = validateQuestionnairePayload({
      client_record_id: 'rec-1',
      instrument: 'DASS21_FULL',
      timepoint: 'D0',
      timestamp: new Date().toISOString(),
      items,
    });
    assert.equal(r.ok, true);
  });

  it('validateQuestionnairePayload rejects wrong item count', () => {
    const r = validateQuestionnairePayload({
      client_record_id: 'rec-1',
      instrument: 'GAD7',
      timepoint: 'D0',
      timestamp: new Date().toISOString(),
      items: [{ id: 'g1', value: 1 }],
    });
    assert.equal(r.ok, false);
  });
});
