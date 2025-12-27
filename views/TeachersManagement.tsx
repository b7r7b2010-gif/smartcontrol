
import React, { useState, useRef } from 'react';
import { UserPlus, Search, QrCode as QrIcon, Phone, UserSquare2, Trash2, FileSpreadsheet, Eraser, X, CheckCircle2, ChevronLeft, ChevronRight, Settings2, CalendarRange } from 'lucide-react';
import { Teacher, Committee } from '../types';
import { generateId, readWorkbook, getSheetData, mapExcelToTeachers } from '../utils';
import { QRCodeSVG } from 'qrcode.react';
import * as XLSX from 'xlsx';

interface TeachersManagementProps {
  teachers: Teacher[];
  setTeachers: (newData: Teacher[] | ((prev: Teacher[]) => Teacher[])) => void;
  committees: Committee[];
  setCommittees: (newData: Committee[] | ((prev: Committee[]) => Committee[])) => void;
}

type ImportStep = 'idle' | 'mapping' | 'preview';

const TeachersManagement: React.FC<TeachersManagementProps> = ({ teachers, setTeachers, committees, setCommittees }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [importStep, setImportStep] = useState<ImportStep>('idle');
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [newTeacher, setNewTeacher] = useState({ name: '', teacherId: '', phone: '' });
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({
    name: '',
    teacherId: '',
    phone: ''
  });
  const [previewData, setPreviewData] = useState<Teacher[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClearTeachers = () => {
    if (window.confirm('⚠️ هل تريد مسح جميع بيانات الملاحظين؟ هذا سيفك ارتباطهم بجميع اللجان الحالية.')) {
      setTeachers([]);
      setCommittees(prev => prev.map(c => ({ ...c, assignedTeacherIds: [] })));
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const wb = await readWorkbook(file);
      setWorkbook(wb);
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
      const excelHeaders = (jsonData[0] || []).map(h => String(h));
      setHeaders(excelHeaders);
      
      // Auto-mapping logic
      const autoMapping = { ...fieldMapping };
      excelHeaders.forEach(h => {
        if (h.includes('اسم') || h.includes('المعلم')) autoMapping.name = h;
        if (h.includes('رقم') || h.includes('هوية') || h.includes('ID')) autoMapping.teacherId = h;
        if (h.includes('جوال') || h.includes('هاتف')) autoMapping.phone = h;
      });
      setFieldMapping(autoMapping);
      setImportStep('mapping');
    } catch (e) { alert('خطأ في قراءة الملف'); }
  };

  const proceedToPreview = () => {
    if (!workbook) return;
    const rawData = getSheetData(workbook, workbook.SheetNames[0]);
    const mapped: Teacher[] = rawData.map(row => ({
      id: generateId(),
      name: String(row[fieldMapping.name] || ''),
      teacherId: String(row[fieldMapping.teacherId] || ''),
      phone: String(row[fieldMapping.phone] || ''),
      qrCode: `TEACHER:${row[fieldMapping.teacherId] || generateId()}`
    })).filter(t => t.name.length > 2);
    setPreviewData(mapped);
    setImportStep('preview');
  };

  const finalizeImport = () => {
    setTeachers(prev => [...prev, ...previewData]);
    setImportStep('idle');
    setWorkbook(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    alert(`تم استيراد ${previewData.length} معلم بنجاح.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800">إدارة الملاحظين</h2>
          <p className="text-slate-500 font-medium">استيراد مرن للمعلمين مع توليد تلقائي لأكواد QR</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".xlsx, .xls" className="hidden" />
          
          <button onClick={handleClearTeachers} className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all border border-red-100 shadow-sm">
            <Eraser size={22} />
          </button>

          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold shadow-xl">
            <FileSpreadsheet size={20} /> استيراد Excel
          </button>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl">
            <UserPlus size={20} /> إضافة يدوي
          </button>
          <button onClick={() => window.dispatchEvent(new CustomEvent('switchTab', { detail: 'schedule' }))} className="flex items-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-2xl font-bold shadow-xl">
            <CalendarRange size={20} /> معالج الجدول
          </button>
        </div>
      </div>

      {/* Import Wizard Modal */}
      {importStep !== 'idle' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[120] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xl font-black text-slate-800">معالج استيراد الملاحظين</h3>
              <button onClick={() => setImportStep('idle')} className="p-2 hover:bg-slate-200 rounded-full"><X size={24} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8">
              {importStep === 'mapping' && (
                <div className="space-y-6">
                  <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex gap-3 text-indigo-800">
                    <Settings2 size={20} />
                    <p className="text-sm font-bold">يرجى ربط أعمدة ملف الـ Excel بالحقول المطلوبة أدناه:</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {['name', 'teacherId', 'phone'].map(key => (
                      <div key={key} className="space-y-2">
                        <label className="text-sm font-black text-slate-700">{key === 'name' ? 'اسم المعلم الكامل' : key === 'teacherId' ? 'رقم المعلم / الهوية' : 'رقم الجوال'}</label>
                        <select
                          value={fieldMapping[key]}
                          onChange={(e) => setFieldMapping({...fieldMapping, [key]: e.target.value})}
                          className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                        >
                          <option value="">-- اختر العمود --</option>
                          {headers.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {importStep === 'preview' && (
                <div className="space-y-4">
                   <div className="text-sm font-bold text-slate-500">معاينة البيانات قبل الاعتماد النهائي (إجمالي: {previewData.length})</div>
                   <div className="border border-slate-100 rounded-2xl overflow-hidden">
                      <table className="w-full text-right text-sm">
                        <thead className="bg-slate-50">
                          <tr><th className="p-4 font-black">الاسم</th><th className="p-4 font-black">رقم المعلم</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {previewData.slice(0, 10).map((t, i) => (
                            <tr key={i}><td className="p-4 font-bold">{t.name}</td><td className="p-4 font-mono">{t.teacherId}</td></tr>
                          ))}
                        </tbody>
                      </table>
                   </div>
                </div>
              )}
            </div>

            <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
              <button onClick={() => setImportStep('idle')} className="px-8 py-3 text-slate-500 font-bold hover:bg-slate-200 rounded-xl">إلغاء</button>
              {importStep === 'mapping' && (
                <button onClick={proceedToPreview} disabled={!fieldMapping.name || !fieldMapping.teacherId} className="px-10 py-3 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 shadow-xl disabled:opacity-50">
                  معاينة البيانات
                </button>
              )}
              {importStep === 'preview' && (
                <button onClick={finalizeImport} className="px-10 py-3 bg-emerald-600 text-white font-black rounded-xl hover:bg-emerald-700 shadow-xl">
                  اعتماد المعلمين
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Grid of Teacher Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {teachers.map((teacher) => (
          <div key={teacher.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 group hover:shadow-2xl transition-all relative">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-3 bg-slate-50 rounded-3xl border-2 border-white shadow-inner">
                <QRCodeSVG value={teacher.qrCode} size={100} />
              </div>
              <div>
                <h3 className="font-black text-slate-800 line-clamp-1">{teacher.name}</h3>
                <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">ID: {teacher.teacherId}</div>
                <div className="text-xs text-slate-400 font-bold mt-2 flex items-center justify-center gap-2">
                  <Phone size={12} />
                  {teacher.phone || 'غير مسجل'}
                </div>
              </div>
            </div>
            <button 
              onClick={() => setTeachers(prev => prev.filter(t => t.id !== teacher.id))} 
              className="absolute top-4 left-4 p-2 text-red-200 hover:text-red-500 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
            >
              <Trash2 size={18}/>
            </button>
          </div>
        ))}
        {teachers.length === 0 && (
          <div className="col-span-full py-32 text-center text-slate-300 flex flex-col items-center gap-4">
            <UserSquare2 size={80} strokeWidth={1} />
            <div className="font-black text-xl">لا يوجد ملاحظين مسجلين</div>
            <p className="max-w-xs text-sm font-medium">ابدأ باستيراد ملف المعلمين من Excel أو الإضافة يدوياً.</p>
          </div>
        )}
      </div>

      {/* Manual Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
           <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black text-slate-800">إضافة ملاحظ جديد</h3>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20}/></button>
              </div>
              <div className="space-y-4">
                <input value={newTeacher.name} onChange={e => setNewTeacher({...newTeacher, name: e.target.value})} placeholder="الاسم الرباعي" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold" />
                <input value={newTeacher.teacherId} onChange={e => setNewTeacher({...newTeacher, teacherId: e.target.value})} placeholder="رقم المعلم" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold" />
                <input value={newTeacher.phone} onChange={e => setNewTeacher({...newTeacher, phone: e.target.value})} placeholder="رقم الجوال" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold" />
              </div>
              <div className="flex gap-4 mt-8">
                <button onClick={() => {
                  if (!newTeacher.name || !newTeacher.teacherId) return;
                  setTeachers(prev => [...prev, { id: generateId(), ...newTeacher, qrCode: `TEACHER:${newTeacher.teacherId}` }]);
                  setShowAddModal(false);
                  setNewTeacher({ name: '', teacherId: '', phone: '' });
                }} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100">حفظ المعلم</button>
                <button onClick={() => setShowAddModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black">إلغاء</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default TeachersManagement;
