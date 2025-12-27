
import React, { useState, useMemo } from 'react';
import { Calendar, Clock, BookOpen, Trash2, Plus, CheckCircle2, Save, AlertCircle, Check, X, RefreshCw, Link2, Info } from 'lucide-react';
import { ExamPeriod, Student, GradeExamConfig } from '../types';
import { generateId } from '../utils';

interface ExamScheduleManagerProps {
  examPeriods: ExamPeriod[];
  setExamPeriods: (newData: ExamPeriod[] | ((prev: ExamPeriod[]) => ExamPeriod[])) => void;
  students: Student[];
}

const ExamScheduleManager: React.FC<ExamScheduleManagerProps> = ({ examPeriods, setExamPeriods, students }) => {
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isSyncingTimes, setIsSyncingTimes] = useState(true);

  // استخراج الصفوف الدراسية المتاحة
  const allGrades = useMemo(() => {
    const grades = Array.from(new Set(students.map(s => s.grade))).sort();
    return grades.length > 0 ? grades : ['أول ثانوي', 'ثاني ثانوي', 'ثالث ثانوي'];
  }, [students]);

  const generateDefaultSchedule = (start: string) => {
    const newSchedule: ExamPeriod[] = [];
    const date = new Date(start);
    
    for (let i = 0; i < 7; i++) {
      const current = new Date(date);
      current.setDate(date.getDate() + i);
      
      // تخطي الجمعة والسبت
      if (current.getDay() === 5 || current.getDay() === 6) continue;
      
      const dayName = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][current.getDay()];
      const dateStr = current.toISOString().split('T')[0];

      ['الفترة الأولى', 'الفترة الثانية'].forEach((periodName, idx) => {
        newSchedule.push({
          id: generateId(),
          date: dateStr,
          dayName: dayName,
          periodName: periodName as any,
          isActive: idx === 0,
          gradeConfigs: Object.fromEntries(allGrades.map(g => [g, { 
            subject: '', 
            startTime: idx === 0 ? '07:30' : '10:30', 
            endTime: idx === 0 ? '10:00' : '12:30' 
          }]))
        });
      });
    }
    setExamPeriods(newSchedule);
  };

  /**
   * تحديث إعدادات الصف (المادة أو الوقت)
   * يضمن فصل كل مرحلة عن الأخرى، مع خيار مزامنة نفس المرحلة عبر الأيام
   */
  const updateGradeConfig = (periodId: string, grade: string, field: keyof GradeExamConfig, value: string) => {
    setExamPeriods(prev => {
      const targetPeriod = prev.find(p => p.id === periodId);
      if (!targetPeriod) return prev;

      const isTimeField = field === 'startTime' || field === 'endTime';

      return prev.map(p => {
        // تحديث السطر الحالي (اللجنة الحالية في اليوم الحالي)
        if (p.id === periodId) {
          return {
            ...p,
            gradeConfigs: {
              ...p.gradeConfigs,
              [grade]: { ...p.gradeConfigs[grade], [field]: value }
            }
          };
        }

        // مزامنة ذكية: إذا كان التعديل في الوقت وميزة المزامنة مفعلة
        // يتم تحديث نفس الصف [grade] في نفس الفترة [periodName] في جميع الأيام الأخرى
        if (isSyncingTimes && isTimeField && p.periodName === targetPeriod.periodName) {
          return {
            ...p,
            gradeConfigs: {
              ...p.gradeConfigs,
              [grade]: { ...p.gradeConfigs[grade], [field]: value }
            }
          };
        }

        return p;
      });
    });
  };

  const togglePeriodActive = (id: string) => {
    setExamPeriods(prev => prev.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800">إدارة جدول الاختبارات والمدد</h2>
          <p className="text-slate-500 font-medium">تخصيص أوقات مستقلة لكل مرحلة (تعديل مرحلة لا يؤثر على الأخرى)</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <button 
            onClick={() => setIsSyncingTimes(!isSyncingTimes)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black transition-all border-2 ${
              isSyncingTimes ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            {isSyncingTimes ? <Link2 size={16}/> : <RefreshCw size={16}/>}
            {isSyncingTimes ? 'مزامنة أوقات الصف (عبر الأيام) مفعلة' : 'تعديل الأوقات يدوياً لكل يوم'}
          </button>

          <div className="bg-white p-4 rounded-[1.5rem] border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="flex flex-col text-right">
              <span className="text-[10px] font-black text-slate-400 uppercase mb-1">تاريخ البداية</span>
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-slate-50 border-none rounded-lg px-3 py-1 text-sm font-bold text-slate-700 outline-none"
              />
            </div>
            <button 
              onClick={() => { if(confirm('⚠️ سيتم استبدال الجدول الحالي بجدول جديد. هل تود المتابعة؟')) generateDefaultSchedule(startDate); }}
              className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
              title="توليد جدول افتراضي"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>
      </div>

      {examPeriods.length === 0 ? (
        <div className="bg-white p-24 rounded-[3rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-4">
          <Calendar size={80} className="text-slate-100" strokeWidth={1} />
          <div className="space-y-1">
             <p className="text-slate-400 font-black text-xl">لم يتم إعداد جدول الاختبارات</p>
             <p className="text-slate-400 text-sm">حدد تاريخ البداية من الأعلى لإنشاء الهيكل الأساسي للجدول.</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest">
                  <th className="p-4 border border-slate-800 w-24">اليوم</th>
                  <th className="p-4 border border-slate-800 w-32">التاريخ</th>
                  <th className="p-4 border border-slate-800 w-36">الفترة</th>
                  {allGrades.map(grade => (
                    <th key={grade} colSpan={2} className="p-4 border border-slate-800 border-x-2 bg-slate-800/80">{grade}</th>
                  ))}
                  <th className="p-4 border border-slate-800 w-20">الحالة</th>
                </tr>
                <tr className="bg-slate-100 text-slate-400 text-[9px] font-black">
                  <th className="p-2 border border-slate-200"></th>
                  <th className="p-2 border border-slate-200"></th>
                  <th className="p-2 border border-slate-200"></th>
                  {allGrades.map(grade => (
                    <React.Fragment key={`${grade}-sub`}>
                      <th className="p-2 border border-slate-200">المادة</th>
                      <th className="p-2 border border-slate-200">الزمن</th>
                    </React.Fragment>
                  ))}
                  <th className="p-2 border border-slate-200"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {examPeriods.map((period, index) => {
                  const isFirstOfDate = index === 0 || examPeriods[index - 1].date !== period.date;
                  const daySpan = examPeriods.filter(p => p.date === period.date).length;

                  return (
                    <tr key={period.id} className={`transition-all ${!period.isActive ? 'bg-slate-50/50 opacity-40 grayscale' : 'hover:bg-indigo-50/10'}`}>
                      {isFirstOfDate && (
                        <>
                          <td rowSpan={daySpan} className="p-4 border border-slate-200 font-black text-slate-700 bg-slate-50/30 align-middle">
                            {period.dayName}
                          </td>
                          <td rowSpan={daySpan} className="p-4 border border-slate-200 text-xs font-bold text-slate-400 bg-slate-50/30 align-middle">
                            {period.date}
                          </td>
                        </>
                      )}
                      <td className={`p-4 border border-slate-200 text-xs font-black ${period.periodName === 'الفترة الأولى' ? 'text-indigo-600' : 'text-amber-600'}`}>
                        {period.periodName}
                      </td>

                      {allGrades.map(grade => {
                        const config = period.gradeConfigs[grade] || { subject: '', startTime: '', endTime: '' };
                        return (
                          <React.Fragment key={`${period.id}-${grade}`}>
                            <td className="p-3 border border-slate-200 min-w-[150px]">
                              <input 
                                type="text"
                                placeholder="---"
                                value={config.subject}
                                onChange={(e) => updateGradeConfig(period.id, grade, 'subject', e.target.value)}
                                className="w-full bg-transparent text-center text-xs font-bold p-1 outline-none border-b border-transparent focus:border-indigo-400 text-slate-700"
                              />
                            </td>
                            <td className="p-3 border border-slate-200 bg-slate-50/20 w-40">
                              <div className="flex flex-col gap-2 items-center">
                                <div className="flex items-center gap-2 group">
                                  <Clock size={12} className="text-slate-300 group-hover:text-indigo-400 transition-colors"/>
                                  <input 
                                    type="time" 
                                    value={config.startTime} 
                                    onChange={(e) => updateGradeConfig(period.id, grade, 'startTime', e.target.value)}
                                    className="bg-transparent text-[10px] font-black text-slate-500 outline-none border-none p-0 w-16"
                                  />
                                  <span className="text-[9px] font-bold text-slate-300">ص</span>
                                </div>
                                <div className="flex items-center gap-2 group">
                                  <div className="w-3 h-[2px] bg-slate-100"></div>
                                  <input 
                                    type="time" 
                                    value={config.endTime} 
                                    onChange={(e) => updateGradeConfig(period.id, grade, 'endTime', e.target.value)}
                                    className="bg-transparent text-[10px] font-black text-slate-500 outline-none border-none p-0 w-16"
                                  />
                                  <span className="text-[9px] font-bold text-slate-300">ص</span>
                                </div>
                              </div>
                            </td>
                          </React.Fragment>
                        );
                      })}

                      <td className="p-4 border border-slate-200">
                        <button 
                          onClick={() => togglePeriodActive(period.id)}
                          className={`p-2.5 rounded-xl transition-all ${period.isActive ? 'text-emerald-500 bg-emerald-50 shadow-inner' : 'text-slate-200 bg-slate-50'}`}
                          title={period.isActive ? "تعطيل الفترة" : "تفعيل الفترة"}
                        >
                          {period.isActive ? <Check size={18} strokeWidth={3}/> : <X size={18}/>}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-10 bg-slate-50/50 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-start gap-4 bg-white p-6 rounded-2xl border border-slate-200 text-slate-500 max-w-2xl shadow-sm">
              <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600"><Info size={24}/></div>
              <div className="text-[11px] font-bold leading-relaxed">
                <span className="text-indigo-600 block mb-1 text-sm font-black underline decoration-indigo-100 decoration-4 underline-offset-4">نظام التوقيت المستقل:</span>
                لقد قمنا بفصل أوقات كل مرحلة تماماً. تعديل وقت "أول ثانوي" لن يؤثر على "ثالث ثانوي". ميزة المزامنة تقوم فقط بتحديث نفس المرحلة عبر الأيام المختلفة لتوفير وقتك.
              </div>
            </div>
            <button className="flex items-center gap-3 px-14 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black shadow-2xl hover:bg-black hover:scale-[1.02] active:scale-95 transition-all text-lg">
              <Save size={24} />
              حفظ واعتماد الجدول نهائياً
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamScheduleManager;
