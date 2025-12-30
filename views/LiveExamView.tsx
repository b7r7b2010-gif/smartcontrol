
import React, { useState, useEffect } from 'react';
// Added RefreshCw to the list of icons imported from lucide-react
import { QrCode, ClipboardCheck, ScanLine, UserCheck, XCircle, AlertCircle, Clock, ShieldCheck, RefreshCw } from 'lucide-react';
import { Committee, Student, AttendanceLog } from '../types';
import { supabase } from '../lib/supabase';

interface LiveExamViewProps {
  committees: Committee[];
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  attendanceLogs: AttendanceLog[];
  setAttendanceLogs: React.Dispatch<React.SetStateAction<AttendanceLog[]>>;
}

const LiveExamView: React.FC<LiveExamViewProps> = ({ committees, students, setStudents, attendanceLogs, setAttendanceLogs }) => {
  const [activeCommittee, setActiveCommittee] = useState<Committee | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // الطلاب التابعين للجنة النشطة (افتراضياً حاضرين)
  const committeeStudents = activeCommittee 
    ? students.filter(s => s.committeeId === activeCommittee.id)
    : [];

  const handleScan = () => {
    setIsScanning(true);
    // محاكاة مسح QR اللجنة
    setTimeout(() => {
      const target = committees[0]; // في الواقع نأخذ القيمة من الماسح
      if (target) {
        setActiveCommittee(target);
        setIsScanning(false);
      }
    }, 1500);
  };

  const markAttendance = async (studentId: string, status: 'present' | 'absent') => {
    // تحديث الحالة محلياً وفورياً
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, status } : s));
    
    // تسجيل اللوج في Supabase لإظهاره في شاشة المدير
    const log: AttendanceLog = {
      studentId,
      committeeId: activeCommittee?.id || '',
      timestamp: new Date().toISOString(),
      status,
      notified: status === 'absent'
    };

    const { error } = await supabase.from('attendance_logs').insert([log]);
    if (error) console.error("Error logging attendance:", error);
    
    if (status === 'absent') {
      setAttendanceLogs(prev => [log, ...prev]);
    }
  };

  if (!activeCommittee) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in">
        <div className="w-32 h-32 bg-indigo-500/10 rounded-[2.5rem] flex items-center justify-center text-indigo-500 border border-indigo-500/20 shadow-2xl">
          <ScanLine size={64} />
        </div>
        <div className="max-w-md">
          <h2 className="text-3xl font-black text-slate-800 mb-4">واجهة الملاحظ الذكية</h2>
          <p className="text-slate-500 font-medium">يرجى مسح رمز QR الموجود على باب اللجنة أو المظروف لبدء تحضير الطلاب في الوقت الفعلي.</p>
        </div>
        <button 
          onClick={handleScan}
          disabled={isScanning}
          className="flex items-center gap-4 px-12 py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-xl shadow-2xl hover:scale-105 transition-all disabled:opacity-50"
        >
          {isScanning ? <RefreshCw className="animate-spin"/> : <QrCode size={24} />}
          {isScanning ? 'جاري التعرف...' : 'فتح كاميرا الفحص'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
           <div className="p-5 bg-emerald-50 text-emerald-600 rounded-3xl border border-emerald-100">
             <ShieldCheck size={32} />
           </div>
           <div>
              <h3 className="text-2xl font-black text-slate-800">{activeCommittee.name} - {activeCommittee.roomName}</h3>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs font-black text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 uppercase tracking-widest">Live Session</span>
                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Clock size={12}/> {new Date().toLocaleTimeString('ar-SA')}</span>
              </div>
           </div>
        </div>
        <div className="flex gap-4">
           <div className="text-center px-6 border-l border-slate-100">
              <div className="text-[10px] font-black text-slate-400 uppercase">الحاضرون</div>
              <div className="text-2xl font-black text-emerald-600">{committeeStudents.filter(s => s.status === 'present').length}</div>
           </div>
           <div className="text-center px-6">
              <div className="text-[10px] font-black text-slate-400 uppercase">الغائبون</div>
              <div className="text-2xl font-black text-red-500">{committeeStudents.filter(s => s.status === 'absent').length}</div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {committeeStudents.map((student) => (
          <div 
            key={student.id} 
            className={`p-6 rounded-[2rem] border transition-all duration-300 flex flex-col justify-between h-48 bg-white ${
              student.status === 'absent' ? 'border-red-200 bg-red-50/30' : 'border-emerald-100 shadow-sm'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-black text-slate-800 text-lg leading-tight">{student.name}</h4>
                <p className="text-xs font-bold text-slate-400 mt-1">{student.grade} - فصل {student.section}</p>
              </div>
              <div className={`w-3 h-3 rounded-full ${student.status === 'absent' ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></div>
            </div>
            
            <div className="flex gap-3 mt-4">
               <button 
                onClick={() => markAttendance(student.id, 'present')}
                className={`flex-1 py-3 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 ${
                  student.status === 'present' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'
                }`}
               >
                 <UserCheck size={14}/> حاضر
               </button>
               <button 
                onClick={() => markAttendance(student.id, 'absent')}
                className={`flex-1 py-3 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 ${
                  student.status === 'absent' ? 'bg-red-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'
                }`}
               >
                 <XCircle size={14}/> غائب
               </button>
            </div>
          </div>
        ))}
      </div>

      <button onClick={() => setActiveCommittee(null)} className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xl hover:bg-black transition-all flex items-center justify-center gap-3">
        <ClipboardCheck size={24}/> إنهاء تحضير اللجنة
      </button>
    </div>
  );
};

export default LiveExamView;
