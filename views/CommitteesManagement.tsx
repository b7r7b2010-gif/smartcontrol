
import React, { useState, useMemo } from 'react';
import { 
  LayoutGrid, 
  Users, 
  Plus, 
  RefreshCw, 
  Trash2, 
  Eraser, 
  TrendingDown, 
  TrendingUp, 
  ArrowRightLeft, 
  Minus, 
  Settings2,
  FileSpreadsheet,
  CheckCircle2,
  MoreHorizontal,
  MapPin,
  ArrowDownWideNarrow,
  Grid3X3,
  PlusCircle,
  MinusCircle,
  ArrowRightLeft as TransferIcon
} from 'lucide-react';
import { Student, Committee } from '../types';
import { generateId } from '../utils';
import * as XLSX from 'xlsx';

/** 
 * مساعد لاستخراج حالة الطلاب غير الموزعين لتسهيل منطق الواجهة
 */
const useUnassignedStats = (students: Student[], allGrades: string[]) => {
  return useMemo(() => {
    const stats: Record<string, number> = {};
    allGrades.forEach(g => {
      stats[g] = students.filter(s => s.grade === g && !s.committeeId).length;
    });
    return stats;
  }, [students, allGrades]);
};

interface CommitteesManagementProps {
  students: Student[];
  committees: Committee[];
  setCommittees: (newData: Committee[] | ((prev: Committee[]) => Committee[])) => void;
  setStudents: (newData: Student[] | ((prev: Student[]) => Student[])) => void;
}

const CommitteesManagement: React.FC<CommitteesManagementProps> = ({ students, committees, setCommittees, setStudents }) => {
  const [capacityPerCommittee, setCapacityPerCommittee] = useState(30);
  const [targetNumCommittees, setTargetNumCommittees] = useState(10);
  const [distributionBasis, setDistributionBasis] = useState<'capacity' | 'count'>('capacity');
  const [distributionMode, setDistributionMode] = useState('interleaved'); 
  const [isAutoDistributing, setIsAutoDistributing] = useState(false);

  // استخراج كافة الصفوف المتاحة
  const allGrades = useMemo(() => {
    return Array.from(new Set(students.map(s => s.grade))).sort();
  }, [students]);

  // Fix: Call the hook to define unassignedByGrade within the component scope
  const unassignedByGrade = useUnassignedStats(students, allGrades);

  // إحصائيات كل صف دراسي للكروت العلوية
  const gradeStats = useMemo(() => {
    return allGrades.map(grade => {
      const total = students.filter(s => s.grade === grade).length;
      const assigned = students.filter(s => s.grade === grade && s.committeeId).length;
      const unassigned = total - assigned;
      return { grade, total, assigned, unassigned, isComplete: unassigned === 0 };
    });
  }, [students, allGrades]);

  const globalStats = useMemo(() => {
    const total = students.length;
    const assigned = students.filter(s => s.committeeId).length;
    const unassigned = total - assigned;
    return { total, assigned, unassigned };
  }, [students]);

  const handleAutoDistribute = () => {
    if (students.length === 0) return alert('يرجى استيراد الطلاب أولاً');
    setIsAutoDistributing(true);
    
    // تفكيك الطلاب حسب الصفوف بترتيب أبجدي
    const gradesMap: Record<string, Student[]> = {};
    allGrades.forEach(g => {
      gradesMap[g] = students
        .filter(s => s.grade === g)
        .sort((a, b) => a.name.localeCompare(b.name, 'ar'))
        .map(s => ({...s, committeeId: undefined}));
    });

    let interleavedStudents: Student[] = [];
    const maxGradeSize = Math.max(...Object.values(gradesMap).map(g => g.length));
    
    // دمج متداخل لمنع الغش
    for (let i = 0; i < maxGradeSize; i++) {
      allGrades.forEach(grade => {
        if (gradesMap[grade][i]) interleavedStudents.push(gradesMap[grade][i]);
      });
    }

    let numCommitteesFinal = 0;
    let capacityFinal = 0;

    if (distributionBasis === 'capacity') {
      numCommitteesFinal = Math.ceil(interleavedStudents.length / capacityPerCommittee);
      capacityFinal = capacityPerCommittee;
    } else {
      numCommitteesFinal = targetNumCommittees;
      capacityFinal = Math.ceil(interleavedStudents.length / targetNumCommittees);
    }

    const newCommittees: Committee[] = [];
    const finalStudents = students.map(s => ({ ...s, committeeId: undefined }));

    for (let j = 0; j < numCommitteesFinal; j++) {
      const committeeId = generateId();
      const chunk = interleavedStudents.slice(j * capacityFinal, (j + 1) * capacityFinal);
      
      newCommittees.push({
        id: committeeId,
        name: `${j + 1}`,
        roomName: 'المكان',
        capacity: capacityFinal,
        assignedTeacherIds: [],
        studentIds: chunk.map(s => s.id)
      });

      chunk.forEach(studentInChunk => {
        const idx = finalStudents.findIndex(s => s.id === studentInChunk.id);
        if (idx !== -1) finalStudents[idx].committeeId = committeeId;
      });
    }

    setCommittees(newCommittees);
    setStudents(finalStudents);
    setTimeout(() => setIsAutoDistributing(false), 600);
  };

  /**
   * دالة الموازنة الذكية (Smart Balance):
   * تسمح بسحب الطلاب من اللجان الأخرى تلقائياً عند الضغط على (+) 
   * لضمان مرونة التعديل اليدوي بعد التوزيع التلقائي.
   */
  const adjustGradeInCommittee = (committeeId: string, grade: string, action: 'add' | 'remove') => {
    if (action === 'add') {
      let studentToAssign = students.find(s => s.grade === grade && !s.committeeId);
      let sourceCommitteeId: string | undefined = undefined;

      // موازنة تلقائية: إذا لم يوجد طلاب متاحين، نسحب من اللجنة الأكثر عدداً من نفس الصف
      if (!studentToAssign) {
        const source = committees
          .filter(c => c.id !== committeeId)
          .map(c => ({ 
            id: c.id, 
            count: students.filter(s => s.committeeId === c.id && s.grade === grade).length 
          }))
          .filter(x => x.count > 0)
          .sort((a, b) => b.count - a.count)[0];

        if (source) {
          sourceCommitteeId = source.id;
          studentToAssign = students.find(s => s.grade === grade && s.committeeId === source.id);
        }
      }

      if (!studentToAssign) return;

      const targetId = studentToAssign.id;
      const fromId = sourceCommitteeId;

      setStudents(prev => prev.map(s => s.id === targetId ? { ...s, committeeId } : s));
      setCommittees(prev => prev.map(c => {
        if (c.id === committeeId) {
          const newIds = [...c.studentIds, targetId];
          return { ...c, studentIds: newIds, capacity: Math.max(c.capacity, newIds.length) };
        }
        if (fromId && c.id === fromId) {
          return { ...c, studentIds: c.studentIds.filter(id => id !== targetId) };
        }
        return c;
      }));
    } else {
      const studentToRemove = students.find(s => s.grade === grade && s.committeeId === committeeId);
      if (!studentToRemove) return;
      setStudents(prev => prev.map(s => s.id === studentToRemove.id ? { ...s, committeeId: undefined } : s));
      setCommittees(prev => prev.map(c => c.id === committeeId ? { ...c, studentIds: c.studentIds.filter(id => id !== studentToRemove.id) } : c));
    }
  };

  const exportToExcel = () => {
    const data = committees.map(c => {
      const row: any = { 'رقم اللجنة': c.name, 'المقر': c.roomName };
      allGrades.forEach(g => {
        row[g] = students.filter(s => s.committeeId === c.id && s.grade === g).length;
      });
      row['المجموع'] = c.studentIds.length;
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "توزيع اللجان");
    XLSX.writeFile(wb, "توزيع_اللجان_الاحترافي.xlsx");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border-2 border-slate-50 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
             <div className="text-3xl font-black text-slate-800">{globalStats.total}</div>
             <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">إجمالي الطلاب</div>
          </div>
          <div className="p-4 bg-blue-50 text-blue-600 rounded-3xl"><Users size={24}/></div>
        </div>

        {gradeStats.map(stat => (
          <div key={stat.grade} className={`bg-white p-6 rounded-[2rem] border-2 shadow-sm flex flex-col items-center justify-center relative overflow-hidden transition-all ${stat.isComplete ? 'border-emerald-100 bg-emerald-50/10' : 'border-slate-50'}`}>
            {stat.isComplete && <div className="absolute top-4 left-4 text-emerald-500"><CheckCircle2 size={18}/></div>}
            <div className="text-[10px] font-black text-slate-400 mb-1">{stat.grade}</div>
            <div className="text-3xl font-black text-slate-800">{stat.total}</div>
            <div className={`text-[10px] font-bold mt-2 px-3 py-1 rounded-full ${stat.isComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
               {stat.isComplete ? 'اكتمل التوزيع' : `متبقي: ${stat.unassigned}`}
            </div>
          </div>
        ))}

        <div className="bg-white p-6 rounded-[2rem] border-2 border-slate-50 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
             <div className="text-3xl font-black text-slate-800">{globalStats.unassigned}</div>
             <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">بانتظار التوزيع</div>
          </div>
          <div className={`p-4 rounded-3xl ${globalStats.unassigned > 0 ? 'bg-orange-50 text-orange-600' : 'bg-slate-50 text-slate-400'}`}>
            <TrendingDown size={24}/>
          </div>
        </div>
      </div>

      {/* Main Control Panel */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
           <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Grid3X3 size={24}/></div>
              <div>
                <h2 className="text-xl font-black text-slate-800">توزيع الطلاب على اللجان</h2>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">توزيع تلقائي مرن</div>
              </div>
           </div>

           <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center bg-slate-100 rounded-2xl p-1 border border-slate-200">
                 <button 
                  onClick={() => setDistributionBasis('capacity')}
                  className={`px-5 py-2.5 text-xs font-black rounded-xl transition-all ${distributionBasis === 'capacity' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                 >سعة اللجنة</button>
                 <button 
                  onClick={() => setDistributionBasis('count')}
                  className={`px-5 py-2.5 text-xs font-black rounded-xl transition-all ${distributionBasis === 'count' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                 >عدد اللجان</button>
              </div>
              
              <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-5 py-2.5 shadow-sm">
                 <span className="text-[10px] font-black text-slate-400 uppercase">{distributionBasis === 'capacity' ? 'السعة:' : 'العدد:'}</span>
                 {distributionBasis === 'capacity' ? (
                   <input 
                    type="number" 
                    value={capacityPerCommittee} 
                    onChange={(e) => setCapacityPerCommittee(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-10 text-center font-black text-indigo-600 outline-none text-sm"
                   />
                 ) : (
                   <input 
                    type="number" 
                    value={targetNumCommittees} 
                    onChange={(e) => setTargetNumCommittees(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-10 text-center font-black text-indigo-600 outline-none text-sm"
                   />
                 )}
              </div>

              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-5 py-2.5 shadow-sm">
                 <span className="text-[10px] font-black text-slate-400 uppercase">النمط:</span>
                 <select className="text-[10px] font-black text-slate-700 outline-none bg-transparent">
                    <option>دمج متداخل (منع الغش)</option>
                    <option>ترتيب صفوف مستقلة</option>
                 </select>
              </div>

              <button 
                onClick={handleAutoDistribute} 
                disabled={isAutoDistributing}
                className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:bg-black transition-all disabled:opacity-50"
              >
                {isAutoDistributing ? <RefreshCw className="animate-spin" size={18}/> : <ArrowRightLeft size={18}/>}
                توزيع
              </button>
           </div>
        </div>

        <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
           <div className="flex gap-2">
             <button onClick={() => setCommittees(prev => [...prev, { id: generateId(), name: `${prev.length + 1}`, roomName: 'المكان', capacity: capacityPerCommittee, assignedTeacherIds: [], studentIds: [] }])} className="p-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm"><Plus size={20}/></button>
             <button onClick={exportToExcel} className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-black text-xs shadow-lg hover:bg-emerald-700 transition-all"><FileSpreadsheet size={16}/> تصدير إكسل</button>
           </div>
           <button onClick={() => { if(confirm('هل تريد مسح التوزيع الحالي؟')) { setCommittees([]); setStudents(prev => prev.map(s => ({...s, committeeId: undefined}))); }}} className="p-3 text-red-400 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100" title="مسح التوزيع"><Eraser size={22}/></button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] border-b border-slate-100">
                <th className="p-6 w-16">رقم</th>
                <th className="p-6">المقر</th>
                {allGrades.map(grade => (
                  <th key={grade} className="p-6 border-x border-slate-100">
                    <div className="text-indigo-600 font-black mb-1">{grade}</div>
                    <div className="flex items-center justify-center gap-1 opacity-50 text-[8px]">
                       <ArrowDownWideNarrow size={10}/> تسلسل أبجدي
                    </div>
                  </th>
                ))}
                <th className="p-6">مجموع</th>
                <th className="p-6 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {committees.map((committee) => {
                const committeeStudents = students.filter(s => s.committeeId === committee.id);
                const isOverCapacity = committeeStudents.length > committee.capacity;

                return (
                  <tr key={committee.id} className="hover:bg-slate-50/40 transition-colors group">
                    <td className="p-6 font-black text-slate-800">{committee.name}</td>
                    <td className="p-6">
                      <div className="flex items-center justify-center gap-2 text-slate-400 font-bold text-xs bg-white border border-slate-100 py-2 px-4 rounded-xl shadow-sm">
                        <MapPin size={12}/> {committee.roomName}
                      </div>
                    </td>
                    
                    {allGrades.map(grade => {
                      const gradeInCommittee = committeeStudents.filter(s => s.grade === grade);
                      const count = gradeInCommittee.length;
                      const hasMoreToDistribute = unassignedByGrade[grade] > 0;

                      return (
                        <td key={grade} className="p-4 border-x border-slate-50/30">
                          <div className={`bg-white border rounded-2xl p-3 transition-all ${count > 0 ? 'border-indigo-100 shadow-sm' : 'border-slate-100 opacity-60'}`}>
                             <div className="flex items-center justify-between mb-2">
                               <button 
                                onClick={() => adjustGradeInCommittee(committee.id, grade, 'remove')}
                                disabled={count === 0}
                                className="p-1 text-slate-200 hover:text-red-500 transition-colors disabled:opacity-0"
                               ><Minus size={16}/></button>
                               <span className="text-sm font-black text-slate-800">{count}</span>
                               <button 
                                onClick={() => adjustGradeInCommittee(committee.id, grade, 'add')}
                                className={`p-1 transition-all ${hasMoreToDistribute ? 'text-indigo-600' : 'text-slate-200 hover:text-indigo-400'}`}
                                title={hasMoreToDistribute ? "إضافة من المتبقي" : "سحب من لجنة أخرى للموازنة"}
                               >{hasMoreToDistribute ? <PlusCircle size={18}/> : <TransferIcon size={16}/>}</button>
                             </div>
                             {count > 0 && (
                               <div className="text-[9px] font-black text-indigo-400 bg-indigo-50/50 py-0.5 rounded-lg border border-indigo-100/50">
                                 1 - {count}
                               </div>
                             )}
                          </div>
                        </td>
                      );
                    })}

                    <td className="p-6">
                      <div className={`text-xl font-black ${isOverCapacity ? 'text-indigo-600' : 'text-slate-800'}`}>
                        {committeeStudents.length}
                        <div className="text-[9px] text-slate-300 font-bold mt-1">/ {committee.capacity}</div>
                      </div>
                    </td>
                    <td className="p-6">
                      <button 
                        onClick={() => { if(confirm('حذف اللجنة؟')) { setCommittees(prev => prev.filter(c => c.id !== committee.id)); setStudents(prev => prev.map(s => s.committeeId === committee.id ? {...s, committeeId: undefined} : s)); } }}
                        className="p-3 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={20}/>
                      </button>
                    </td>
                  </tr>
                );
              })}
              
              {committees.length === 0 && (
                <tr>
                  <td colSpan={allGrades.length + 4} className="p-40 text-center">
                    <div className="flex flex-col items-center gap-6 text-slate-300">
                       <div className="p-8 bg-slate-50 rounded-full border border-slate-100 shadow-inner">
                        <Grid3X3 size={64} strokeWidth={1}/>
                       </div>
                       <div className="space-y-2">
                        <div className="font-black text-xl text-slate-400">لا يوجد لجان نشطة</div>
                        <p className="text-sm max-w-xs font-medium text-slate-400 leading-relaxed">استخدم شريط التحكم العلوي لبدء التوزيع التلقائي أو إضافة لجان يدوية.</p>
                       </div>
                    </div>
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

export default CommitteesManagement;
