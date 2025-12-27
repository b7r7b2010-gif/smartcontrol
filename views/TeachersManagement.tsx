
import React, { useState, useRef } from 'react';
import { UserPlus, Search, QrCode as QrIcon, Phone, UserSquare2, Trash2, FileSpreadsheet, Eraser } from 'lucide-react';
import { Teacher, Committee } from '../types';
import { generateId, parseExcelFile, mapExcelToTeachers } from '../utils';
import { QRCodeSVG } from 'qrcode.react';

interface TeachersManagementProps {
  teachers: Teacher[];
  setTeachers: (newData: Teacher[] | ((prev: Teacher[]) => Teacher[])) => void;
  committees: Committee[];
  setCommittees: (newData: Committee[] | ((prev: Committee[]) => Committee[])) => void;
}

const TeachersManagement: React.FC<TeachersManagementProps> = ({ teachers, setTeachers, committees, setCommittees }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [newTeacher, setNewTeacher] = useState({ name: '', teacherId: '', phone: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClearTeachers = () => {
    if (window.confirm('⚠️ هل تريد مسح جميع بيانات الملاحظين؟ هذا سيفك ارتباطهم بجميع اللجان الحالية.')) {
      setTeachers([]);
      setCommittees(prev => prev.map(c => ({ ...c, assignedTeacherIds: [] })));
    }
  };

  const handleAddTeacher = () => {
    if (!newTeacher.name || !newTeacher.teacherId) return;
    const teacher: Teacher = { id: generateId(), ...newTeacher, qrCode: `TEACHER:${newTeacher.teacherId}` };
    setTeachers(prev => [...prev, teacher]);
    setNewTeacher({ name: '', teacherId: '', phone: '' });
    setShowAddModal(false);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    try {
      const jsonData = await parseExcelFile(file);
      const mapped = mapExcelToTeachers(jsonData);
      setTeachers(prev => [...prev, ...mapped]);
    } catch (e) { alert('خطأ في الاستيراد'); }
    finally { setIsImporting(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800">إدارة الملاحظين سحابياً</h2>
          <p className="text-slate-500 font-medium">أكواد QR فريدة لكل معلم مرتبطة بقاعدة بيانات آمنة</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx, .xls" className="hidden" />
          
          <button 
            onClick={handleClearTeachers}
            className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all border border-red-100 shadow-sm"
            title="مسح قاعدة بيانات المعلمين"
          >
            <Eraser size={22} />
          </button>

          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold shadow-xl">
            <FileSpreadsheet size={20} /> استيراد Excel
          </button>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl">
            <UserPlus size={20} /> إضافة معلم
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teachers.map((teacher) => (
          <div key={teacher.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 group relative">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-slate-50 border rounded-2xl"><QRCodeSVG value={teacher.qrCode} size={64} /></div>
              <div className="flex-1">
                <h3 className="font-black text-slate-800">{teacher.name}</h3>
                <div className="text-xs text-slate-400 mt-1 font-bold">ID: {teacher.teacherId}</div>
                <div className="text-xs text-slate-400 mt-1 font-bold">{teacher.phone}</div>
              </div>
              <button onClick={() => setTeachers(prev => prev.filter(t => t.id !== teacher.id))} className="text-red-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
            </div>
          </div>
        ))}
        {teachers.length === 0 && <div className="col-span-full py-20 text-center text-slate-300 font-bold">قاعدة بيانات الملاحظين فارغة</div>}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
           <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl animate-in zoom-in-95">
              <h3 className="text-2xl font-black text-slate-800 mb-8">إضافة ملاحظ جديد</h3>
              <div className="space-y-4">
                <input value={newTeacher.name} onChange={e => setNewTeacher({...newTeacher, name: e.target.value})} placeholder="الاسم الرباعي" className="w-full p-4 bg-slate-50 border rounded-2xl outline-none font-bold" />
                <input value={newTeacher.teacherId} onChange={e => setNewTeacher({...newTeacher, teacherId: e.target.value})} placeholder="رقم المعلم" className="w-full p-4 bg-slate-50 border rounded-2xl outline-none font-bold" />
                <input value={newTeacher.phone} onChange={e => setNewTeacher({...newTeacher, phone: e.target.value})} placeholder="رقم الجوال" className="w-full p-4 bg-slate-50 border rounded-2xl outline-none font-bold" />
              </div>
              <div className="flex gap-4 mt-8">
                <button onClick={handleAddTeacher} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black">حفظ</button>
                <button onClick={() => setShowAddModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black">إلغاء</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default TeachersManagement;
