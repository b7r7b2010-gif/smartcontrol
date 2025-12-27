
import React, { useState, useMemo } from 'react';
import { Calendar, Clock, BookOpen, Trash2, Plus, CheckCircle2, Save, AlertCircle, Check, X } from 'lucide-react';
import { ExamPeriod, Student } from '../types';
import { generateId } from '../utils';

interface ExamScheduleManagerProps {
  examPeriods: ExamPeriod[];
  setExamPeriods: (newData: ExamPeriod[] | ((prev: ExamPeriod[]) => ExamPeriod[])) => void;
  students: Student[];
}

const ExamScheduleManager: React.FC<ExamScheduleManagerProps> = ({ examPeriods, setExamPeriods, students }) => {
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // استخراج الصفوف الدراسية المتاحة (مثل أول ثانوي، ثاني ثانوي...)
  const allGrades = useMemo(() => {
    const grades = Array.from(new Set(students.map(s => s.grade))).sort();
    return grades.length > 0 ? grades : ['أول ثانوي', 'ثاني ثانوي', 'ثالث ثانوي'];
  }, [students]);

  const generateDefaultSchedule = (start: string) => {
    const newSchedule: ExamPeriod[] = [];
    const date = new Date(start);
    const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
    
    // توليد 5 أيام عمل (أسبوع اختبارات افتراضي)
    for (let i = 0; i < 7; i++) {
      const current = new Date(date);
      current.setDate(date.getDate() + i);
      
      // تخطي الجمعة والسبت
      if (current.getDay() === 5 || current.getDay() === 6) continue;
      
      const dayName = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][current.getDay()];
      const dateStr = current.toISOString().split('T')[0];

      // الفترة الأولى
      newSchedule.push({
        id: generateId(),
        date: dateStr,
        dayName: dayName,
        periodName: 'الفترة الأولى',
        startTime: '07:30',
        endTime: '10:00',
        isActive: true,
        subjects: Object.fromEntries(allGrades.map(g => [g, '']))
      });

      // الفترة الثانية
      newSchedule.push({
        id: generateId(),
        date: dateStr,
        dayName: dayName,
        periodName: 'الفترة الثانية',
        startTime: '10:30',
        endTime: '12:30',
        isActive: true,
        subjects: Object.fromEntries(allGrades.map(g => [g, '']))
      });
    }
    setExamPeriods(newSchedule);
  };

  const togglePeriodActive = (id: string) => {
    setExamPeriods(prev => prev.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p));
  };

  const updatePeriodField = (id: string, field: keyof ExamPeriod, value: any) => {
    setExamPeriods(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const updateSubject = (periodId: string, grade: string, subject: string) => {
    setExamPeriods(prev => prev.map(p => {
      if (p.id === periodId) {
        return { ...p, subjects: { ...p.subjects, [grade]: subject } };
      }
      return p;
    }));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header & Date Wizard */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800">إدارة جدول الاختبارات والمواد</h2>
          <p className="text-slate-500 font-medium">توزيع المواد على الفترات والصفوف الدراسية لربط الملاحظين</p>
        </div>
        
        <div className="bg-white p-6 rounded-[2rem] border-2 border-slate-50 shadow-sm flex flex-col md:flex-row items-center gap-6">
          <div className="flex flex-col">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">تاريخ بداية الاختبارات</label>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400" size={16} />
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-slate-50 border border-slate-100 rounded-xl pr-10 pl-4 py-2 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                />
              </div>
              <button 
                onClick={() => { if(confirm('⚠️ هذا سيقوم بمسح الجدول الحالي وتوليد جدول افتراضي جديد. هل تود المتابعة؟')) generateDefaultSchedule(startDate); }}
                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl font-black text-sm shadow-xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all"
              >
                توليد الجدول الافتراضي
              </button>
            </div>
          </div>
        </div>
      </div>

      {examPeriods.length === 0 ? (
        <div className="bg-white p-20 rounded-[3rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-4">
          <div className="p-8 bg-slate-50 rounded-full text-slate-300">
            <Calendar size={64} strokeWidth={1} />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black text-slate-400">لا يوجد جدول اختبارات منشأ</h3>
            <p className="text-slate-400 max-w-xs mx-auto">حدد تاريخ البداية أعلاه واضغط على زر "توليد الجدول" للبدء سريعاً.</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse">
              <thead>
                <tr className="bg-slate-800 text-white text-[12px] font-black uppercase tracking-widest">
                  <th className="p-4 border border-slate-700">اليوم</th>
                  <th className="p-4 border border-slate-700">التاريخ</th>
                  <th className="p-4 border border-slate-700">الفترة</th>
                  {allGrades.map(grade => (
                    <th key={grade} colSpan={2} className="p-4 border border-slate-700 border-r-2">{grade}</th>
                  ))}
                  <th className="p-4 border border-slate-700">الحالة</th>
                </tr>
                <tr className="bg-slate-100 text-[10px] font-black text-slate-500">
                  <th className="p-2 border border-slate-200"></th>
                  <th className="p-2 border border-slate-200"></th>
                  <th className="p-2 border border-slate-200"></th>
                  {allGrades.map(grade => (
                    <React.Fragment key={`${grade}-sub`}>
                      <th className="p-2 border border-slate-200 border-r-2">المادة</th>
                      <th className="p-2 border border-slate-200">الزمن</th>
                    </React.Fragment>
                  ))}
                  <th className="p-2 border border-slate-200"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {examPeriods.map((period, index) => {
                  const isFirstPeriodOfDay = index === 0 || examPeriods[index - 1].date !== period.date;
                  const dayPeriods = examPeriods.filter(p => p.date === period.date);
                  const rowSpan = dayPeriods.length;

                  return (
                    <tr key={period.id} className={`transition-all ${!period.isActive ? 'bg-slate-100/50 opacity-50 grayscale' : 'hover:bg-indigo-50/20'}`}>
                      {isFirstPeriodOfDay && (
                        <>
                          <td rowSpan={rowSpan} className="p-4 border border-slate-200 font-black text-slate-700 align-middle bg-slate-50/30">
                            {period.dayName}
                          </td>
                          <td rowSpan={rowSpan} className="p-4 border border-slate-200 font-bold text-slate-500 text-xs align-middle bg-slate-50/30">
                            {period.date}
                          </td>
                        </>
                      )}
                      <td className={`p-4 border border-slate-200 font-black text-xs ${period.periodName === 'الفترة الأولى' ? 'text-indigo-600' : 'text-amber-600'}`}>
                        {period.periodName}
                      </td>
                      
                      {allGrades.map(grade => (
                        <React.Fragment key={`${period.id}-${grade}`}>
                          <td className="p-2 border border-slate-200 border-r-2">
                            <input 
                              type="text"
                              value={period.subjects[grade] || ''}
                              onChange={(e) => updateSubject(period.id, grade, e.target.value)}
                              placeholder="---"
                              className="w-full text-center p-2 text-xs font-bold bg-transparent border-b border-transparent focus:border-indigo-500 outline-none transition-all"
                            />
                          </td>
                          <td className="p-2 border border-slate-200">
                            <div className="flex flex-col items-center gap-1">
                               <input 
                                type="time" 
                                value={period.startTime} 
                                onChange={(e) => updatePeriodField(period.id, 'startTime', e.target.value)}
                                className="text-[9px] font-black text-slate-400 bg-transparent border-none outline-none text-center"
                               />
                               <input 
                                type="time" 
                                value={period.endTime} 
                                onChange={(e) => updatePeriodField(period.id, 'endTime', e.target.value)}
                                className="text-[9px] font-black text-slate-400 bg-transparent border-none outline-none text-center"
                               />
                            </div>
                          </td>
                        </React.Fragment>
                      ))}

                      <td className="p-4 border border-slate-200">
                        <button 
                          onClick={() => togglePeriodActive(period.id)}
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${period.isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}
                        >
                          {period.isActive ? <Check size={20} /> : <X size={20} />}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          <div className="p-10 bg-slate-50/50 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-slate-100">
            <div className="flex items-center gap-4 bg-amber-50 p-4 rounded-2xl border border-amber-100 text-amber-700">
               <AlertCircle size={24} />
               <div className="text-xs font-bold italic">
                 يرجى الانتباه: إلغاء تفعيل الفترة (رمز X) سيقوم بإخفائها تماماً من كشوف الملاحظين وواجهات QR للطلاب في هذا اليوم.
               </div>
            </div>
            <button className="flex items-center gap-3 px-10 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-2xl hover:bg-black hover:scale-105 active:scale-95 transition-all">
              <Save size={20} />
              حفظ واعتماد الجدول
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamScheduleManager;
