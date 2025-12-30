import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  LayoutGrid, 
  UserSquare2, 
  Printer, 
  ClipboardCheck, 
  LayoutDashboard,
  Bell,
  Cloud,
  CloudOff,
  Calendar,
  Lock,
  LogOut,
  ChevronRight,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';
import { Student, Teacher, Committee, ExamPeriod, AttendanceLog } from './types';
import Dashboard from './views/Dashboard';
import StudentsManagement from './views/StudentsManagement';
import CommitteesManagement from './views/CommitteesManagement';
import TeachersManagement from './views/TeachersManagement';
import LiveExamView from './views/LiveExamView';
import PrintingCenter from './views/PrintingCenter';
import ExamScheduleManager from './views/ExamScheduleManager';
import UsersManagement from './views/UsersManagement';
import Login from './views/Login';

// Supabase Import
import { supabase } from './lib/supabase';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [examPeriods, setExamPeriods] = useState<ExamPeriod[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // Auth & Role check with Auto-Login Bypass
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          setUser({ ...session.user, profile });
        } else {
          // --- AUTO LOGIN BYPASS FOR BROWSER ---
          // تعيين حساب مسؤول افتراضي لتخطي شاشة الدخول
          setUser({
            id: 'auto-login-admin',
            email: 'admin@controlplus.school',
            profile: {
              full_name: 'مسؤول النظام (دخول تلقائي)',
              role: 'admin'
            }
          });
        }
      } catch (error) {
        console.error("Initialization error:", error);
        // Fallback في حالة الخطأ لضمان استمرار عمل الواجهة
        setUser({
          id: 'fallback-admin',
          profile: { full_name: 'مسؤول النظام', role: 'admin' }
        });
      } finally {
        // تأخير بسيط للتأكد من استقرار الحالة قبل إخفاء شاشة التحميل
        setTimeout(() => setLoading(false), 500);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        setUser({ ...session.user, profile });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sync Data (Realtime)
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const [stds, tchs, cmts, periods, logs] = await Promise.all([
          supabase.from('students').select('*').order('created_at', { ascending: true }),
          supabase.from('teachers').select('*').order('name', { ascending: true }),
          supabase.from('committees').select('*').order('name', { ascending: true }),
          supabase.from('exam_periods').select('*').order('date', { ascending: true }),
          supabase.from('attendance_logs').select('*').order('timestamp', { ascending: false })
        ]);

        if (stds.data) setStudents(stds.data);
        if (tchs.data) setTeachers(tchs.data);
        if (cmts.data) setCommittees(cmts.data);
        if (periods.data) setExamPeriods(periods.data);
        if (logs.data) setAttendanceLogs(logs.data);
        
        setIsConnected(true);
      } catch (error) {
        console.error("Supabase Sync Error:", error);
        setIsConnected(false);
      }
    };

    fetchData();

    const subscription = supabase.channel('global-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(subscription); };
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const userRole = user?.profile?.role || 'admin';

  // Sync Wrappers using useCallback for stability
  const syncStudents = useCallback(async (newData: any) => {
    setStudents(prev => {
      const value = typeof newData === 'function' ? newData(prev) : newData;
      if (value.length > 0) supabase.from('students').upsert(value).then();
      return value;
    });
  }, []);

  const syncTeachers = useCallback(async (newData: any) => {
    setTeachers(prev => {
      const value = typeof newData === 'function' ? newData(prev) : newData;
      if (value.length > 0) supabase.from('teachers').upsert(value).then();
      return value;
    });
  }, []);

  const syncCommittees = useCallback(async (newData: any) => {
    setCommittees(prev => {
      const value = typeof newData === 'function' ? newData(prev) : newData;
      if (value.length > 0) supabase.from('committees').upsert(value).then();
      return value;
    });
  }, []);

  const syncExamPeriods = useCallback(async (newData: any) => {
    setExamPeriods(prev => {
      const value = typeof newData === 'function' ? newData(prev) : newData;
      if (value.length > 0) supabase.from('exam_periods').upsert(value).then();
      return value;
    });
  }, []);

  const syncAttendanceLogs = useCallback(async (newData: any) => {
    setAttendanceLogs(prev => {
      const value = typeof newData === 'function' ? newData(prev) : newData;
      if (value.length > 0) supabase.from('attendance_logs').upsert(value).then();
      return value;
    });
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard students={students} committees={committees} teachers={teachers} attendanceLogs={attendanceLogs} />;
      case 'students': return <StudentsManagement students={students} setStudents={syncStudents} />;
      case 'committees': return <CommitteesManagement students={students} committees={committees} setCommittees={syncCommittees} setStudents={syncStudents} />;
      case 'schedule': return <ExamScheduleManager examPeriods={examPeriods} setExamPeriods={syncExamPeriods} students={students} />;
      case 'teachers': return <TeachersManagement teachers={teachers} setTeachers={syncTeachers} committees={committees} setCommittees={syncCommittees} />;
      case 'users': return <UsersManagement teachers={teachers} />;
      case 'live': return <LiveExamView committees={committees} students={students} setStudents={syncStudents} attendanceLogs={attendanceLogs} setAttendanceLogs={syncAttendanceLogs} teachers={teachers} />;
      case 'printing': return <PrintingCenter committees={committees} students={students} teachers={teachers} />;
      default: return <Dashboard students={students} committees={committees} teachers={teachers} attendanceLogs={attendanceLogs} />;
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <div className="w-16 h-16 border-t-4 border-indigo-500 rounded-full animate-spin"></div>
        <div className="flex flex-col items-center">
          <p className="text-white font-black text-xl tracking-widest">كنترول بلس</p>
          <p className="text-slate-500 text-xs mt-2 uppercase tracking-[0.3em]">تحميل بيئة العمل...</p>
        </div>
      </div>
    </div>
  );

  if (!user) return <Login onLoginSuccess={setUser} />;

  return (
    <div className="flex min-h-screen bg-[#F1F5F9] text-slate-900 font-sans">
      <aside className="w-72 bg-slate-900 text-white flex-shrink-0 flex flex-col no-print shadow-2xl relative z-20">
        <div className="p-8 border-b border-slate-800/50">
          <div className="flex items-center gap-3">
             <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-2.5 rounded-2xl shadow-xl shadow-indigo-500/20">
               <ShieldAlert size={24} />
             </div>
             <div>
                <h1 className="text-xl font-black tracking-tight">كنترول بلس</h1>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Control Management</p>
             </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
          {userRole === 'admin' && (
            <>
              <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={20} />} label="لوحة التحكم" />
              <NavItem active={activeTab === 'students'} onClick={() => setActiveTab('students')} icon={<Users size={20} />} label="إدارة الطلاب" />
              <NavItem active={activeTab === 'committees'} onClick={() => setActiveTab('committees')} icon={<LayoutGrid size={20} />} label="اللجان والتوزيع" />
              <NavItem active={activeTab === 'schedule'} onClick={() => setActiveTab('schedule')} icon={<Calendar size={20} />} label="جدول الاختبارات" />
              <NavItem active={activeTab === 'teachers'} onClick={() => setActiveTab('teachers')} icon={<UserSquare2 size={20} />} label="الملاحظين" />
              <NavItem active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<ShieldCheck size={20} />} label="إدارة الحسابات" />
              <NavItem active={activeTab === 'printing'} onClick={() => setActiveTab('printing')} icon={<Printer size={20} />} label="مركز الطباعة" />
            </>
          )}
          
          <NavItem active={activeTab === 'live'} onClick={() => setActiveTab('live')} icon={<ClipboardCheck size={20} />} label="العمليات الحية (QR)" />
        </nav>

        <div className="p-6 bg-slate-950/40 border-t border-slate-800 space-y-4">
          <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-2xl border border-slate-700/50">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-black shadow-lg text-lg">
              {user.profile?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
               <div className="text-xs font-black text-white truncate">{user.profile?.full_name || 'مستخدم النظام'}</div>
               <div className="text-[9px] font-black text-slate-500 uppercase mt-1">
                 رتبة: <span className="text-indigo-400">{user.profile?.role === 'admin' ? 'مدير نظام' : 'ملاحظ'}</span>
               </div>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all font-black text-xs"
          >
            <LogOut size={16} />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <header className="h-20 bg-white/70 backdrop-blur-lg border-b border-slate-200 flex items-center justify-between px-10 sticky top-0 z-10 no-print">
          <div className="flex items-center gap-4 text-slate-400">
             <span className="text-[10px] font-black uppercase tracking-[0.2em]">{userRole} PANEL</span>
             <ChevronRight size={14} />
             <span className="text-xs font-black text-indigo-600 capitalize">
               {activeTab.replace('_', ' ')}
             </span>
          </div>
          <div className="flex items-center gap-6">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${isConnected ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-red-50 border-red-100 text-red-600'}`}>
              {isConnected ? <Cloud size={14} /> : <CloudOff size={14} />}
              <span className="text-[10px] font-black uppercase tracking-widest">{isConnected ? 'SupaCloud Connected' : 'Sync Offline'}</span>
            </div>
            <button className="relative p-2.5 text-slate-400 hover:bg-slate-100 rounded-xl transition-all">
              <Bell size={22} />
              <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        <div className="p-8 md:p-10 pb-16 max-w-[1600px] mx-auto w-full animate-in fade-in slide-in-from-bottom-2 duration-500">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

const NavItem: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${
      active ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'text-slate-500 hover:bg-slate-800/50 hover:text-white'
    }`}
  >
    <span className={`${active ? 'scale-110' : 'scale-100'} transition-transform`}>{icon}</span>
    <span className="font-black text-sm">{label}</span>
    {active && <div className="mr-auto w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_white]"></div>}
  </button>
);

export default App;