import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, CartesianGrid,
} from 'recharts';
import type { Module } from '../types';
import { buildTimeline, getMonthlyWorkload, calculateParticipationMark, getDaysUntil } from '../utils/calculations';
import { StatCard, ProgressBar } from './ui';

interface Props {
  modules: Module[];
  scores: Record<string, number>;
}

export default function Analytics({ modules, scores }: Props) {
  const timeline = useMemo(() => buildTimeline(modules, scores), [modules, scores]);
  const monthlyWorkload = useMemo(() => getMonthlyWorkload(), []);

  const completed = timeline.filter(e => e.completed).length;
  const total = timeline.length;
  const remaining = total - completed;

  const participationMarks = modules.map(mod => ({
    code: mod.code,
    mark: calculateParticipationMark(mod, scores),
    color: mod.color,
    min: mod.participationFormula.minimumToPass,
  }));

  // Most demanding month
  const mostDemanding = [...monthlyWorkload].sort((a, b) => b.load - a.load)[0];

  // Count by type
  const byType = timeline.reduce<Record<string, number>>((acc, ev) => {
    acc[ev.type] = (acc[ev.type] ?? 0) + 1;
    return acc;
  }, {});

  // Upcoming in each module
  const moduleStats = modules.map(mod => {
    const modEvents = timeline.filter(e => e.moduleId === mod.id);
    const upcoming = modEvents.filter(e => !e.completed && getDaysUntil(e.date) >= 0).length;
    const pm = calculateParticipationMark(mod, scores);
    return { ...mod, upcoming, pm };
  });

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-white">Analytics & Insights</h2>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Completed" value={completed} color="#10b981" />
        <StatCard label="Remaining" value={remaining} color="#f59e0b" />
        <StatCard label="Total Assessments" value={total} />
        <StatCard label="Completion" value={`${Math.round((completed / total) * 100)}%`} color="#6366f1" />
      </div>

      {/* Participation marks */}
      <div className="rounded-2xl border border-white/8 bg-white/3 p-4">
        <h3 className="text-xs font-mono font-semibold uppercase tracking-widest text-white/40 mb-4">
          Current Participation Marks
        </h3>
        <div className="space-y-4">
          {participationMarks.map(pm => (
            <div key={pm.code}>
              <div className="flex justify-between items-baseline mb-1.5">
                <span className="text-sm font-mono font-semibold" style={{ color: pm.color }}>{pm.code}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-white/30">min {pm.min}%</span>
                  <span className="text-lg font-mono font-bold text-white">
                    {pm.mark.toFixed(1)}<span className="text-white/30 text-sm">%</span>
                  </span>
                </div>
              </div>
              <ProgressBar
                value={pm.mark}
                color={pm.mark >= 75 ? '#10b981' : pm.mark >= pm.min ? pm.color : '#ef4444'}
              />
              <div className="flex justify-between text-xs font-mono text-white/20 mt-0.5">
                <span>0%</span>
                <span className="text-yellow-500/60">{pm.min}% min</span>
                <span>100%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly workload bar chart */}
      <div className="rounded-2xl border border-white/8 bg-white/3 p-4">
        <h3 className="text-xs font-mono font-semibold uppercase tracking-widest text-white/40 mb-4">
          Monthly Workload Intensity
        </h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={monthlyWorkload} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <XAxis dataKey="month" tick={{ fill: '#ffffff40', fontSize: 11, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#ffffff40', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: '#0f1629', border: '1px solid #ffffff15', borderRadius: 8, fontSize: 11 }}
              labelStyle={{ color: '#ffffff80' }}
              itemStyle={{ color: '#6366f1' }}
            />
            <Bar dataKey="load" name="Workload" radius={[4, 4, 0, 0]}>
              {monthlyWorkload.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.load > 60 ? '#ef4444' : entry.load > 40 ? '#f59e0b' : '#6366f1'}
                  fillOpacity={0.7}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        {mostDemanding && (
          <p className="text-xs font-mono text-white/30 mt-2 text-center">
            Most demanding month: <span className="text-amber-400">{mostDemanding.month}</span>
          </p>
        )}
      </div>

      {/* Module comparison */}
      <div className="rounded-2xl border border-white/8 bg-white/3 p-4">
        <h3 className="text-xs font-mono font-semibold uppercase tracking-widest text-white/40 mb-4">
          Module Overview
        </h3>
        <div className="space-y-3">
          {moduleStats.map(mod => (
            <div key={mod.id} className="flex items-center gap-4">
              <span className="text-xs font-mono font-bold w-20 shrink-0" style={{ color: mod.color }}>{mod.code}</span>
              <div className="flex-1">
                <ProgressBar value={mod.pm} color={mod.color} />
              </div>
              <span className="text-xs font-mono text-white/50 w-12 text-right">{mod.pm.toFixed(0)}% PM</span>
              <span className="text-xs font-mono text-white/30 w-16 text-right">{mod.upcoming} left</span>
            </div>
          ))}
        </div>
      </div>

      {/* Assessment type breakdown */}
      <div className="rounded-2xl border border-white/8 bg-white/3 p-4">
        <h3 className="text-xs font-mono font-semibold uppercase tracking-widest text-white/40 mb-4">
          Assessments by Type
        </h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(byType).map(([type, count]) => (
            <div key={type} className="flex items-center gap-2 rounded-lg border border-white/8 px-3 py-2">
              <span className="text-lg font-mono font-bold text-white">{count}</span>
              <span className="text-xs text-white/40 capitalize">{type.replace(/-/g, ' ')}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Insights */}
      <div className="rounded-2xl border border-white/8 bg-white/3 p-4">
        <h3 className="text-xs font-mono font-semibold uppercase tracking-widest text-white/40 mb-3">Insights</h3>
        <div className="space-y-2">
          {participationMarks.map(pm => {
            if (pm.mark >= pm.min) {
              return (
                <div key={pm.code} className="flex items-start gap-2 text-sm">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  <span className="text-white/60">
                    <span style={{ color: '#fff' }}>{pm.code}</span> meets exam admission ({pm.mark.toFixed(1)}% ≥ {pm.min}%)
                  </span>
                </div>
              );
            } else {
              const needed = pm.min - pm.mark;
              return (
                <div key={pm.code} className="flex items-start gap-2 text-sm">
                  <span className="text-amber-400 mt-0.5">!</span>
                  <span className="text-white/60">
                    <span style={{ color: '#fff' }}>{pm.code}</span> needs {needed.toFixed(1)}% more for exam admission
                  </span>
                </div>
              );
            }
          })}
          {mostDemanding && (
            <div className="flex items-start gap-2 text-sm">
              <span className="text-indigo-400 mt-0.5">→</span>
              <span className="text-white/60">
                Busiest month: <span className="text-white">{mostDemanding.month}</span> — plan ahead
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
