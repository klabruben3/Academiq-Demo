import {
  differenceInDays,
  parseISO,
  isAfter,
  isBefore,
  format,
  startOfWeek,
  addWeeks,
} from "date-fns";
import type {
  Module,
  AssessmentComponent,
  TimelineEvent,
  Priority,
  PriorityItem,
  WorkloadDataPoint,
  FormulaComponent,
} from "../types";
import { MODULES } from "../data/modules";

export function getDaysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = parseISO(dateStr);
  return differenceInDays(target, today);
}

export function getAssessmentPriority(
  daysUntil: number,
  weight: number,
): Priority {
  if (daysUntil < 0) return "low";
  if (daysUntil <= 3 || (daysUntil <= 7 && weight >= 30)) return "critical";
  if (daysUntil <= 7 || (daysUntil <= 14 && weight >= 30)) return "high";
  if (daysUntil <= 21) return "medium";
  return "low";
}

export function buildTimeline(
  modules: Module[],
  scores: Record<string, number>,
): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  for (const mod of modules) {
    for (const assessment of mod.assessments) {
      if (!assessment.date) continue;

      const daysUntil = getDaysUntil(assessment.date);
      const priority = getAssessmentPriority(daysUntil, assessment.weight);
      const completed =
        assessment.id in scores || (assessment.completed ?? false);

      events.push({
        id: `${mod.id}-${assessment.id}`,
        moduleId: mod.id,
        moduleCode: mod.code,
        moduleColor: mod.color,
        assessmentId: assessment.id,
        name: assessment.name,
        type: assessment.type,
        weight: assessment.weight,
        date: assessment.date,
        dateEnd: assessment.dateEnd,
        location: assessment.location,
        duration: assessment.duration,
        studyUnits: assessment.studyUnits,
        completed,
        priority,
      });
    }
  }

  return events.sort((a, b) => a.date.localeCompare(b.date));
}

export function getPriorityItems(events: TimelineEvent[]): PriorityItem[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return events
    .filter((e) => !e.completed)
    .map((e) => {
      const daysUntil = getDaysUntil(e.date);
      let score = 0;

      // Weight factor
      score += e.weight * 2;

      // Urgency factor (exponential decay)
      if (daysUntil >= 0) {
        score += Math.max(0, 100 - daysUntil * 3);
      }

      // Type bonus
      if (e.type === "exam") score += 50;
      if (e.type === "semester-test") score += 30;
      if (e.type === "class-test") score += 15;

      let reason = "";
      if (daysUntil < 0) reason = "Overdue";
      else if (daysUntil === 0) reason = "Due today";
      else if (daysUntil === 1) reason = "Due tomorrow";
      else if (daysUntil <= 3) reason = `${daysUntil} days remaining`;
      else if (daysUntil <= 7) reason = `${daysUntil} days — this week`;
      else if (daysUntil <= 14) reason = `${daysUntil} days — next week`;
      else reason = `${daysUntil} days remaining`;

      return { event: e, score, daysUntil, reason };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

function getCategorySlug(modId: string, componentId: string): string {
  return componentId.replace(`${modId}-`, "");
}

function getAssessmentsForComponent(
  mod: Module,
  comp: FormulaComponent,
): AssessmentComponent[] {
  const slug = getCategorySlug(mod.id, comp.componentId);
  const byCategory = mod.assessments.filter((a) => a.category === slug);
  if (byCategory.length > 0) return byCategory;

  const direct = mod.assessments.find((a) => a.id === comp.componentId);
  return direct ? [direct] : [];
}

function getPercentageMarks(
  assessments: AssessmentComponent[],
  scores: Record<string, number>,
): number[] {
  return assessments
    .filter((a) => a.id in scores)
    .map((a) => (scores[a.id] / a.maxScore) * 100);
}

function computeComponentAverage(
  comp: FormulaComponent,
  assessments: AssessmentComponent[],
  scores: Record<string, number>,
): number | null {
  let marks = getPercentageMarks(assessments, scores);

  if (marks.length === 0) return null;

  if (comp.minimumCompleted && marks.length < comp.minimumCompleted) {
    return null;
  }

  if (comp.dropLowest && marks.length > comp.dropLowest) {
    marks = [...marks].sort((a, b) => a - b).slice(comp.dropLowest);
  }

  return marks.reduce((sum, mark) => sum + mark, 0) / marks.length;
}

export function calculateParticipationMark(
  mod: Module,
  scores: Record<string, number>,
): number {
  let total = 0;

  for (const comp of mod.participationFormula.components) {
    const assessments = getAssessmentsForComponent(mod, comp);
    const average = computeComponentAverage(comp, assessments, scores);

    if (average !== null) {
      total += average * (comp.weight / 100);
    }
  }

  return Math.round(total * 10) / 10;
}

export function getWorloadData(): WorkloadDataPoint[] {
  const allEvents = buildTimeline(MODULES, {});
  const semesterStart = parseISO("2026-07-13");
  const semesterEnd = parseISO("2026-12-05");

  const weeks: WorkloadDataPoint[] = [];
  let cursor = startOfWeek(semesterStart, { weekStartsOn: 1 });

  while (isBefore(cursor, semesterEnd)) {
    const weekEnd = addWeeks(cursor, 1);
    const weekStr = format(cursor, "yyyy-MM-dd");
    const month = format(cursor, "MMM");

    const inWeek = allEvents.filter((e) => {
      const d = parseISO(e.date);
      return !isBefore(d, cursor) && isBefore(d, weekEnd);
    });

    let load = inWeek.length * 10;

    // Add weight-based bonus
    for (const ev of inWeek) {
      if (ev.type === "exam") load += 40;
      else if (ev.type === "semester-test") load += 30;
      else if (ev.type === "class-test") load += 20;
      else if (ev.type === "weekly-test") load += 5;
      load += ev.weight * 0.5;
    }

    weeks.push({
      month,
      week: format(cursor, "MMM d"),
      weekStart: weekStr,
      load: Math.min(load, 100),
      assessments: inWeek.map((e) => `${e.moduleCode}: ${e.name}`),
    });

    cursor = weekEnd;
  }

  return weeks;
}

export function getMonthlyWorkload(): { month: string; load: number }[] {
  const weekly = getWorloadData();
  const monthly: Record<string, number[]> = {};

  for (const w of weekly) {
    if (!monthly[w.month]) monthly[w.month] = [];
    monthly[w.month].push(w.load);
  }

  return Object.entries(monthly).map(([month, loads]) => ({
    month,
    load: Math.round(loads.reduce((s, l) => s + l, 0) / loads.length),
  }));
}

export function countdownLabel(dateStr: string): string {
  const days = getDaysUntil(dateStr);
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days < 14) return `${days} days`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ${days % 7}d`;
}

export function getSemesterWeek(): number {
  const start = parseISO("2026-07-13");
  const today = new Date();
  const days = differenceInDays(today, start);
  return Math.max(1, Math.ceil(days / 7));
}

export function getSemesterProgress(): number {
  const start = parseISO("2026-07-13");
  const end = parseISO("2026-12-05");
  const today = new Date();
  const total = differenceInDays(end, start);
  const elapsed = differenceInDays(today, start);
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}

export function getUpcomingEvents(
  events: TimelineEvent[],
  days: number,
): TimelineEvent[] {
  return events.filter((e) => {
    const d = getDaysUntil(e.date);
    return d >= 0 && d <= days && !e.completed;
  });
}
