const DATE_LOCAL_RE = /^\d{4}-\d{2}-\d{2}$/;
const VALID_INSTRUMENTS = new Set(['DASS21_STRESS', 'DASS21_FULL', 'GAD7', 'CBI']);
const VALID_TIMEPOINTS = new Set(['D0', 'D7', 'D14']);
const INSTRUMENT_ITEM_COUNTS = {
  DASS21_STRESS: 7,
  DASS21_FULL: 21,
  GAD7: 7,
  CBI: 19,
};

const DAILY_ALLOWED = new Set([
  'client_record_id', 'date_local', 'tz', 'timestamp', 'kss', 'context', 'pvt', 'derived', 'app_version',
]);

const QUESTIONNAIRE_ALLOWED = new Set([
  'client_record_id', 'instrument', 'timepoint', 'timestamp', 'items', 'app_version',
]);

function isFiniteNumber(n) {
  return typeof n === 'number' && Number.isFinite(n);
}

function isInteger(n) {
  return typeof n === 'number' && Number.isInteger(n);
}

export function parseDateLocal(value) {
  if (typeof value !== 'string' || !DATE_LOCAL_RE.test(value)) {
    return { ok: false, error: 'date_local must be YYYY-MM-DD.' };
  }
  const [y, m, d] = value.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) {
    return { ok: false, error: 'date_local is not a valid calendar date.' };
  }
  return { ok: true, value };
}

export function daysBetween(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const ms = end.getTime() - start.getTime();
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}

export function validateDailyPayload(body) {
  const extra = Object.keys(body).filter((k) => !DAILY_ALLOWED.has(k));
  if (extra.length) return { ok: false, error: 'Request contains disallowed fields.', fields: extra };

  const { client_record_id, date_local, tz, timestamp, kss, context, pvt } = body;
  if (!client_record_id || typeof client_record_id !== 'string') {
    return { ok: false, error: 'client_record_id is required.' };
  }
  const dateParsed = parseDateLocal(date_local);
  if (!dateParsed.ok) return dateParsed;
  if (!tz || typeof tz !== 'string') return { ok: false, error: 'tz is required.' };
  const takenAt = new Date(timestamp);
  if (!timestamp || Number.isNaN(takenAt.getTime())) return { ok: false, error: 'Invalid timestamp.' };
  if (!isInteger(kss) || kss < 1 || kss > 9) return { ok: false, error: 'kss must be an integer 1-9.' };

  if (!context || typeof context !== 'object') return { ok: false, error: 'context is required.' };
  if (!isFiniteNumber(context.sleepHours) || context.sleepHours < 0 || context.sleepHours > 12) {
    return { ok: false, error: 'context.sleepHours must be 0-12.' };
  }
  if (!isInteger(context.quality) || context.quality < 1 || context.quality > 5) {
    return { ok: false, error: 'context.quality must be 1-5.' };
  }
  if (typeof context.coffee !== 'boolean') return { ok: false, error: 'context.coffee must be boolean.' };

  if (!pvt || typeof pvt !== 'object') return { ok: false, error: 'pvt is required.' };
  if (!Array.isArray(pvt.times) || pvt.times.length < 1 || pvt.times.length > 600) {
    return { ok: false, error: 'pvt.times must be an array of length 1-600.' };
  }
  for (const rt of pvt.times) {
    if (!isFiniteNumber(rt) || rt < 50 || rt > 15000) {
      return { ok: false, error: 'Each pvt.times entry must be 50-15000 ms.' };
    }
  }
  if (!isInteger(pvt.falseStarts) || pvt.falseStarts < 0) {
    return { ok: false, error: 'pvt.falseStarts must be >= 0.' };
  }

  return {
    ok: true,
    value: {
      clientRecordId: client_record_id,
      dateLocal: dateParsed.value,
      tz,
      takenAt,
      appVersion: body.app_version ?? null,
      payload: {
        schema: 'daily-v1',
        kss,
        context,
        pvt,
        derived: body.derived ?? null,
      },
    },
  };
}

export function validateQuestionnairePayload(body) {
  const extra = Object.keys(body).filter((k) => !QUESTIONNAIRE_ALLOWED.has(k));
  if (extra.length) return { ok: false, error: 'Request contains disallowed fields.', fields: extra };

  const { client_record_id, instrument, timepoint, timestamp, items } = body;
  if (!client_record_id || typeof client_record_id !== 'string') {
    return { ok: false, error: 'client_record_id is required.' };
  }
  if (!VALID_INSTRUMENTS.has(instrument)) {
    return { ok: false, error: 'instrument must be DASS21_STRESS, DASS21_FULL, GAD7, or CBI.' };
  }
  if (!VALID_TIMEPOINTS.has(timepoint)) {
    return { ok: false, error: 'timepoint must be D0, D7, or D14.' };
  }
  const takenAt = new Date(timestamp);
  if (!timestamp || Number.isNaN(takenAt.getTime())) return { ok: false, error: 'Invalid timestamp.' };
  if (!Array.isArray(items)) return { ok: false, error: 'items must be an array.' };

  const expected = INSTRUMENT_ITEM_COUNTS[instrument];
  if (items.length !== expected) {
    return { ok: false, error: `instrument ${instrument} requires exactly ${expected} items.` };
  }

  for (const item of items) {
    if (!item || typeof item.id !== 'string') return { ok: false, error: 'Each item needs an id.' };
  }

  if (instrument === 'CBI') {
    const validCbi = new Set(['ALWAYS', 'OFTEN', 'SOMETIMES', 'SELDOM', 'NEVER']);
    for (const item of items) {
      if (!validCbi.has(item.value)) return { ok: false, error: 'CBI items must use ALWAYS/OFTEN/SOMETIMES/SELDOM/NEVER.' };
    }
  } else {
    for (const item of items) {
      if (!isInteger(item.value) || item.value < 0 || item.value > 3) {
        return { ok: false, error: 'Item values must be integers 0-3.' };
      }
    }
  }

  return {
    ok: true,
    value: {
      clientRecordId: client_record_id,
      instrument,
      timepoint,
      takenAt,
      appVersion: body.app_version ?? null,
      payload: { schema: 'q-v1', items },
    },
  };
}

export function validateTimepointEligibility(timepoint, studyDay0, dateLocal) {
  if (!studyDay0) return { ok: true };
  const studyDay = daysBetween(studyDay0, new Date(dateLocal + 'T00:00:00.000Z'));
  const required = timepoint === 'D0' ? 0 : timepoint === 'D7' ? 7 : 14;
  if (studyDay < required) {
    return { ok: false, error: 'timepoint_not_allowed', study_day: studyDay, required_day: required };
  }
  return { ok: true, studyDay };
}
