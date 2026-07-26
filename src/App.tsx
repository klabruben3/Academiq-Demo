import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard, GitBranch, Calendar, BarChart2,
  BookOpen, ChevronRight, Menu, X,
} from 'lucide-react';
import { MODULES } from './data/modules';
import Dashboard from './components/Dashboard';
import Timeline from './components/Timeline';
import CalendarView from './components/CalendarView';
import Analytics from './components/Analytics';
import ModulePage from './components/ModulePage';

type ViewId = 'dashboard' | 'timeline' | 'calendar' | 'analytics' | string;

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'timeline', label: 'Timeline', icon: GitBranch },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'analytics', label: 'Analytics', icon: BarChart2 },
];

const SCORES_KEY = 'academiq-scores';
const COMPLETED_KEY = 'academiq-completed';

function loadScores(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(SCORES_KEY) ?? '{}'); } catch { return {}; }
}

function loadCompleted(): Record<string, boolean> {
  try { return JSON.parse(localStorage.getItem(COMPLETED_KEY) ?? '{}'); } catch { return {}; }
}

export default function App() {
  const [view, setView] = useState<ViewId>('dashboard');
  const [scores, setScores] = useState<Record<string, number>>(loadScores);
  const [completed, setCompleted] = useState<Record<string, boolean>>(loadCompleted);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(SCORES_KEY, JSON.stringify(scores));
  }, [scores]);

  useEffect(() => {
    localStorage.setItem(COMPLETED_KEY, JSON.stringify(completed));
  }, [completed]);

  // Merge completed state into modules for timeline
  const modulesWithState = MODULES.map(mod => ({
    ...mod,
    assessments: mod.assessments.map(a => ({
      ...a,
      completed: completed[a.id] ?? false,
    })),
  }));

  const handleScoreChange = useCallback((assessmentId: string, score: number) => {
    setScores(prev => ({ ...prev, [assessmentId]: score }));
  }, []);

  const handleToggleComplete = useCallback((assessmentId: string, _moduleId: string) => {
    setCompleted(prev => ({ ...prev, [assessmentId]: !prev[assessmentId] }));
  }, []);

  const handleSelectModule = useCallback((moduleId: string) => {
    setView(`module:${moduleId}`);
    setSidebarOpen(false);
  }, []);

  const currentModule = view.startsWith('module:')
    ? MODULES.find(m => m.id === view.replace('module:', ''))
    : null;

  function renderContent() {
    if (view === 'dashboard') {
      return (
        <Dashboard
          modules={modulesWithState}
          scores={scores}
          onSelectModule={handleSelectModule}
        />
      );
    }
    if (view === 'timeline') {
      return (
        <Timeline
          modules={modulesWithState}
          scores={scores}
          onToggleComplete={handleToggleComplete}
        />
      );
    }
    if (view === 'calendar') {
      return <CalendarView modules={modulesWithState} scores={scores} />;
    }
    if (view === 'analytics') {
      return <Analytics modules={modulesWithState} scores={scores} />;
    }
    if (currentModule) {
      return (
        <ModulePage
          module={currentModule}
          scores={scores}
          onScoreChange={handleScoreChange}
        />
      );
    }
    return null;
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#080d1a', color: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Sidebar */}
      <>
        {/* Mobile overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-30 bg-black/60 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        <motion.aside
          initial={false}
          animate={{ x: sidebarOpen ? 0 : '-100%' }}
          className="fixed top-0 left-0 h-full z-40 flex flex-col w-60 lg:static lg:translate-x-0"
          style={{
            background: '#0b1120',
            borderRight: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {/* Logo */}
          <div className="p-5 flex items-center justify-between border-b border-white/5">
            <div>
              <p className="text-base font-bold text-white tracking-tight">Academiq</p>
              <p className="text-xs font-mono text-white/30">Semester Planner</p>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/30 hover:text-white">
              <X size={16} />
            </button>
          </div>

          {/* Nav */}
          <nav className="p-3 space-y-0.5 flex-1">
            {NAV_ITEMS.map(item => {
              const Icon = item.icon;
              const active = view === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { setView(item.id); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                    active
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/25'
                      : 'text-white/50 hover:bg-white/5 hover:text-white/80'
                  }`}
                >
                  <Icon size={15} className={active ? 'text-indigo-400' : ''} />
                  {item.label}
                </button>
              );
            })}

            {/* Modules */}
            <div className="pt-4">
              <p className="text-[10px] font-mono font-semibold uppercase tracking-widest text-white/20 px-3 mb-2">Modules</p>
              {MODULES.map(mod => {
                const active = view === `module:${mod.id}`;
                return (
                  <button
                    key={mod.id}
                    onClick={() => handleSelectModule(mod.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                      active ? 'bg-white/8 text-white' : 'text-white/50 hover:bg-white/5 hover:text-white/80'
                    }`}
                  >
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: mod.color }} />
                    <span className="flex-1 text-left truncate">{mod.code}</span>
                    <ChevronRight size={12} className="text-white/20" />
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-white/5">
            <p className="text-[10px] font-mono text-white/20 text-center">NWU · Semester 2 · 2026</p>
          </div>
        </motion.aside>
      </>

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-white/5 sticky top-0 z-20"
          style={{ background: '#080d1a' }}>
          <button onClick={() => setSidebarOpen(true)} className="text-white/50 hover:text-white">
            <Menu size={20} />
          </button>
          <p className="text-sm font-semibold text-white">
            {currentModule ? currentModule.code : NAV_ITEMS.find(n => n.id === view)?.label ?? 'Module'}
          </p>
        </header>

        {/* Breadcrumb (desktop) */}
        <div className="hidden lg:flex items-center gap-2 px-6 py-3 border-b border-white/5 text-xs font-mono text-white/30">
          <span>Academiq</span>
          <ChevronRight size={12} />
          {currentModule ? (
            <>
              <button onClick={() => setView('dashboard')} className="hover:text-white/60 transition-colors">Modules</button>
              <ChevronRight size={12} />
              <span className="text-white/60">{currentModule.code}</span>
            </>
          ) : (
            <span className="text-white/60 capitalize">{view}</span>
          )}
        </div>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="p-4 md:p-6 max-w-6xl mx-auto"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
