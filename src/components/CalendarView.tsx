import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameDay, isSameMonth, startOfWeek, endOfWeek, addMonths, subMonths,
  addWeeks, subWeeks, isToday, getDay,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Module } from '../types';
import { buildTimeline } from '../utils/calculations';
import { TYPE_COLORS, TYPE_LABELS } from './ui';

interface Props {
  modules: Module[];
  scores: Record<string, number>;
}

type CalView = 'month' | 'week' | 'agenda';

export default function CalendarView({ modules, scores }: Props) {
  const [view, setView] = useState<CalView>('month');
  const [current, setCurrent] = useState(new Date());

  const timeline = useMemo(() => buildTimeline(modules, scores), [modules, scores]);

  function getEventsForDay(date: Date) {
    return timeline.filter(e => isSameDay(parseISO(e.date), date));
  }

  const navLabel = view === 'month'
    ? format(current, 'MMMM yyyy')
    : view === 'week'
      ? `${format(startOfWeek(current, { weekStartsOn: 1 }), 'd MMM')} – ${format(endOfWeek(current, { weekStartsOn: 1 }), 'd MMM yyyy')}`
      : format(current, 'MMMM yyyy');

  function prev() {
    if (view === 'month') setCurrent(subMonths(current, 1));
    else if (view === 'week') setCurrent(subWeeks(current, 1));
  }

  function next() {
    if (view === 'month') setCurrent(addMonths(current, 1));
    else if (view === 'week') setCurrent(addWeeks(current, 1));
  }

  // Month view days
  const monthDays = useMemo(() => {
    if (view !== 'month') return [];
    const start = startOfWeek(startOfMonth(current), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(current), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [current, view]);

  // Week view days
  const weekDays = useMemo(() => {
    if (view !== 'week') return [];
    const start = startOfWeek(current, { weekStartsOn: 1 });
    const end = endOfWeek(current, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [current, view]);

  // Agenda view: next 60 days of events
  const agendaEvents = useMemo(() => {
    const today = new Date();
    return timeline
      .filter(e => parseISO(e.date) >= today)
      .slice(0, 40);
  }, [timeline]);

  const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={prev} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 transition-colors">
            <ChevronLeft size={16} />
          </button>
          <h2 className="text-base font-semibold text-white min-w-[180px] text-center font-mono">{navLabel}</h2>
          <button onClick={next} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 transition-colors">
            <ChevronRight size={16} />
          </button>
          <button onClick={() => setCurrent(new Date())}
            className="text-xs font-mono px-2 py-1 rounded-lg bg-white/5 text-white/40 hover:bg-white/10 transition-colors">
            Today
          </button>
        </div>
        <div className="flex gap-1">
          {(['month', 'week', 'agenda'] as CalView[]).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`text-xs font-mono px-3 py-1.5 rounded-lg capitalize transition-all ${
                view === v
                  ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/40'
                  : 'bg-white/5 text-white/40 border border-white/8 hover:border-white/20'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-3 flex-wrap">
        {Object.entries(TYPE_COLORS).slice(0, 6).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-xs font-mono text-white/40">{TYPE_LABELS[type as keyof typeof TYPE_LABELS]}</span>
          </div>
        ))}
      </div>

      {/* Month view */}
      {view === 'month' && (
        <div className="rounded-2xl border border-white/8 overflow-hidden">
          <div className="grid grid-cols-7 bg-white/4">
            {DAY_HEADERS.map(d => (
              <div key={d} className="py-2 text-center text-xs font-mono font-medium text-white/30">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 divide-x divide-y divide-white/5">
            {monthDays.map(day => {
              const events = getEventsForDay(day);
              const inMonth = isSameMonth(day, current);
              const todayDay = isToday(day);

              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[80px] p-1.5 ${!inMonth ? 'opacity-30' : ''} ${todayDay ? 'bg-indigo-500/10' : ''}`}
                >
                  <p className={`text-xs font-mono text-right mb-1 w-6 h-6 flex items-center justify-center rounded-full ml-auto ${
                    todayDay ? 'bg-indigo-500 text-white font-bold' : 'text-white/40'
                  }`}>
                    {format(day, 'd')}
                  </p>
                  <div className="space-y-0.5">
                    {events.slice(0, 3).map(ev => (
                      <div
                        key={ev.id}
                        className="text-[10px] font-medium px-1 py-0.5 rounded truncate leading-tight"
                        style={{
                          background: `${TYPE_COLORS[ev.type]}25`,
                          color: TYPE_COLORS[ev.type],
                          border: `1px solid ${TYPE_COLORS[ev.type]}40`,
                        }}
                        title={`${ev.moduleCode}: ${ev.name}`}
                      >
                        {ev.moduleCode}
                      </div>
                    ))}
                    {events.length > 3 && (
                      <div className="text-[10px] text-white/30 font-mono px-1">+{events.length - 3}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week view */}
      {view === 'week' && (
        <div className="rounded-2xl border border-white/8 overflow-hidden">
          <div className="grid grid-cols-7">
            {weekDays.map(day => {
              const events = getEventsForDay(day);
              const todayDay = isToday(day);

              return (
                <div key={day.toISOString()} className={`border-r border-white/5 last:border-0 ${todayDay ? 'bg-indigo-500/8' : ''}`}>
                  <div className={`py-2 px-2 text-center border-b border-white/5 ${todayDay ? 'bg-indigo-500/15' : ''}`}>
                    <p className="text-xs font-mono text-white/40">{format(day, 'EEE')}</p>
                    <p className={`text-lg font-mono font-semibold ${todayDay ? 'text-indigo-400' : 'text-white'}`}>
                      {format(day, 'd')}
                    </p>
                  </div>
                  <div className="p-2 space-y-1 min-h-[200px]">
                    {events.map(ev => (
                      <motion.div
                        key={ev.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="rounded-lg p-2 text-xs cursor-default"
                        style={{
                          background: `${TYPE_COLORS[ev.type]}20`,
                          borderLeft: `2px solid ${TYPE_COLORS[ev.type]}`,
                        }}
                      >
                        <p className="font-mono font-bold mb-0.5" style={{ color: ev.moduleColor }}>{ev.moduleCode}</p>
                        <p className="text-white/70 leading-tight">{ev.name}</p>
                        {ev.duration && <p className="text-white/30 text-[10px] mt-0.5">{ev.duration}</p>}
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Agenda view */}
      {view === 'agenda' && (
        <div className="space-y-1">
          {agendaEvents.length === 0 && (
            <div className="text-center py-16 text-white/30">No upcoming assessments</div>
          )}
          {agendaEvents.map((ev, i) => {
            const showDate = i === 0 || !isSameDay(parseISO(agendaEvents[i - 1].date), parseISO(ev.date));

            return (
              <div key={ev.id}>
                {showDate && (
                  <div className="flex items-center gap-3 py-3">
                    <p className="text-xs font-mono font-semibold text-white/40 w-32">
                      {format(parseISO(ev.date), 'EEEE, d MMM')}
                    </p>
                    <div className="flex-1 h-px bg-white/8" />
                  </div>
                )}
                <div className="ml-32 rounded-xl border border-white/8 bg-white/3 p-3 mb-2 flex items-center gap-3">
                  <div className="w-1 h-8 rounded-full shrink-0" style={{ backgroundColor: TYPE_COLORS[ev.type] }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{ev.name}</p>
                    <p className="text-xs font-mono text-white/40">{ev.moduleCode} · {TYPE_LABELS[ev.type]}</p>
                  </div>
                  {ev.location && <p className="text-xs text-white/30">{ev.location}</p>}
                  {ev.duration && <p className="text-xs font-mono text-white/30">{ev.duration}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
