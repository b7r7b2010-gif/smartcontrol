
import React from 'react';
import { Users, LayoutGrid, UserSquare2, ClipboardCheck, TrendingUp, AlertTriangle } from 'lucide-react';
import { Student, Committee, Teacher, AttendanceLog } from '../types';

interface DashboardProps {
  students: Student[];
  committees: Committee[];
  teachers: Teacher[];
  attendanceLogs: AttendanceLog[];
}

const Dashboard: React.FC<DashboardProps> = ({ students, committees, teachers, attendanceLogs }) => {
  const presentCount = attendanceLogs.filter(l => l.status === 'present').length;
  const absentCount = students.length - presentCount;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">نظرة عامة على الاختبارات</h2>
          <p className="text-slate-500 mt-1">إحصائيات فورية وتحديثات من اللجان والسحابة</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200 text-sm font-medium text-slate-600">
          تاريخ اليوم: {new Date().toLocaleDateString('ar-SA')}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="إجمالي الطلاب" value={students.length} icon={<Users className="text-blue-500" />} trend="+3%" color="blue" />
        <StatCard title="اللجان المنشأة" value={committees.length} icon={<LayoutGrid className="text-emerald-500" />} trend="مكتمل" color="emerald" />
        <StatCard title="الملاحظين" value={teachers.length} icon={<UserSquare2 className="text-indigo-500" />} trend="جاهز" color="indigo" />
        <StatCard title="حضور اليوم" value={`${presentCount} / ${students.length}`} icon={<ClipboardCheck className="text-orange-500" />} trend="جارٍ التحديث" color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg text-slate-800">توزيع الطلاب باللجان</h3>
            <button className="text-indigo-600 text-sm font-semibold hover:underline">عرض التفاصيل</button>
          </div>
          <div className="space-y-4">
            {committees.map((committee) => (
              <div key={committee.id} className="group flex items-center gap-4">
                <div className="w-24 text-sm text-slate-500 font-medium truncate">{committee.name}</div>
                <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                  <div 
                    className="h-full bg-indigo-500 transition-all duration-1000 group-hover:bg-indigo-600" 
                    style={{ width: `${(committee.studentIds.length / committee.capacity) * 100}%` }}
                  ></div>
                </div>
                <div className="w-24 text-right text-sm font-bold text-slate-700">
                  {committee.studentIds.length} / {committee.capacity}
                </div>
              </div>
            ))}
            {committees.length === 0 && <p className="text-center text-slate-400 py-10">لم يتم إنشاء لجان بعد</p>}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-center gap-2">
            <AlertTriangle className="text-red-500" size={20} />
            التنبيهات العاجلة
          </h3>
          <div className="space-y-4">
            {attendanceLogs.filter(l => l.status === 'absent').slice(0, 5).map((log, i) => (
              <div key={i} className="p-4 bg-red-50 rounded-xl border border-red-100 flex items-start gap-3">
                <div className="w-8 h-8 bg-red-500 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs">!</div>
                <div>
                  <div className="text-sm font-bold text-red-900">غياب: {students.find(s => s.id === log.studentId)?.name}</div>
                  <div className="text-xs text-red-700 mt-1">تم إرسال إشعار فوري لولي الأمر عبر SMS</div>
                </div>
              </div>
            ))}
            {attendanceLogs.filter(l => l.status === 'absent').length === 0 && (
              <div className="text-center py-8 text-slate-400">لا يوجد غيابات مسجلة حالياً</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; trend: string; color: string }> = ({ title, value, icon, trend, color }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl bg-${color}-50`}>{icon}</div>
      <div className={`text-xs font-bold px-2 py-1 rounded-full bg-${color}-50 text-${color}-600 border border-${color}-100`}>
        {trend}
      </div>
    </div>
    <div className="text-3xl font-black text-slate-800">{value}</div>
    <div className="text-sm text-slate-500 mt-1 font-medium">{title}</div>
  </div>
);

export default Dashboard;
