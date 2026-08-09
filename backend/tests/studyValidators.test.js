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

  it('parseDateLocal rejects impossible calendar dates', () => {
    const r = parseDateLocal('2026-02-30');
    assert.equal(r.ok, false);
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

  it('validateDailyPayload accepts full payload and preserves date_local as civil date', () => {
    // Timestamp UTC nocturno no debe alterar date_local enviado por el cliente.
    const r = validateDailyPayload({
      client_record_id: 'rec-night',
      date_local: '2026-08-08',
      tz: 'Europe/Madrid',
      timestamp: '2026-08-08T22:30:00.000Z',
      kss: 4,
      context: { sleepHours: 7, quality: 3, coffee: false },
      pvt: { times: [220, 240, 260], falseStarts: 0 },
      derived: { fri: 1.2, vitality: 70 },
    });
    assert.equal(r.ok, true);
    assert.equal(r.value.dateLocal, '2026-08-08');
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
