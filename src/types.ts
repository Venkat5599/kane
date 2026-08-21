export type Verdict = 'PASS' | 'FAIL' | 'ERROR';

export interface KaneStep {
  index: number;
  text: string;
  ok: boolean;
  message?: string;
}

export interface KaneResult {
  verdict: Verdict;
  flow: string;
  target?: string;
  steps: KaneStep[];
  failedStep?: KaneStep;
  /** Kane share_url — the hosted evidence/trace for this run. */
  videoPath?: string;
  credits?: number;
  durationMs: number;
  /** Full raw stdout. Always kept — this is what lands in evidence/. */
  raw: string;
  stderr?: string;
}

export type Trigger = 'save' | 'manual' | 'hook' | 'boot';

export interface Iteration {
  n: number;
  trigger: Trigger;
  triggerFile?: string;
  result: KaneResult;
  /** Set when an agent edited files in response to this failure. */
  patchSummary?: string;
  agent?: string;
  stalled?: boolean;
  at: string;
}
