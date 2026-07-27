export type AssessmentType =
  | "weekly-test"
  | "class-test"
  | "semester-test"
  | "exam"
  | "assignment"
  | "online-test"
  | "attendance"
  | "aleks"
  | "class-work"
  | "practical"
  | "practical-exam"
  | "mcq";

export type Priority = "critical" | "high" | "medium" | "low";

export interface AssessmentSlot {
  date: string;
  time?: string;
  label?: string;
}

export interface AssessmentComponent {
  id: string;
  name: string;
  type: AssessmentType;
  weight: number; // percentage weight in participation / module mark
  maxScore: number;
  score?: number;
  date?: string; // primary / deadline date (ISO)
  dateEnd?: string; // for date ranges (e.g. assessment week)
  dateAvailable?: string; // when assessment opens (ISO)
  time?: string; // deadline or session time (HH:mm)
  slots?: AssessmentSlot[]; // sign-up options (e.g. ALDE122 A4)
  location?: string;
  duration?: string;
  studyUnits?: string;
  dropLowest?: number;
  required?: boolean;
  minimumExamAdmission?: number;
  category?: string;
  completed?: boolean;
  countsTowardCompletion?: boolean; // default true; for pass-completion rules
}

export interface FormulaComponent {
  componentId: string;
  weight: number;
  dropLowest?: number;
  minimumCompleted?: number; // min scored assessments to qualify for this component
  totalInCategory?: number; // total assessments in category (for display)
  useAll?: boolean;
}

export interface ParticipationFormula {
  components: FormulaComponent[];
  minimumToPass: number; // min participation % for exam admission (or final mark threshold)
}

export interface PassRequirements {
  participationMin?: number; // exam admission threshold
  examMin?: number; // minimum exam mark to pass module
  finalMin?: number; // minimum final module mark to pass
  minimumCompletionPercent?: number; // e.g. ALDE122: complete 80% of assessments
}

export interface ExamOpportunity {
  label: string;
  start: string;
  end: string;
}

export interface ExamPaper {
  name: string;
  maxScore: number;
  duration: string;
  studyUnits: string;
}

export interface ExamInfo {
  papers: ExamPaper[];
  finalMarkIsAverage?: boolean;
  secondOpportunityOverridesFirst?: boolean;
}

export interface ModuleGroup {
  id: string;
  label: string;
  language: string;
  lecturer: string;
  email: string;
  office: string;
  venue?: string;
  periods?: string;
}

export interface RecessPeriod {
  start: string;
  end: string;
  label?: string;
}

export interface Module {
  id: string;
  code: string;
  name: string;
  color: string;
  lecturer?: string;
  email?: string;
  office?: string;
  consultationHours?: string;
  groups?: ModuleGroup[];
  assessments: AssessmentComponent[];
  participationFormula: ParticipationFormula;
  passRequirements?: PassRequirements;
  hasExam: boolean;
  examDate?: string;
  examDateEnd?: string;
  examOpportunities?: ExamOpportunity[];
  examInfo?: ExamInfo;
  recessPeriods?: RecessPeriod[];
  semesterStart: string;
  semesterEnd: string;
}

export interface TimelineEvent {
  id: string;
  moduleId: string;
  moduleCode: string;
  moduleColor: string;
  assessmentId: string;
  name: string;
  type: AssessmentType;
  weight: number;
  date: string;
  dateEnd?: string;
  dateAvailable?: string;
  time?: string;
  location?: string;
  duration?: string;
  studyUnits?: string;
  completed: boolean;
  priority: Priority;
}

export interface PriorityItem {
  event: TimelineEvent;
  score: number;
  daysUntil: number;
  reason: string;
}

export interface WorkloadDataPoint {
  month: string;
  week: string;
  weekStart: string;
  load: number;
  assessments: string[];
}

export type ViewType =
  | "dashboard"
  | "timeline"
  | "calendar"
  | "analytics"
  | string;
export type CalendarView = "month" | "week" | "agenda";
