import { useMemo } from 'react';
import { motion } from 'motion/react';
import { format, parseISO } from 'date-fns';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { AlertTriangle, Clock, TrendingUp, BookOpen, ChevronRight } from 'lucide-react';
import type { Module, TimelineEvent } from '../types';
import {
  buildTimeline, getPriorityItems, getWorloadData,
  getDaysUntil, getSemesterWeek, getSemesterProgress,
  getUpcomingEvents, countdownLabel,
} from '../utils/calculations';
import { TypeBadge, TYPE_COLORS, TYPE_LABELS, PRIORITY_COLORS, ProgressBar, StatCard } from './ui';

interface Props {
  modules: Module[];
  scores: Record<string, number>;
  onSelectModule: (id: string) => void;
}

export default function Dashboard({ modules, scores, onSelectModule }: Props) {
  const timeline = useMemo(() => buildTimeline(modules, scores), [modules, scores]);
  const priorityItems = useMemo(() => getPriorityItems(timeline), [timeline]);
  const workloadData = useMemo(() => getWorloadData(), []);
  const semesterWeek = getSemesterWeek();
  const semesterProgress = getSemesterProgress();

  const next7 = getUpcomingEvents(timeline, 7);
  const next14 = getUpcomingEvents(timeline, 14);
  const next30 = getUpcomingEvents(timeline, 30);

  const nextEvent = timeline.find(e => !e.completed && getDaysUntil(e.date) >= 0);

  const today = new Date();
  const dayName = format(today, 'EEEE');
  const dateStr = format(today, 'd MMMM yyyy');

  const completed = timeline.filter(e => e.completed).length;
  const total = timeline.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-white/30 mb-1">
            {dayName} · Week {semesterWeek} of Semester
          </p>
          <h1 className="text-3xl font-semibold text-white">{dateStr}</h1>
          <p className="text-sm text-white/40 mt-1">Semester {semesterProgress}% complete</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-mono text-white/30 mb-1">ASSESSMENTS</p>
          <p className="text-2xl font-mono font-semibold text-white">{completed}<span className="text-white/30">/{total}</span></p>
          <p className="text-xs text-white/40">completed</p>
        </div>
      </div>

      <ProgressBar value={semesterProgress} color="#6366f1" />

      {/* Next assessment hero */}
      {nextEvent && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border p-6 relative overflow-hidden"
          style={{
            borderColor: `${nextEvent.moduleColor}44`,
            background: `linear-gradient(135deg, ${nextEvent.moduleColor}18 0%, transparent 60%)`,
          }}
        >
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-5"
            style={{ background: nextEvent.moduleColor, transform: 'translate(25%, -25%)' }} />
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded"
                  style={{ background: `${nextEvent.moduleColor}33`, color: nextEvent.moduleColor }}>
                  {nextEvent.moduleCode}
                </span>
                <TypeBadge color={TYPE_COLORS[nextEvent.type]} label={TYPE_LABELS[nextEvent.type]} />
              </div>
              <h2 className="text-xl font-semibold text-white mb-1 truncate">{nextEvent.name}</h2>
              <p className="text-sm text-white/50">{format(parseISO(nextEvent.date), 'EEEE, d MMMM yyyy')}</p>
              {nextEvent.location && (
                <p className="text-xs text-white/30 mt-0.5">{nextEvent.location}</p>
              )}
              {nextEvent.studyUnits && (
                <p className="text-xs text-white/40 mt-1 font-mono">{nextEvent.studyUnits}</p>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-mono uppercase tracking-widest text-white/30 mb-1">Due in</p>
              <p className="text-4xl font-mono font-bold" style={{ color: nextEvent.moduleColor }}>
                {getDaysUntil(nextEvent.date)}
              </p>
              <p className="text-xs text-white/40">days</p>
              {nextEvent.weight > 0 && (
                <p className="text-xs font-mono text-white/30 mt-2">{nextEvent.weight}% weight</p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Due in 7 days" value={next7.length} color={next7.length > 2 ? '#ef4444' : '#fff'} />
        <StatCard label="Due in 14 days" value={next14.length} color="#f97316" />
        <StatCard label="Due in 30 days" value={next30.length} color="#eab308" />
        <StatCard label="Semester week" value={`W${semesterWeek}`} color="#6366f1" />
      </div>

      {/* Two-column: Priority + Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Priority panel */}
        <div className="lg:col-span-1 rounded-2xl border border-white/8 bg-white/3 p-4">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={14} className="text-amber-400" />
            <h3 className="text-sm font-semibold text-white/80">Priority Focus</h3>
          </div>
          <div className="space-y-2">
            {priorityItems.slice(0, 6).map((item, i) => (
              <motion.div
                key={item.event.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                onClick={() => onSelectModule(item.event.moduleId)}
              >
                <div className="mt-1 w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: PRIORITY_COLORS[item.event.priority] }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">{item.event.name}</p>
                  <p className="text-xs text-white/40 font-mono">{item.event.moduleCode}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-mono text-white/50">{item.reason}</p>
                </div>
              </motion.div>
            ))}
            {priorityItems.length === 0 && (
              <p className="text-sm text-white/30 text-center py-4">All caught up!</p>
            )}
          </div>
        </div>

        {/* Workload graph */}
        <div className="lg:col-span-2 rounded-2xl border border-white/8 bg-white/3 p-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={14} className="text-indigo-400" />
            <h3 className="text-sm font-semibold text-white/80">Semester Workload</h3>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={workloadData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="wl" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fill: '#ffffff40', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#ffffff40', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#0f1629', border: '1px solid #ffffff15', borderRadius: 8, fontSize: 11 }}
                labelStyle={{ color: '#ffffff80' }}
                itemStyle={{ color: '#6366f1' }}
                formatter={(val) => [`${val}`, 'Load']}
              />
              <Area type="monotone" dataKey="load" stroke="#6366f1" strokeWidth={2} fill="url(#wl)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Module cards */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <BookOpen size={14} className="text-white/40" />
          <h3 className="text-sm font-semibold text-white/80">Modules</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {modules.map(mod => {
            const modEvents = timeline.filter(e => e.moduleId === mod.id && !e.completed);
            const nextMod = modEvents.find(e => getDaysUntil(e.date) >= 0);
            const completedCount = timeline.filter(e => e.moduleId === mod.id && e.completed).length;
            const totalCount = timeline.filter(e => e.moduleId === mod.id).length;
            const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

            return (
              <motion.button
                key={mod.id}
                onClick={() => onSelectModule(mod.id)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="text-left rounded-xl border p-4 hover:border-white/20 transition-colors group"
                style={{ borderColor: `${mod.color}30`, background: `${mod.color}0a` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded"
                    style={{ background: `${mod.color}30`, color: mod.color }}>
                    {mod.code}
                  </span>
                  <ChevronRight size={14} className="text-white/20 group-hover:text-white/50 transition-colors mt-0.5" />
                </div>
                <p className="text-sm font-medium text-white mb-3 leading-tight">{mod.name}</p>
                <ProgressBar value={progress} color={mod.color} className="mb-2" />
                <div className="flex justify-between text-xs font-mono text-white/30">
                  <span>{completedCount}/{totalCount}</span>
                  {nextMod && <span>{countdownLabel(nextMod.date)}</span>}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Today's focus */}
      <div className="rounded-2xl border border-white/8 bg-white/3 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={14} className="text-emerald-400" />
          <h3 className="text-sm font-semibold text-white/80">Upcoming This Week</h3>
        </div>
        {next7.length === 0 ? (
          <p className="text-sm text-white/30 py-4 text-center">No assessments in the next 7 days</p>
        ) : (
          <div className="divide-y divide-white/5">
            {next7.map(ev => (
              <div key={ev.id} className="flex items-center gap-3 py-2.5">
                <div className="w-1 h-8 rounded-full shrink-0" style={{ backgroundColor: ev.moduleColor }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{ev.name}</p>
                  <p className="text-xs text-white/40 font-mono">{ev.moduleCode} · {ev.studyUnits}</p>
                </div>
                <div className="text-right shrink-0">
                  <TypeBadge color={TYPE_COLORS[ev.type]} label={TYPE_LABELS[ev.type]} small />
                  <p className="text-xs font-mono text-white/40 mt-1">{format(parseISO(ev.date), 'EEE d MMM')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
