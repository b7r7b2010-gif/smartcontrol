
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  LayoutGrid, 
  UserSquare2, 
  CalendarDays, 
  Printer, 
  QrCode, 
  ClipboardCheck, 
  LayoutDashboard,
  Bell,
  Search,
  Cloud,
  CloudOff
} from 'lucide-react';
import { Student, Teacher, Committee, ExamDay, AttendanceLog } from './types';
import Dashboard from './views/Dashboard';
import StudentsManagement from './views/StudentsManagement';
import CommitteesManagement from './views/CommitteesManagement';
import TeachersManagement from './views/TeachersManagement';
import LiveExamView from './views/LiveExamView';
import PrintingCenter from './views/PrintingCenter';

// Firebase Imports
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyA-zjjTrXJdXIX0z4SjGFwlu09KTZAZGRk",
  authDomain: "samrtcontrol.firebaseapp.com",
  projectId: "samrtcontrol",
  storageBucket: "samrtcontrol.firebasestorage.app",
  messagingSenderId: "780118753476",
  appId: "1:780118753476:web:99061878f7909aa381c991"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // 1. مزامنة البيانات من Firebase عند التشغيل
  useEffect(() => {
    const studentsRef = ref(db, 'students');
    const teachersRef = ref(db, 'teachers');
    const committeesRef = ref(db, 'committees');

    const unsubStudents = onValue(studentsRef, (snapshot) => {
      setStudents(snapshot.val() || []);
      setIsConnected(true);
    });

    const unsubTeachers = onValue(teachersRef, (snapshot) => {
      setTeachers(snapshot.val() || []);
    });

    const unsubCommittees = onValue(committeesRef, (snapshot) => {
      setCommittees(snapshot.val() || []);
    });

    return () => {
      unsubStudents();
      unsubTeachers();
      unsubCommittees();
    };
  }, []);

  // 2. وظائف تحديث السحابة (سيتم تمريرها للمكونات)
  const syncStudents = (newData: Student[] | ((prev: Student[]) => Student[])) => {
    const value = typeof newData === 'function' ? newData(students) : newData;
    set(ref(db, 'students'), value);
  };

  const syncTeachers = (newData: Teacher[] | ((prev: Teacher[]) => Teacher[])) => {
    const value = typeof newData === 'function' ? newData(teachers) : newData;
    set(ref(db, 'teachers'), value);
  };

  const syncCommittees = (newData: Committee[] | ((prev: Committee[]) => Committee[])) => {
    const value = typeof newData === 'function' ? newData(committees) : newData;
    set(ref(db, 'committees'), value);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard students={students} committees={committees} teachers={teachers} attendanceLogs={attendanceLogs} />;
      case 'students': return <StudentsManagement students={students} setStudents={syncStudents} />;
      case 'committees': return <CommitteesManagement students={students} committees={committees} setCommittees={syncCommittees} setStudents={syncStudents} />;
      case 'teachers': return <TeachersManagement teachers={teachers} setTeachers={syncTeachers} committees={committees} setCommittees={syncCommittees} />;
      case 'live': return <LiveExamView committees={committees} students={students} setStudents={syncStudents} attendanceLogs={attendanceLogs} setAttendanceLogs={setAttendanceLogs} teachers={teachers} />;
      case 'printing': return <PrintingCenter committees={committees} students={students} teachers={teachers} />;
      default: return <Dashboard students={students} committees={committees} teachers={teachers} attendanceLogs={attendanceLogs} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex-shrink-0 flex flex-col no-print transition-all">
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
          <NavItem active={activeTab === 'teachers'} onClick={() => setActiveTab('teachers')} icon={<UserSquare2 size={20} />} label="الملاحظين" />
          <NavItem active={activeTab === 'live'} onClick={() => setActiveTab('live')} icon={<ClipboardCheck size={20} />} label="العمليات الحية (QR)" />
          <NavItem active={activeTab === 'printing'} onClick={() => setActiveTab('printing')} icon={<Printer size={20} />} label="مركز الطباعة" />
        </nav>

        <div className="p-6 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isConnected ? <Cloud className="text-emerald-400" size={16} /> : <CloudOff className="text-red-400" size={16} />}
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{isConnected ? 'Cloud Synced' : 'Offline'}</span>
          </div>
          <span className="text-[10px] text-slate-600 font-black">V 3.0</span>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-10 sticky top-0 z-10 no-print">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <div className="relative w-full">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="ابحث عن طالب، لجنة، أو ملاحظ..." 
                className="w-full pr-12 pl-4 py-3 bg-slate-100 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-medium"
              />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button className="relative p-2.5 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors">
              <Bell size={22} />
              <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-3 border-r pr-6 border-slate-100">
               <div className="text-left hidden md:block">
                  <div className="text-xs font-black text-slate-800">إدارة الكنترول</div>
                  <div className="text-[10px] font-bold text-emerald-500 uppercase">Administrator</div>
               </div>
               <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-200">
                A
              </div>
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
