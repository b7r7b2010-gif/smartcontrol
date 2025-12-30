import React, { useMemo } from 'react';
import { Users, AlertTriangle, TrendingUp, ShieldAlert, Activity, Bell, MapPin, Search } from 'lucide-react';
import { Student, Committee, AttendanceLog, Teacher } from '../types';

interface DashboardProps {
  students: Student[];
  committees: Committee[];
  teachers: Teacher[];
  attendanceLogs: AttendanceLog[];
}

const Dashboard: React.FC<DashboardProps> = ({ students, committees, attendanceLogs }) => {
  const stats = useMemo(() => {
    const present = students.filter(s => s.status === 'present').length;
    const absent = students.filter(s => s.status === 'absent').length;
    const percentage = students.length > 0 ? (present / students.length) * 100 : 0;
    return { present, absent, percentage };
  }, [students]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
             <Activity size={24} />
           </div>
           <div>
             <h2 className="text-2xl font-black text-slate-800">مركز المراقبة اللحظي</h2>
             <p className="text-slate-500 font-bold text-sm">عرض مباشر للإدارة، المرشد الطلابي، ومدير المدرسة</p>
           </div>
        </div>
        <div className="flex gap-4">
           <div className="px-6 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm text-xs font-black text-slate-500 flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
             بث مباشر من اللجان
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* العبوات الرئيسية للإحصاء */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="bg-slate-900 p-8 rounded-[3rem] text-white relative overflow-hidden group shadow-2xl">
              <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform">
                <Users size={120} />
              </div>
              <div className="relative z-10">
                <div className="text-5xl font-black mb-2">{stats.present}</div>
                <div className="text-sm font-black text-emerald-400 uppercase tracking-widest">إجمالي الحضور الآن</div>
                <div className="mt-6 h-2 bg-white/10 rounded-full overflow-hidden">
                   <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${stats.percentage}%` }}></div>
                </div>
              </div>
           </div>

           <div className="bg-red-600 p-8 rounded-[3rem] text-white relative overflow-hidden group shadow-2xl shadow-red-500/20">
              <div className="absolute top-0 right-0 p-10 opacity-20 group-hover:rotate-12 transition-transform">
                <ShieldAlert size={120} />
              </div>
              <div className="relative z-10">
                <div className="text-5xl font-black mb-2">{stats.absent}</div>
                <div className="text-sm font-black text-white/80 uppercase tracking-widest">طلاب غائبون (تحت المتابعة)</div>
                <button className="mt-6 px-6 py-2 bg-white/20 rounded-full text-[10px] font-black backdrop-blur-md border border-white/30 hover:bg-white/30">
                  عرض كشف الغياب الموحد
                </button>
              </div>
           </div>
        </div>

        {/* تنبيهات المرشد الطلابي اللحظية */}
        <div className="bg-white rounded-[3rem] border border-slate-200 p-8 shadow-sm">
           <div className="flex items-center justify-between mb-8">
              <h3 className="font-black text-slate-800 flex items-center gap-2 text-lg">
                <Bell className="text-amber-500 animate-alert" size={22} />
                تنبيهات الغياب
              </h3>
              <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-3 py-1 rounded-full uppercase">Realtime Feed</span>
           </div>
           
           <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {attendanceLogs.filter(l => l.status === 'absent').map((log, i) => {
                const student = students.find(s => s.id === log.studentId);
                const committee = committees.find(c => c.id === log.committeeId);
                return (
                  <div key={i} className="p-5 bg-red-50 border border-red-100 rounded-[2rem] flex items-center gap-4 animate-in slide-in-from-right duration-500">
                    <div className="w-12 h-12 bg-red-500 rounded-2xl flex items-center justify-center text-white font-black shadow-lg">
                      {student?.name?.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-black text-red-900">{student?.name}</div>
                      <div className="text-[10px] font-bold text-red-600 flex items-center gap-1 mt-1">
                        <MapPin size={10}/> {committee?.name} - {committee?.roomName}
                      </div>
                    </div>
                    <div className="text-[9px] font-black text-red-400">{new Date(log.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                );
              })}
              {attendanceLogs.filter(l => l.status === 'absent').length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                   <div className="p-4 bg-slate-50 rounded-full mb-4"><Search size={32}/></div>
                   <p className="text-sm font-bold">لا توجد غيابات مسجلة حتى الآن</p>
                </div>
              )}
           </div>
        </div>
      </div>

      {/* شريط حالة اللجان الإبداعي */}
      <div className="bg-white rounded-[3rem] border border-slate-200 p-8 shadow-sm overflow-hidden relative">
         <h3 className="font-black text-slate-800 mb-8">تفاعلية اللجان الفورية</h3>
         <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {committees.map(c => {
              const cStudents = students.filter(s => s.committeeId === c.id);
              const absents = cStudents.filter(s => s.status === 'absent').length;
              const hasActivity = cStudents.length > 0;
              
              return (
                <div key={c.id} className={`p-5 rounded-[2.5rem] border-2 transition-all ${absents > 0 ? 'border-red-500 bg-red-50/20' : hasActivity ? 'border-emerald-500 bg-emerald-50/20' : 'border-slate-50 bg-slate-50/30'}`}>
                   <div className="text-[10px] font-black text-slate-400 mb-1">{c.name}</div>
                   <div className="text-xl font-black text-slate-800">{c.roomName}</div>
                   <div className="flex items-center gap-2 mt-3">
                      <div className={`w-2 h-2 rounded-full ${absents > 0 ? 'bg-red-500 animate-pulse' : hasActivity ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                      <span className="text-[9px] font-black text-slate-500">{absents > 0 ? `غائب: ${absents}` : hasActivity ? 'منتظمة' : 'لم تبدأ'}</span>
                   </div>
                </div>
              );
            })}
         </div>
      </div>
    </div>
  );
};

export default Dashboard;