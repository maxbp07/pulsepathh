export interface AdherenceParticipant {
  slot_label: string | null;
  code_hash_prefix: string;
  activated: boolean;
  study_day: number | null;
  last_seen_at: string | null;
  daily_days_completed: number;
  daily_dates: string[];
  questionnaires_done: { D0: boolean; D7: boolean; D14: boolean };
  eligible_d7: boolean;
  eligible_d14: boolean;
}

export interface AdherenceResponse {
  as_of: string;
  participants: AdherenceParticipant[];
}

export interface AdherenceSummary {
  as_of: string;
  target_n: number | null;
  codes_provisioned: number;
  activated: number;
  adherence_daily_d7_pct: number | null;
  adherence_daily_d14_pct: number | null;
  questionnaire_d0_pct: number | null;
  questionnaire_d7_pct: number | null;
  questionnaire_d14_pct: number | null;
}
