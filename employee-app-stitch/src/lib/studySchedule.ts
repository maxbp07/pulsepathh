/** Protocolo estudio D0 / D7 / D14 (fecha local, no UTC). */

export type StudyTimepoint = 'D0' | 'D7' | 'D14';

const STUDY_DAY0_KEY = 'pulsepath.studyDay0';

export function getStudyDay0(): string | null {
  try {
    return localStorage.getItem(STUDY_DAY0_KEY);
  } catch {
    return null;
  }
}

export function setStudyDay0(isoDate: string): void {
  try {
    localStorage.setItem(STUDY_DAY0_KEY, isoDate);
  } catch {
    /* noop */
  }
}

export function localDateISO(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function studyDay(studyDay0: string | null, asOf = localDateISO()): number | null {
  if (!studyDay0) return null;
  const start = new Date(`${studyDay0}T00:00:00`);
  const end = new Date(`${asOf}T00:00:00`);
  return Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
}

export function timepointForDay(day: number | null): StudyTimepoint | null {
  if (day === null) return 'D0';
  if (day >= 14) return 'D14';
  if (day >= 7) return 'D7';
  if (day >= 0) return 'D0';
  return null;
}

export function dueTimepoints(
  studyDay0: string | null,
  completed: Set<string>,
): StudyTimepoint[] {
  const day = studyDay(studyDay0);
  const due: StudyTimepoint[] = [];
  if (day === null || day >= 0) {
    if (!completed.has('D0')) due.push('D0');
  }
  if (day !== null && day >= 7 && !completed.has('D7')) due.push('D7');
  if (day !== null && day >= 14 && !completed.has('D14')) due.push('D14');
  return due;
}

export function instrumentKey(instrument: string, timepoint: StudyTimepoint): string {
  return `${instrument}:${timepoint}`;
}

/** True if the participant's study day allows submitting this timepoint. */
export function isTimepointEligible(timepoint: StudyTimepoint, asOf = localDateISO()): boolean {
  const day = studyDay(getStudyDay0(), asOf);
  if (day === null) return timepoint === 'D0';
  if (timepoint === 'D0') return day >= 0;
  if (timepoint === 'D7') return day >= 7;
  if (timepoint === 'D14') return day >= 14;
  return false;
}

export function isTimepointComplete(completed: Set<string>, timepoint: StudyTimepoint): boolean {
  const instruments = ['DASS21_FULL', 'GAD7', 'CBI'];
  return instruments.every((inst) => completed.has(instrumentKey(inst, timepoint)));
}
