import type { AssessmentType } from '../types';

export const TYPE_COLORS: Record<AssessmentType, string> = {
  'weekly-test': '#3b82f6',
  'class-test': '#eab308',
  'semester-test': '#f97316',
  'exam': '#ef4444',
  'assignment': '#8b5cf6',
  'online-test': '#06b6d4',
  'attendance': '#6b7280',
  'aleks': '#10b981',
  'class-work': '#ec4899',
};

export const TYPE_LABELS: Record<AssessmentType, string> = {
  'weekly-test': 'Weekly Test',
  'class-test': 'Class Test',
  'semester-test': 'Semester Test',
  'exam': 'Exam',
  'assignment': 'Assignment',
  'online-test': 'Online Test',
  'attendance': 'Attendance',
  'aleks': 'ALEKS',
  'class-work': 'Class Work',
};

export const PRIORITY_COLORS = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#6b7280',
};

interface BadgeProps {
  color: string;
  label: string;
  small?: boolean;
}

export function TypeBadge({ color, label, small }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded font-mono font-medium uppercase tracking-wider ${small ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'}`}
      style={{ backgroundColor: `${color}22`, color, border: `1px solid ${color}44` }}
    >
      {label}
    </span>
  );
}

interface ProgressBarProps {
  value: number;
  color?: string;
  className?: string;
}

export function ProgressBar({ value, color = '#6366f1', className = '' }: ProgressBarProps) {
  return (
    <div className={`h-1.5 rounded-full bg-white/10 overflow-hidden ${className}`}>
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.min(100, value)}%`, backgroundColor: color }}
      />
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}

export function StatCard({ label, value, sub, color }: StatCardProps) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/4 p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-white/40 mb-1">{label}</p>
      <p className="text-2xl font-mono font-semibold" style={{ color: color ?? '#fff' }}>
        {value}
      </p>
      {sub && <p className="text-xs text-white/40 mt-0.5">{sub}</p>}
    </div>
  );
}
