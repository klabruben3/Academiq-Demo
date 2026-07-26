export type AssessmentType =
  | 'weekly-test'
  | 'class-test'
  | 'semester-test'
  | 'exam'
  | 'assignment'
  | 'online-test'
  | 'attendance'
  | 'aleks'
  | 'class-work';

export type Priority = 'critical' | 'high' | 'medium' | 'low';

export interface AssessmentComponent {
  id: string;
  name: string;
  type: AssessmentType;
  weight: number; // percentage weight in participation mark
  maxScore: number;
  score?: number; // entered by user
  date?: string; // ISO date string
  dateEnd?: string; // for date ranges
  location?: string;
  duration?: string;
  studyUnits?: string;
  dropLowest?: number;
  required?: boolean;
  minimumExamAdmission?: number;
  category?: string;
  completed?: boolean;
}

export interface ParticipationFormula {
  components: {
    componentId: string;
    weight: number;
    dropLowest?: number;
    useAll?: boolean;
  }[];
  minimumToPass: number; // minimum participation % needed for exam
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
  assessments: AssessmentComponent[];
  participationFormula: ParticipationFormula;
  hasExam: boolean;
  examDate?: string;
  examDateEnd?: string;
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

export type ViewType = 'dashboard' | 'timeline' | 'calendar' | 'analytics' | string;
export type CalendarView = 'month' | 'week' | 'agenda';
