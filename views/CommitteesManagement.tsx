
import React, { useState, useMemo } from 'react';
import { 
  LayoutGrid, 
  Users, 
  Plus, 
  RefreshCw, 
  Layers, 
  Edit, 
  Trash2, 
  ChevronLeft, 
  X, 
  Save, 
  Info,
  AlertCircle,
  Eraser
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
  const [capacityPerCommittee, setCapacityPerCommittee] = useState(20);
  const [editingCommittee, setEditingCommittee] = useState<Committee | null>(null);
  const [isAutoDistributing, setIsAutoDistributing] = useState(false);

  const stats = useMemo(() => {
    const total = students.length;
    const assigned = students.filter(s => s.committeeId).length;
    return { total, assigned, unassigned: total - assigned, percentage: total > 0 ? Math.round((assigned / total) * 100) : 0 };
  }, [students]);

  const handleClearCommittees = () => {
    if (window.confirm('⚠️ مسح اللجان سيعيد جميع الطلاب إلى حالة "غير موزع". هل تريد الاستمرار؟')) {
      setCommittees([]);
      setStudents(prev => prev.map(s => ({ ...s, committeeId: undefined })));
    }
  };

  const handleAutoDistribute = () => {
    setIsAutoDistributing(true);
    const gradesMap: Record<string, Student[]> = {};
    students.forEach(s => {
      if (!gradesMap[s.grade]) gradesMap[s.grade] = [];
      gradesMap[s.grade].push({...s, committeeId: undefined});
    });
    const gradeNames = Object.keys(gradesMap).sort();
    let allInterleaved: Student[] = [];
    const maxLen = Math.max(...Object.values(gradesMap).map(g => g.length));
    for (let i = 0; i < maxLen; i++) {
      gradeNames.forEach(gn => { if (gradesMap[gn][i]) allInterleaved.push(gradesMap[gn][i]); });
    }
    const numCommittees = Math.ceil(allInterleaved.length / capacityPerCommittee);
    const newCommittees: Committee[] = [];
    const updatedStudents = [...students];
    for (let i = 0; i < numCommittees; i++) {
      const committeeId = generateId();
      const chunk = allInterleaved.slice(i * capacityPerCommittee, (i + 1) * capacityPerCommittee);
      newCommittees.push({ id: committeeId, name: `لجنة رقم ${i + 1}`, roomName: `قاعة ${101 + i}`, capacity: capacityPerCommittee, assignedTeacherIds: [], studentIds: chunk.map(s => s.id) });
      chunk.forEach(cs => { const idx = updatedStudents.findIndex(s => s.id === cs.id); if (idx !== -1) updatedStudents[idx].committeeId = committeeId; });
    }
    setCommittees(newCommittees);
    setStudents(updatedStudents);
    setTimeout(() => setIsAutoDistributing(false), 800);
  };

  const deleteCommittee = (id: string) => {
    if (!confirm('سيتم إعادة طلاب هذه اللجنة إلى قائمة غير الموزعين.')) return;
    setCommittees(prev => prev.filter(c => c.id !== id));
    setStudents(prev => prev.map(s => s.committeeId === id ? { ...s, committeeId: undefined } : s));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800">إدارة اللجان والتوزيع السحابي</h2>
          <p className="text-slate-500 font-medium">البيانات متزامنة لحظياً عبر Firebase لضمان الدقة</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={handleClearCommittees}
            className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all border border-red-100 shadow-sm"
            title="مسح جميع اللجان"
          >
            <Eraser size={22} />
          </button>
          <div className="bg-white border border-slate-100 rounded-2xl px-4 py-3 flex items-center gap-3">
            <span className="text-xs font-black text-slate-400">السعة:</span>
            <input type="number" value={capacityPerCommittee} onChange={(e) => setCapacityPerCommittee(Math.max(1, parseInt(e.target.value) || 0))} className="w-10 text-center font-black text-indigo-600 outline-none" />
          </div>
          <button onClick={handleAutoDistribute} disabled={isAutoDistributing || students.length === 0} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100">
            {isAutoDistributing ? <RefreshCw className="animate-spin" /> : <RefreshCw />} توزيع سحابي
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl"><Users size={24} /></div>
          <div><div className="text-2xl font-black text-slate-800">{stats.total}</div><div className="text-xs font-bold text-slate-400">إجمالي الطلاب</div></div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl"><Layers size={24} /></div>
          <div><div className="text-2xl font-black text-emerald-600">{stats.assigned}</div><div className="text-xs font-bold text-slate-400">تم توزيعهم</div></div>
        </div>
        <div className="bg-indigo-900 p-6 rounded-[2rem] text-white flex flex-col justify-center col-span-2">
          <div className="flex justify-between items-center mb-2"><span className="text-xs font-black opacity-60">حالة التوزيع السحابي</span><span>{stats.percentage}%</span></div>
          <div className="h-2 bg-indigo-800 rounded-full overflow-hidden"><div className="h-full bg-indigo-400" style={{ width: `${stats.percentage}%` }}></div></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {committees.map((committee) => (
          <div key={committee.id} className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden group hover:shadow-xl transition-all">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
              <h3 className="font-black text-slate-800">{committee.name}</h3>
              <button onClick={() => deleteCommittee(committee.id)} className="p-2 text-red-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
            </div>
            <div className="p-8 space-y-4">
              <div className="flex justify-between items-center">
                <div><div className="text-xs font-black text-slate-400">المقر</div><div className="text-xl font-black text-slate-800">{committee.roomName}</div></div>
                <QRCodeSVG value={`COMMITTEE:${committee.id}`} size={48} />
              </div>
              <div className="h-2 bg-slate-50 rounded-full overflow-hidden"><div className="h-full bg-indigo-500" style={{ width: `${(committee.studentIds.length / committee.capacity) * 100}%` }}></div></div>
              <div className="text-xs font-bold text-slate-500">{committee.studentIds.length} طالب / سعة {committee.capacity}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommitteesManagement;
