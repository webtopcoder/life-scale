import { api } from "@/integrations/api/client";

export interface ReportComparison {
  sessionId: string;
  reportId?: string;
  matches: boolean;
  assessment?: {
    final_score: number | null;
    scores: Record<string, number> | null;
    percentiles: Record<string, number> | null;
  };
  userReport?: {
    final_score: number | null;
    scores: Record<string, number> | null;
    percentiles: Record<string, number> | null;
  };
  diffs?: {
    final_score?: { assessment: number | null; report: number | null };
    scores?: Record<string, { assessment: number | null; report: number | null }>;
    percentiles?: Record<string, { assessment: number | null; report: number | null }>;
  };
}

export async function compareAssessmentAndReport(sessionId: string, reportId?: string): Promise<ReportComparison> {
  const base: ReportComparison = { sessionId, reportId, matches: false };

  try {
    const sessionData = await api.get<{ finalScore?: number; final_score?: number; scores?: Record<string, number>; percentiles?: Record<string, number> }>(`/funnel/sessions/${sessionId}`);
    
    if (!sessionData) {
      return base;
    }

    const session = {
      final_score: sessionData.finalScore ?? sessionData.final_score ?? null,
      scores: sessionData.scores ?? null,
      percentiles: sessionData.percentiles ?? null,
    };

    let reportRow: any | null = null;
    if (reportId) {
      reportRow = await api.get<any>(`/dashboard/reports/${reportId}`);
    } else {
      const reports = await api.get<Array<any>>('/dashboard/reports');
      reportRow = reports?.find((r: any) => r.sessionId === sessionId || r.session_id === sessionId) ?? null;
    }

    const assessment = {
      final_score: session.final_score as number | null,
      scores: (session.scores as Record<string, number> | null) ?? null,
      percentiles: (session.percentiles as Record<string, number> | null) ?? null,
    };

    if (!reportRow) {
      return { ...base, assessment };
    }

    const userReport = {
      final_score: (reportRow.finalScore ?? reportRow.final_score) as number | null,
      scores: (reportRow.scores as Record<string, number> | null) ?? null,
      percentiles: (reportRow.percentiles as Record<string, number> | null) ?? null,
    };

    const diffs: ReportComparison["diffs"] = {};

    if (assessment.final_score !== userReport.final_score) {
      diffs.final_score = { assessment: assessment.final_score, report: userReport.final_score };
    }

    const scoreDiffs: Record<string, { assessment: number | null; report: number | null }> = {};
    const percentileDiffs: Record<string, { assessment: number | null; report: number | null }> = {};

    const scoreKeys = new Set([
      ...Object.keys(assessment.scores || {}),
      ...Object.keys(userReport.scores || {}),
    ]);
    for (const key of scoreKeys) {
      const a = assessment.scores?.[key] ?? null;
      const r = userReport.scores?.[key] ?? null;
      if (a !== r) {
        scoreDiffs[key] = { assessment: a, report: r };
      }
    }

    const pctKeys = new Set([
      ...Object.keys(assessment.percentiles || {}),
      ...Object.keys(userReport.percentiles || {}),
    ]);
    for (const key of pctKeys) {
      const a = assessment.percentiles?.[key] ?? null;
      const r = userReport.percentiles?.[key] ?? null;
      if (a !== r) {
        percentileDiffs[key] = { assessment: a, report: r };
      }
    }

    if (Object.keys(scoreDiffs).length > 0) {
      diffs.scores = scoreDiffs;
    }
    if (Object.keys(percentileDiffs).length > 0) {
      diffs.percentiles = percentileDiffs;
    }

    const matches = !diffs.final_score && !diffs.scores && !diffs.percentiles;

    return {
      ...base,
      matches,
      assessment,
      userReport,
      diffs: matches ? undefined : diffs,
    };
  } catch (error) {
    console.error('compareAssessmentAndReport error:', error);
    return base;
  }
}

