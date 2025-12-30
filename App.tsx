import React, { useState, useEffect } from 'react';
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
  Calendar
} from 'lucide-react';
import { Student, Teacher, Committee, ExamPeriod, AttendanceLog } from './types';
import Dashboard from './views/Dashboard';
import StudentsManagement from './views/StudentsManagement';
import CommitteesManagement from './views/CommitteesManagement';
import TeachersManagement from './views/TeachersManagement';
import LiveExamView from './views/LiveExamView';
import PrintingCenter from './views/PrintingCenter';
import ExamScheduleManager from './views/ExamScheduleManager';

// Firebase Import from Central Config
import { db } from './lib/firebase';
import { ref, onValue, set, off } from "firebase/database";

const cleanForFirebase = (obj: any) => {
  return JSON.parse(JSON.stringify(obj, (key, value) => 
    value === undefined ? null : value
  ));
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [examPeriods, setExamPeriods] = useState<ExamPeriod[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!db) {
      console.warn("Realtime Database service is not available yet.");
      return;
    }

    const studentsRef = ref(db, 'students');
    const teachersRef = ref(db, 'teachers');
    const committeesRef = ref(db, 'committees');
    const examPeriodsRef = ref(db, 'examPeriods');

    const unsubStudents = onValue(studentsRef, (snapshot) => {
      const val = snapshot.val();
      setStudents(Array.isArray(val) ? val : []);
      setIsConnected(true);
    }, (err) => {
      console.warn("Realtime Database Sync Error:", err);
      setIsConnected(false);
    });

    const unsubTeachers = onValue(teachersRef, (snapshot) => {
      const val = snapshot.val();
      setTeachers(Array.isArray(val) ? val : []);
    });

    const unsubCommittees = onValue(committeesRef, (snapshot) => {
      const val = snapshot.val();
      setCommittees(Array.isArray(val) ? val : []);
    });

    const unsubExamPeriods = onValue(examPeriodsRef, (snapshot) => {
      const val = snapshot.val();
      setExamPeriods(Array.isArray(val) ? val : []);
    });

    return () => {
      off(studentsRef);
      off(teachersRef);
      off(committeesRef);
      off(examPeriodsRef);
    };
  }, []);

  const syncStudents = (newData: Student[] | ((prev: Student[]) => Student[])) => {
    const value = typeof newData === 'function' ? newData(students) : newData;
    setStudents(value);
    if (db) set(ref(db, 'students'), cleanForFirebase(value)).catch(e => console.error("Save Error:", e));
  };

  const syncTeachers = (newData: Teacher[] | ((prev: Teacher[]) => Teacher[])) => {
    const value = typeof newData === 'function' ? newData(teachers) : newData;
    setTeachers(value);
    if (db) set(ref(db, 'teachers'), cleanForFirebase(value)).catch(e => console.error("Save Error:", e));
  };

  const syncCommittees = (newData: Committee[] | ((prev: Committee[]) => Committee[])) => {
    const value = typeof newData === 'function' ? newData(committees) : newData;
    setCommittees(value);
    if (db) set(ref(db, 'committees'), cleanForFirebase(value)).catch(e => console.error("Save Error:", e));
  };

  const syncExamPeriods = (newData: ExamPeriod[] | ((prev: ExamPeriod[]) => ExamPeriod[])) => {
    const value = typeof newData === 'function' ? newData(examPeriods) : newData;
    setExamPeriods(value);
    if (db) set(ref(db, 'examPeriods'), cleanForFirebase(value)).catch(e => console.error("Save Error:", e));
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard students={students} committees={committees} teachers={teachers} attendanceLogs={attendanceLogs} />;
      case 'students': return <StudentsManagement students={students} setStudents={syncStudents} />;
      case 'committees': return <CommitteesManagement students={students} committees={committees} setCommittees={syncCommittees} setStudents={syncStudents} />;
      case 'schedule': return <ExamScheduleManager examPeriods={examPeriods} setExamPeriods={syncExamPeriods} students={students} />;
      case 'teachers': return <TeachersManagement teachers={teachers} setTeachers={syncTeachers} committees={committees} setCommittees={syncCommittees} />;
      case 'live': return <LiveExamView committees={committees} students={students} setStudents={syncStudents} attendanceLogs={attendanceLogs} setAttendanceLogs={setAttendanceLogs} teachers={teachers} />;
      case 'printing': return <PrintingCenter committees={committees} students={students} teachers={teachers} />;
      default: return <Dashboard students={students} committees={committees} teachers={teachers} attendanceLogs={attendanceLogs} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      <aside className="w-64 bg-slate-900 text-white flex-shrink-0 flex flex-col no-print border-l border-slate-800 shadow-2xl">
        <div className="p-8 flex items-center gap-3">
          <div className="bg-indigo-500 p-2.5 rounded-2xl shadow-lg shadow-indigo-500/20">
            <LayoutGrid size={24} />
          </div>
          <h1 className="text-xl font-black tracking-tighter">كنترول بلس</h1>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={20} />} label="لوحة التحكم" />
          <NavItem active={activeTab === 'students'} onClick={() => setActiveTab('students')} icon={<Users size={20} />} label="إدارة الطلاب" />
          <NavItem active={activeTab === 'committees'} onClick={() => setActiveTab('committees')} icon={<LayoutGrid size={20} />} label="اللجان والتوزيع" />
          <NavItem active={activeTab === 'schedule'} onClick={() => setActiveTab('schedule')} icon={<Calendar size={20} />} label="جدول الاختبارات" />
          <NavItem active={activeTab === 'teachers'} onClick={() => setActiveTab('teachers')} icon={<UserSquare2 size={20} />} label="الملاحظين" />
          <NavItem active={activeTab === 'live'} onClick={() => setActiveTab('live')} icon={<ClipboardCheck size={20} />} label="العمليات الحية (QR)" />
          <NavItem active={activeTab === 'printing'} onClick={() => setActiveTab('printing')} icon={<Printer size={20} />} label="مركز الطباعة" />
        </nav>

        <div className="p-6 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isConnected ? <Cloud className="text-emerald-400" size={16} /> : <CloudOff className="text-red-400" size={16} />}
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{isConnected ? 'Cloud Active' : 'Offline Mode'}</span>
          </div>
          <span className="text-[10px] text-slate-600 font-black">V 3.9</span>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-10 sticky top-0 z-10 no-print">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
             <div className="text-sm font-bold text-slate-400">نظام الإدارة الموحد - إدارة الكنترول</div>
          </div>
          {!db && (
            <div className="mx-4 px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-lg border border-red-200 animate-pulse">
              خطأ في الربط السحابي: الخدمة غير متاحة
            </div>
          )}
          <div className="flex items-center gap-6">
            <button className="relative p-2.5 text-slate-400 hover:bg-slate-100 rounded-xl transition-all">
              <Bell size={22} />
              <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-3">
              <div className="text-left">
                <div className="text-[10px] font-black text-slate-400 text-right uppercase">Welcome</div>
                <div className="text-xs font-bold text-slate-800">أدمن النظام</div>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-100">A</div>
            </div>
          </div>
        </header>

        <div className="p-10 pb-16 max-w-[1600px] mx-auto w-full">
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
      active ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`}
  >
    {icon}
    <span className="font-black text-sm">{label}</span>
  </button>
);

export default App;