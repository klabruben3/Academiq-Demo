import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { format, parseISO } from 'date-fns';
import { Check, MapPin, Clock, BookOpen, Filter } from 'lucide-react';
import type { Module, AssessmentType } from '../types';
import { buildTimeline, getDaysUntil, countdownLabel } from '../utils/calculations';
import { TypeBadge, TYPE_COLORS, TYPE_LABELS } from './ui';

interface Props {
  modules: Module[];
  scores: Record<string, number>;
  onToggleComplete: (assessmentId: string, moduleId: string) => void;
}

const FILTERS: { label: string; value: string }[] = [
  { label: 'All', value: 'all' },
  { label: 'Upcoming', value: 'upcoming' },
  { label: 'Completed', value: 'completed' },
  { label: 'Tests', value: 'class-test' },
  { label: 'Weekly', value: 'weekly-test' },
  { label: 'Semester', value: 'semester-test' },
  { label: 'Exams', value: 'exam' },
];

export default function Timeline({ modules, scores, onToggleComplete }: Props) {
  const [filter, setFilter] = useState('upcoming');
  const [selectedModule, setSelectedModule] = useState('all');

  const timeline = useMemo(() => buildTimeline(modules, scores), [modules, scores]);

  const filtered = useMemo(() => {
    let result = timeline;

    if (selectedModule !== 'all') {
      result = result.filter(e => e.moduleId === selectedModule);
    }

    if (filter === 'upcoming') result = result.filter(e => !e.completed);
    else if (filter === 'completed') result = result.filter(e => e.completed);
    else if (filter !== 'all') result = result.filter(e => e.type === filter);

    return result;
  }, [timeline, filter, selectedModule]);

  // Group by month
  const grouped = useMemo(() => {
    const groups: Record<string, typeof filtered> = {};
    for (const ev of filtered) {
      const key = format(parseISO(ev.date), 'MMMM yyyy');
      if (!groups[key]) groups[key] = [];
      groups[key].push(ev);
    }
    return groups;
  }, [filtered]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-semibold text-white">Semester Timeline</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={13} className="text-white/30" />
          {/* Module filter */}
          <select
            value={selectedModule}
            onChange={e => setSelectedModule(e.target.value)}
            className="text-xs font-mono bg-white/8 border border-white/10 rounded-lg px-2 py-1.5 text-white/70 focus:outline-none"
          >
            <option value="all">All modules</option>
            {modules.map(m => (
              <option key={m.id} value={m.id}>{m.code}</option>
            ))}
          </select>
          {/* Type filter */}
          <div className="flex gap-1 flex-wrap">
            {FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`text-xs font-mono px-2.5 py-1 rounded-lg transition-all ${
                  filter === f.value
                    ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/40'
                    : 'bg-white/5 text-white/40 border border-white/8 hover:border-white/20'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {Object.keys(grouped).length === 0 && (
        <div className="text-center py-16 text-white/30">
          <p className="text-lg">No assessments match this filter</p>
        </div>
      )}

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-px bg-white/8" />

        <div className="space-y-8">
          {Object.entries(grouped).map(([month, events]) => (
            <div key={month}>
              <div className="flex items-center gap-3 mb-4 pl-14">
                <span className="text-xs font-mono font-semibold uppercase tracking-widest text-white/30">
                  {month}
                </span>
                <div className="flex-1 h-px bg-white/8" />
                <span className="text-xs font-mono text-white/20">{events.length} assessments</span>
              </div>

              <div className="space-y-2">
                <AnimatePresence>
                  {events.map((ev, i) => {
                    const daysUntil = getDaysUntil(ev.date);
                    const isOverdue = daysUntil < 0 && !ev.completed;
                    const isToday = daysUntil === 0;

                    return (
                      <motion.div
                        key={ev.id}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -12 }}
                        transition={{ delay: i * 0.03 }}
                        className="relative flex items-start gap-4"
                      >
                        {/* Node */}
                        <button
                          onClick={() => onToggleComplete(ev.assessmentId, ev.moduleId)}
                          className="relative z-10 w-12 h-12 shrink-0 flex items-center justify-center rounded-full border-2 transition-all hover:scale-110"
                          style={{
                            borderColor: ev.completed ? ev.moduleColor : `${ev.moduleColor}40`,
                            background: ev.completed ? `${ev.moduleColor}20` : 'transparent',
                          }}
                        >
                          {ev.completed ? (
                            <Check size={16} style={{ color: ev.moduleColor }} />
                          ) : (
                            <div className="w-2.5 h-2.5 rounded-full"
                              style={{ background: isOverdue ? '#ef4444' : ev.moduleColor }} />
                          )}
                        </button>

                        {/* Card */}
                        <div
                          className={`flex-1 rounded-xl border p-4 transition-all ${
                            ev.completed ? 'opacity-50' : ''
                          } ${isToday ? 'ring-1 ring-white/20' : ''}`}
                          style={{
                            borderColor: isOverdue ? '#ef444440' : `${ev.moduleColor}25`,
                            background: `${ev.moduleColor}08`,
                          }}
                        >
                          <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded"
                                  style={{ color: ev.moduleColor, background: `${ev.moduleColor}25` }}>
                                  {ev.moduleCode}
                                </span>
                                <TypeBadge color={TYPE_COLORS[ev.type]} label={TYPE_LABELS[ev.type]} small />
                                {isOverdue && (
                                  <span className="text-xs font-mono font-bold text-red-400">OVERDUE</span>
                                )}
                                {isToday && (
                                  <span className="text-xs font-mono font-bold text-amber-400">TODAY</span>
                                )}
                              </div>
                              <h4 className="text-sm font-semibold text-white mb-1">{ev.name}</h4>
                              <div className="flex flex-wrap gap-3 text-xs text-white/40">
                                <span className="flex items-center gap-1">
                                  <Clock size={11} />
                                  {format(parseISO(ev.date), 'EEE d MMM yyyy')}
                                  {ev.dateEnd && ` – ${format(parseISO(ev.dateEnd), 'd MMM')}`}
                                  {ev.duration && ` · ${ev.duration}`}
                                </span>
                                {ev.location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin size={11} />
                                    {ev.location}
                                  </span>
                                )}
                                {ev.studyUnits && (
                                  <span className="flex items-center gap-1 font-mono">
                                    <BookOpen size={11} />
                                    {ev.studyUnits}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              {!ev.completed && (
                                <>
                                  <p className="text-xl font-mono font-bold text-white">
                                    {isOverdue ? '!' : countdownLabel(ev.date)}
                                  </p>
                                  {ev.weight > 0 && (
                                    <p className="text-xs font-mono text-white/30">{ev.weight}% weight</p>
                                  )}
                                </>
                              )}
                              {ev.completed && (
                                <span className="text-xs font-mono text-white/30">Done</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
