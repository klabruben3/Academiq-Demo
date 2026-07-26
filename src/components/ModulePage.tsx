import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { format, parseISO } from 'date-fns';
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
} from 'recharts';
import { Check, Clock, MapPin, BookOpen, Mail, User, AlertCircle } from 'lucide-react';
import type { Module, AssessmentComponent } from '../types';
import { calculateParticipationMark, getDaysUntil, countdownLabel } from '../utils/calculations';
import { TypeBadge, TYPE_COLORS, TYPE_LABELS, ProgressBar } from './ui';

interface Props {
  module: Module;
  scores: Record<string, number>;
  onScoreChange: (assessmentId: string, score: number) => void;
}

export default function ModulePage({ module: mod, scores, onScoreChange }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [inputVal, setInputVal] = useState('');

  const participationMark = useMemo(
    () => calculateParticipationMark(mod, scores),
    [mod, scores],
  );

  const minRequired = mod.participationFormula.minimumToPass;
  const examAdmissionOk = participationMark >= minRequired;

  const assessmentWithScores = mod.assessments.filter(a => a.date || a.type === 'attendance');

  const completedCount = mod.assessments.filter(a => a.id in scores).length;
  const totalWithDates = mod.assessments.filter(a => a.date).length;

  function startEdit(a: AssessmentComponent) {
    setEditingId(a.id);
    setInputVal(scores[a.id]?.toString() ?? '');
  }

  function commitEdit(a: AssessmentComponent) {
    const val = parseFloat(inputVal);
    if (!isNaN(val) && val >= 0 && val <= a.maxScore) {
      onScoreChange(a.id, val);
    }
    setEditingId(null);
  }

  function getContribution(a: AssessmentComponent): number {
    if (!(a.id in scores)) return 0;
    const pct = (scores[a.id] / a.maxScore) * 100;
    return Math.round(pct * (a.weight / 100) * 10) / 10;
  }

  const gaugeData = [
    { name: 'Progress', value: Math.round(participationMark), fill: participationMark >= 75 ? '#10b981' : participationMark >= 50 ? '#6366f1' : participationMark >= 40 ? '#f59e0b' : '#ef4444' },
  ];

  const assessmentBarData = mod.assessments
    .filter(a => a.weight > 0 && a.date)
    .map(a => ({
      name: a.name.length > 14 ? a.name.slice(0, 14) + '…' : a.name,
      weight: a.weight,
      score: a.id in scores ? Math.round((scores[a.id] / a.maxScore) * a.weight * 10) / 10 : 0,
    }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded"
              style={{ background: `${mod.color}30`, color: mod.color }}>
              {mod.code}
            </span>
            {examAdmissionOk ? (
              <span className="text-xs font-mono text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">EXAM ELIGIBLE</span>
            ) : (
              <span className="text-xs font-mono text-red-400 border border-red-500/30 px-2 py-0.5 rounded">EXAM NOT YET ELIGIBLE</span>
            )}
          </div>
          <h2 className="text-2xl font-semibold text-white mb-1">{mod.name}</h2>
          <div className="flex flex-wrap gap-3 text-xs text-white/40">
            {mod.lecturer && (
              <span className="flex items-center gap-1"><User size={11} />{mod.lecturer}</span>
            )}
            {mod.email && (
              <span className="flex items-center gap-1"><Mail size={11} />{mod.email}</span>
            )}
            {mod.office && <span className="font-mono">{mod.office}</span>}
          </div>
        </div>

        {/* Participation gauge */}
        <div className="flex flex-col items-center">
          <div className="relative w-28 h-28">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart innerRadius={38} outerRadius={56} data={gaugeData} startAngle={90} endAngle={90 - 360 * (participationMark / 100)}>
                <RadialBar dataKey="value" cornerRadius={8} background={{ fill: '#ffffff10' }} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-mono font-bold text-white">{participationMark.toFixed(0)}%</span>
              <span className="text-[10px] font-mono text-white/40">PM</span>
            </div>
          </div>
          <p className="text-xs font-mono text-white/30 mt-1">Min: {minRequired}%</p>
        </div>
      </div>

      {/* Participation formula breakdown */}
      <div className="rounded-xl border border-white/8 bg-white/3 p-4">
        <h3 className="text-xs font-mono font-semibold uppercase tracking-widest text-white/40 mb-3">
          Participation Formula
        </h3>
        <div className="flex flex-wrap gap-3">
          {mod.participationFormula.components.map(comp => {
            const a = mod.assessments.find(a => a.id === comp.componentId);
            const catAssessments = mod.assessments.filter(a => a.category === comp.componentId.replace(`${mod.id}-`, ''));
            const label = a?.name ?? comp.componentId.replace(`${mod.id}-`, '').replace(/-/g, ' ');

            return (
              <div key={comp.componentId} className="flex-1 min-w-[120px] rounded-lg border border-white/8 p-3 text-center">
                <p className="text-2xl font-mono font-bold text-white mb-0.5">{comp.weight}%</p>
                <p className="text-xs text-white/50 capitalize">{label}</p>
                {comp.dropLowest && comp.dropLowest > 0 && (
                  <p className="text-[10px] font-mono text-white/30 mt-1">drop {comp.dropLowest} lowest</p>
                )}
              </div>
            );
          })}
        </div>
        <ProgressBar
          value={(participationMark / minRequired) * 100}
          color={examAdmissionOk ? '#10b981' : '#f59e0b'}
          className="mt-4"
        />
        <div className="flex justify-between text-xs font-mono text-white/30 mt-1">
          <span>Current: {participationMark.toFixed(1)}%</span>
          <span>Target: {minRequired}%</span>
        </div>
      </div>

      {/* Assessments list */}
      <div>
        <h3 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
          <BookOpen size={14} />
          Assessments
          <span className="font-mono text-white/30 text-xs">{completedCount}/{totalWithDates} entered</span>
        </h3>

        <div className="space-y-2">
          {assessmentWithScores
            .filter(a => a.date)
            .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))
            .map(a => {
              const daysUntil = a.date ? getDaysUntil(a.date) : null;
              const hasScore = a.id in scores;
              const score = scores[a.id];
              const pct = hasScore ? Math.round((score / a.maxScore) * 100) : null;
              const contrib = getContribution(a);
              const isPast = daysUntil !== null && daysUntil < 0;

              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-white/8 bg-white/3 p-4"
                >
                  <div className="flex items-start gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <TypeBadge color={TYPE_COLORS[a.type]} label={TYPE_LABELS[a.type]} small />
                        {a.weight > 0 && (
                          <span className="text-xs font-mono text-white/30">{a.weight}% weight</span>
                        )}
                      </div>
                      <h4 className="text-sm font-semibold text-white mb-1">{a.name}</h4>
                      <div className="flex flex-wrap gap-3 text-xs text-white/40">
                        {a.date && (
                          <span className="flex items-center gap-1 font-mono">
                            <Clock size={10} />
                            {format(parseISO(a.date), 'EEE d MMM')}
                            {a.dateEnd && ` – ${format(parseISO(a.dateEnd), 'd MMM')}`}
                          </span>
                        )}
                        {a.location && (
                          <span className="flex items-center gap-1">
                            <MapPin size={10} /> {a.location}
                          </span>
                        )}
                        {a.studyUnits && (
                          <span className="font-mono">{a.studyUnits}</span>
                        )}
                        {a.duration && <span>{a.duration}</span>}
                      </div>
                    </div>

                    {/* Score entry */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {daysUntil !== null && !hasScore && (
                        <p className="text-xs font-mono text-white/40">{countdownLabel(a.date!)}</p>
                      )}
                      {editingId === a.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            max={a.maxScore}
                            value={inputVal}
                            onChange={e => setInputVal(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') commitEdit(a); if (e.key === 'Escape') setEditingId(null); }}
                            className="w-20 text-sm font-mono bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-white text-center focus:outline-none focus:border-indigo-500"
                            autoFocus
                          />
                          <span className="text-xs text-white/30">/ {a.maxScore}</span>
                          <button onClick={() => commitEdit(a)}
                            className="w-7 h-7 rounded-lg bg-indigo-500/30 text-indigo-300 flex items-center justify-center hover:bg-indigo-500/50">
                            <Check size={12} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(a)}
                          className="flex flex-col items-end hover:opacity-80 transition-opacity"
                        >
                          {hasScore ? (
                            <>
                              <span className="text-xl font-mono font-bold text-white">
                                {score}<span className="text-sm text-white/30">/{a.maxScore}</span>
                              </span>
                              <span className="text-xs font-mono" style={{ color: pct! >= 75 ? '#10b981' : pct! >= 50 ? '#6366f1' : '#ef4444' }}>
                                {pct}%
                              </span>
                              {a.weight > 0 && (
                                <span className="text-xs font-mono text-white/30">+{contrib} pts</span>
                              )}
                            </>
                          ) : (
                            <span className="text-xs font-mono text-white/20 border border-dashed border-white/15 px-3 py-1.5 rounded-lg hover:border-white/30 transition-colors">
                              Enter score
                            </span>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {hasScore && a.weight > 0 && (
                    <ProgressBar
                      value={pct!}
                      color={pct! >= 75 ? '#10b981' : pct! >= 50 ? '#6366f1' : '#ef4444'}
                      className="mt-3"
                    />
                  )}
                </motion.div>
              );
            })}
        </div>
      </div>

      {/* Assessment weight chart */}
      {assessmentBarData.length > 0 && (
        <div className="rounded-xl border border-white/8 bg-white/3 p-4">
          <h3 className="text-xs font-mono font-semibold uppercase tracking-widest text-white/40 mb-4">
            Score vs Weight
          </h3>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={assessmentBarData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: '#ffffff40', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#ffffff40', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#0f1629', border: '1px solid #ffffff15', borderRadius: 8, fontSize: 11 }}
                labelStyle={{ color: '#ffffff80' }}
              />
              <Bar dataKey="weight" name="Max weight" fill="#ffffff15" radius={[4, 4, 0, 0]} />
              <Bar dataKey="score" name="Your contribution" radius={[4, 4, 0, 0]}>
                {assessmentBarData.map((entry, index) => (
                  <Cell key={index} fill={mod.color} fillOpacity={0.7} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Projected marks */}
      <div className="rounded-xl border border-white/8 bg-white/3 p-4">
        <h3 className="text-xs font-mono font-semibold uppercase tracking-widest text-white/40 mb-3">
          Targets
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[40, 50, 75, 80].map(target => {
            const needed = Math.max(0, target - participationMark);
            const achievable = needed === 0;
            return (
              <div key={target} className="rounded-lg border border-white/8 p-3 text-center">
                <p className="text-lg font-mono font-bold mb-0.5" style={{ color: achievable ? '#10b981' : '#f59e0b' }}>
                  {achievable ? '✓' : `+${needed.toFixed(1)}%`}
                </p>
                <p className="text-xs text-white/40">{target}% target</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
