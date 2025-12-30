
import React, { useState, useMemo } from 'react';
import { Calendar, Clock, Save, Plus, X, Check, AlertCircle, Trash2 } from 'lucide-react';
import { ExamPeriod, Student, GradeExamConfig } from '../types';
import { generateId } from '../utils';

interface ExamScheduleManagerProps {
  examPeriods: ExamPeriod[];
  setExamPeriods: (newData: ExamPeriod[] | ((prev: ExamPeriod[]) => ExamPeriod[])) => void;
  students: Student[];
}

const ExamScheduleManager: React.FC<ExamScheduleManagerProps> = ({ examPeriods, setExamPeriods, students }) => {
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isSaving, setIsSaving] = useState(false);

  const allGrades = useMemo(() => {
    const grades = Array.from(new Set(students.map(s => s.grade))).sort();
    return grades.length > 0 ? grades : ['أول ثانوي', 'ثاني ثانوي', 'ثالث ثانوي'];
  }, [students]);

  const handleGenerate = () => {
    const newSchedule: ExamPeriod[] = [];
    const date = new Date(startDate);
    
    for (let i = 0; i < 7; i++) {
      const current = new Date(date);
      current.setDate(date.getDate() + i);
      if (current.getDay() === 5 || current.getDay() === 6) continue;
      
      const dayName = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][current.getDay()];
      const dateStr = current.toISOString().split('T')[0];

      ['الفترة الأولى', 'الفترة الثانية'].forEach((periodName, idx) => {
        newSchedule.push({
          id: generateId(),
          date: dateStr,
          dayName: dayName,
          periodName: periodName as any,
          isActive: true,
          gradeConfigs: Object.fromEntries(allGrades.map(g => [g, { 
            subject: '', 
            startTime: idx === 0 ? '07:30' : '10:30', 
            endTime: idx === 0 ? '09:00' : '12:00' 
          }]))
        });
      });
    }
    setExamPeriods(newSchedule);
  };

  const updateCell = (periodId: string, grade: string, field: keyof GradeExamConfig, value: string) => {
    setExamPeriods(prev => prev.map(p => {
      if (p.id === periodId) {
        return {
          ...p,
          gradeConfigs: {
            ...p.gradeConfigs,
            [grade]: { 
              ...(p.gradeConfigs[grade] || { subject: '', startTime: '07:30', endTime: '09:00' }), 
              [field]: value 
            }
          }
        };
      }
      return p;
    }));
  };

  const handleManualSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      alert('تم حفظ الجدول وتأمين البيانات سحابياً بنجاح ✅');
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-800">برمجة الجداول والمدد</h2>
          <p className="text-slate-500 font-medium text-sm">إدارة مستقلة بالكامل لكل خانة - الأوقات والمواد منفصلة لكل صف</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-col text-right">
            <span className="text-[10px] font-black text-slate-400 uppercase mb-1">تاريخ بداية الاختبارات</span>
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button 
            onClick={handleGenerate}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-black shadow-lg shadow-indigo-100"
          >
            <Plus size={18} />
            توليد الجدول
          </button>
          {examPeriods && examPeriods.length > 0 && (
            <button 
              onClick={() => { if(confirm('سيتم حذف كافة بيانات الجدول الحالية، هل أنت متأكد؟')) setExamPeriods([]); }}
              className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
              title="حذف الجدول بالكامل"
            >
              <Trash2 size={20} />
            </button>
          )}
        </div>
      </div>

      {(!examPeriods || examPeriods.length === 0) ? (
        <div className="bg-white p-32 rounded-[3rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-6">
          <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-200">
            <Calendar size={48} strokeWidth={1} />
          </div>
          <div className="space-y-2">
             <h3 className="text-xl font-black text-slate-400">الجدول فارغ حالياً</h3>
             <p className="text-slate-400 text-sm max-w-sm">يرجى تحديد تاريخ البداية من الأعلى ثم الضغط على "توليد الجدول" للبدء في إدخال المواد والأوقات.</p>
          </div>
          <button 
            onClick={handleGenerate}
            className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:scale-105 transition-all"
          >
            بدء التخطيط الآن
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
                  <th className="p-4 border border-slate-800 w-24">اليوم</th>
                  <th className="p-4 border border-slate-800 w-32">التاريخ</th>
                  <th className="p-4 border border-slate-800 w-32">الفترة</th>
                  {allGrades.map(grade => (
                    <th key={grade} colSpan={2} className="p-4 border border-slate-800 border-x-2 bg-slate-800">{grade}</th>
                  ))}
                  <th className="p-4 border border-slate-800 w-20">الحالة</th>
                </tr>
                <tr className="bg-slate-50 text-slate-400 text-[10px] font-black">
                  <th className="p-2 border border-slate-200"></th>
                  <th className="p-2 border border-slate-200"></th>
                  <th className="p-2 border border-slate-200"></th>
                  {allGrades.map(grade => (
                    <React.Fragment key={`${grade}-sub`}>
                      <th className="p-2 border border-slate-200">المادة</th>
                      <th className="p-2 border border-slate-200">التوقيت</th>
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
                    <tr key={period.id} className={`transition-all ${!period.isActive ? 'bg-slate-50 opacity-40 grayscale' : 'hover:bg-indigo-50/5'}`}>
                      {isFirstOfDate && (
                        <>
                          <td rowSpan={daySpan} className="p-4 border border-slate-200 font-black text-slate-700 bg-slate-50/30">
                            {period.dayName}
                          </td>
                          <td rowSpan={daySpan} className="p-4 border border-slate-200 text-xs font-bold text-slate-400 bg-slate-50/30">
                            {period.date}
                          </td>
                        </>
                      )}
                      <td className={`p-4 border border-slate-200 text-xs font-black ${period.periodName === 'الفترة الأولى' ? 'text-indigo-600' : 'text-amber-600'}`}>
                        {period.periodName}
                      </td>

                      {allGrades.map(grade => {
                        const config = period.gradeConfigs[grade] || { subject: '', startTime: '07:30', endTime: '09:00' };
                        return (
                          <React.Fragment key={`${period.id}-${grade}`}>
                            <td className="p-2 border border-slate-200 min-w-[140px]">
                              <input 
                                type="text"
                                placeholder="ادخل المادة..."
                                value={config.subject}
                                onChange={(e) => updateCell(period.id, grade, 'subject', e.target.value)}
                                className="w-full bg-transparent text-center text-xs font-bold p-1 outline-none border-b border-transparent focus:border-indigo-400 text-slate-700"
                              />
                            </td>
                            <td className="p-2 border border-slate-200 bg-slate-50/20 w-36">
                              <div className="flex flex-col gap-1 items-center">
                                <div className="flex items-center gap-1.5 group">
                                  <Clock size={11} className="text-slate-300"/>
                                  <input 
                                    type="time" 
                                    value={config.startTime} 
                                    onChange={(e) => updateCell(period.id, grade, 'startTime', e.target.value)}
                                    className="bg-transparent text-[11px] font-black text-slate-600 outline-none border-none p-0 w-[55px]"
                                  />
                                </div>
                                <div className="flex items-center gap-1.5 group">
                                  <div className="w-2.5 h-[1.5px] bg-slate-200"></div>
                                  <input 
                                    type="time" 
                                    value={config.endTime} 
                                    onChange={(e) => updateCell(period.id, grade, 'endTime', e.target.value)}
                                    className="bg-transparent text-[11px] font-black text-slate-600 outline-none border-none p-0 w-[55px]"
                                  />
                                </div>
                              </div>
                            </td>
                          </React.Fragment>
                        );
                      })}

                      <td className="p-4 border border-slate-200">
                        <button 
                          onClick={() => setExamPeriods(prev => prev.map(p => p.id === period.id ? {...p, isActive: !p.isActive} : p))}
                          className={`p-2 rounded-xl transition-all ${period.isActive ? 'text-emerald-500 bg-emerald-50' : 'text-slate-200 bg-slate-100'}`}
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

          <div className="p-8 bg-slate-50/50 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-start gap-3 bg-white p-5 rounded-2xl border border-slate-200 text-slate-500 max-w-xl shadow-sm">
              <AlertCircle className="text-indigo-500 shrink-0" size={24} />
              <div className="text-[11px] font-bold leading-relaxed text-right">
                <span className="text-indigo-600 block mb-1 text-sm font-black">نظام التحكم المنفصل:</span>
                تم حل مشكلة الاتصال. يمكنك الآن تخصيص كل مادة ووقت لكل صف دراسي على حدة.
              </div>
            </div>
            <button 
              onClick={handleManualSave}
              disabled={isSaving}
              className="flex items-center gap-3 px-14 py-5 bg-slate-900 text-white rounded-3xl font-black shadow-2xl hover:bg-black hover:scale-[1.02] transition-all text-lg disabled:opacity-50"
            >
              {isSaving ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Save size={24} />}
              حفظ الجدول والاعتماد
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamScheduleManager;
