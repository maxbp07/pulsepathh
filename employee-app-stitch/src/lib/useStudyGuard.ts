import { useEffect, useState } from 'react';
import { hasAssessment } from './db';
import { isTimepointEligible, type StudyTimepoint } from './studySchedule';
import type { AssessmentEntry } from './types';

export type StudyGuardState = 'loading' | 'ready' | 'done' | 'ineligible';

export function useStudyGuard(
  instrument: AssessmentEntry['instrument'],
  requestedTp: StudyTimepoint,
): { state: StudyGuardState; timepoint: StudyTimepoint | null } {
  const [state, setState] = useState<StudyGuardState>('loading');
  const [timepoint, setTimepoint] = useState<StudyTimepoint | null>(null);

  useEffect(() => {
    void (async () => {
      if (await hasAssessment(instrument, requestedTp)) {
        setState('done');
        return;
      }
      if (!isTimepointEligible(requestedTp)) {
        setState('ineligible');
        return;
      }
      setTimepoint(requestedTp);
      setState('ready');
    })();
  }, [instrument, requestedTp]);

  return { state, timepoint };
}
