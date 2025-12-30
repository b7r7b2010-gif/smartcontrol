import React, { useState, useMemo } from 'react';
import { 
  Grid3X3, Users, ArrowRightLeft, RefreshCw, Eraser, FileSpreadsheet, 
  MapPin, CheckCircle2, ShieldCheck, Zap, Info, Trash2
} from 'lucide-react';
import { Student, Committee } from '../types';
import { generateId } from '../utils';
import { QRCodeSVG } from 'qrcode.react';

interface CommitteesManagementProps {
  students: Student[];
  committees: Committee[];
  setCommittees: (newData: Committee[] | ((prev: Committee[]) => Committee[])) => void;
  setStudents: (newData: Student[] | ((prev: Student[]) => Student[])) => void;
}

const CommitteesManagement: React.FC<CommitteesManagementProps> = ({ students, committees, setCommittees, setStudents }) => {
  const [capacity, setCapacity] = useState(20);
  const [roomPrefix, setRoomPrefix] = useState('قاعة');
  const [startRoomNum, setStartRoomNum] = useState(101);
  const [isProcessing, setIsProcessing] = useState(false);

  // استخراج الصفوف الدراسية الموجودة
  const allGrades = useMemo(() => Array.from(new Set(students.map(s => s.grade))).sort(), [students]);

  // دالة التوزيع الذكي (منع الغش بالتداخل)
  const handleSmartDistribute = () => {
    if (students.length === 0) return alert('خطأ: لا يوجد طلاب في قاعدة البيانات لاستيرادهم');
    
    setIsProcessing(true);
    
    setTimeout(() => {
      // 1. تصنيف الطلاب حسب الصفوف وترتيبهم أبجدياً
      const gradesPool: Record<string, Student[]> = {};
      allGrades.forEach(grade => {
        gradesPool[grade] = students
          .filter(s => s.grade === grade)
          .sort((a, b) => a.name.localeCompare(b.name, 'ar'));
      });

      // 2. خوارزمية التداخل (Interleaving) لضمان عدم جلوس طالبين من نفس الصف متجاورين
      const interleavedStudents: Student[] = [];
      const maxStudentsInAnyGrade = Math.max(...Object.values(gradesPool).map(g => g.length));

      for (let i = 0; i < maxStudentsInAnyGrade; i++) {
        allGrades.forEach(grade => {
          if (gradesPool[grade][i]) {
            interleavedStudents.push(gradesPool[grade][i]);
          }
        });
      }

      // 3. تقسيم القائمة المتداخلة على اللجان بناءً على السعة المطلوبة
      const numCommittees = Math.ceil(interleavedStudents.length / capacity);
      const newCommittees: Committee[] = [];
      const updatedStudents = [...students].map(s => ({ ...s, committeeId: undefined }));

      for (let j = 0; j < numCommittees; j++) {
        const committeeId = generateId();
        const startIdx = j * capacity;
        const endIdx = Math.min(startIdx + capacity, interleavedStudents.length);
        const committeeChunk = interleavedStudents.slice(startIdx, endIdx);
        
        const committeeName = `لجنة ${j + 1}`;
        const roomName = `${roomPrefix} ${startRoomNum + j}`;

        newCommittees.push({
          id: committeeId,
          name: committeeName,
          roomName: roomName,
          capacity: capacity,
          assignedTeacherIds: [],
          studentIds: committeeChunk.map(s => s.id)
        });

        // تحديث مرجع اللجنة في بيانات الطالب
        committeeChunk.forEach(chunkStudent => {
          const studentIdx = updatedStudents.findIndex(s => s.id === chunkStudent.id);
          if (studentIdx !== -1) {
            updatedStudents[studentIdx].committeeId = committeeId;
          }
        });
      }

      setCommittees(newCommittees);
      setStudents(updatedStudents);
      setIsProcessing(false);
    }, 800);
  };

  const handleClear = () => {
    if (confirm('هل أنت متأكد من مسح كافة توزيعات اللجان؟ سيبقى الطلاب في النظام ولكن بدون لجان.')) {
      setCommittees([]);
      setStudents(prev => prev.map(s => ({ ...s, committeeId: undefined })));
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* رأس الصفحة مع أدوات التحكم */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col xl:flex-row items-start xl:items-center justify-between gap-8">
        <div className="flex items-center gap-5">
           <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-indigo-200 animate-pulse">
             <ShieldCheck size={32} />
           </div>
           <div>
              <h2 className="text-3xl font-black text-slate-800">نظام التوزيع الذكي</h2>
              <p className="text-slate-500 font-bold flex items-center gap-2 mt-1">
                <Zap size={16} className="text-amber-500" />
                توزيع آلي متداخل (Anti-Cheating) لمنع الغش
              </p>
           </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
           <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 p-2 rounded-2xl">
              <div className="px-4 text-[10px] font-black text-slate-400 uppercase">سعة اللجنة</div>
              <input 
                type="number" 
                value={capacity} 
                onChange={(e) => setCapacity(Number(e.target.value))}
                className="w-16 py-2 bg-white border border-slate-200 rounded-xl text-center font-black text-indigo-600 outline-none focus:ring-2 focus:ring-indigo-500"
              />
           </div>
           
           <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 p-2 rounded-2xl">
              <div className="px-4 text-[10px] font-black text-slate-400 uppercase">تبدأ من</div>
              <input 
                type="number" 
                value={startRoomNum} 
                onChange={(e) => setStartRoomNum(Number(e.target.value))}
                className="w-20 py-2 bg-white border border-slate-200 rounded-xl text-center font-black text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500"
              />
           </div>

           <div className="flex gap-2">
             <button 
                onClick={handleSmartDistribute}
                disabled={isProcessing}
                className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black flex items-center gap-3 shadow-xl shadow-indigo-200 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
             >
                {isProcessing ? <RefreshCw className="animate-spin" size={20}/> : <ArrowRightLeft size={20}/>}
                توزيع ذكي الآن
             </button>
             <button 
                onClick={handleClear}
                className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all border border-red-100"
                title="مسح التوزيع"
             >
                <Trash2 size={24} />
             </button>
           </div>
        </div>
      </div>

      {/* ملخص الإحصائيات الذكي */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <StatBox label="إجمالي الطلاب" value={students.length} sub="طالب مسجل" color="indigo" />
         <StatBox label="اللجان الحالية" value={committees.length} sub="لجنة موزعة" color="emerald" />
         <StatBox label="طلاب بدون لجان" value={students.filter(s => !s.committeeId).length} sub="بحاجة لتوزيع" color="amber" />
      </div>

      {/* جدول عرض اللجان المطور */}
      <div className="bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
           <h3 className="font-black text-slate-800 text-xl flex items-center gap-3">
             <Grid3X3 className="text-indigo-500" />
             هيكل اللجان والمقرات
           </h3>
           <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 bg-white px-4 py-2 rounded-full border border-slate-100">
             <Info size={14}/> يتم ترتيب الطلاب داخل اللجان بنظام التداخل الصفّي
           </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em]">
                <th className="p-6">رقم اللجنة</th>
                <th className="p-6">المقر (القاعة)</th>
                {allGrades.map(grade => (
                  <th key={grade} className="p-6 border-r border-slate-800">{grade}</th>
                ))}
                <th className="p-6 border-r border-slate-800">الإجمالي</th>
                <th className="p-6">رمز QR المباشر</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {committees.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 group transition-all duration-300">
                  <td className="p-6">
                    <div className="text-xl font-black text-slate-800">{c.name}</div>
                  </td>
                  <td className="p-6">
                    <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-indigo-50 text-indigo-700 rounded-2xl font-black text-sm border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <MapPin size={16} />
                      {c.roomName}
                    </div>
                  </td>
                  {allGrades.map(grade => {
                    const count = students.filter(s => s.committeeId === c.id && s.grade === grade).length;
                    return (
                      <td key={grade} className="p-6 border-r border-slate-50">
                        <span className={`font-black text-lg ${count > 0 ? 'text-slate-700' : 'text-slate-200'}`}>
                          {count}
                        </span>
                      </td>
                    );
                  })}
                  <td className="p-6 border-r border-slate-50">
                    <div className="text-2xl font-black text-indigo-600">{c.studentIds.length}</div>
                    <div className="text-[9px] font-black text-slate-400 uppercase">طالب</div>
                  </td>
                  <td className="p-6">
                    <div className="flex justify-center">
                      <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm group-hover:scale-110 transition-transform">
                        <QRCodeSVG value={`COMMITTEE_LIVE:${c.id}`} size={60} />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              {committees.length === 0 && (
                <tr>
                  <td colSpan={allGrades.length + 4} className="p-32 text-center text-slate-300 font-bold flex flex-col items-center gap-4">
                    <RefreshCw size={64} strokeWidth={1} className="opacity-20" />
                    <span className="text-xl">لا يوجد توزيع لجان حالي، اضغط على "توزيع ذكي" للبدء</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatBox: React.FC<{ label: string; value: number; sub: string; color: string }> = ({ label, value, sub, color }) => (
  <div className={`p-8 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm relative overflow-hidden group`}>
    <div className={`absolute top-0 right-0 w-2 h-full bg-${color}-500`}></div>
    <div className="relative z-10">
      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</div>
      <div className="text-4xl font-black text-slate-800 mb-1">{value}</div>
      <div className="text-xs font-bold text-slate-500">{sub}</div>
    </div>
  </div>
);

export default CommitteesManagement;