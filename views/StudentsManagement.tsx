
import React, { useState, useRef, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  Plus, 
  Filter, 
  Search, 
  MoreVertical, 
  Trash2, 
  CheckCircle2, 
  X, 
  Table as TableIcon,
  ChevronLeft,
  ChevronRight,
  ArrowDownAz,
  Users,
  Settings2,
  ListFilter,
  Eraser,
  Phone
} from 'lucide-react';
import { Student } from '../types';
import { generateId, sortByGradeLevel, readWorkbook, getSheetData, mapFieldsToStudents } from '../utils';
import * as XLSX from 'xlsx';

interface StudentsManagementProps {
  students: Student[];
  setStudents: (newData: Student[] | ((prev: Student[]) => Student[])) => void;
}

type ImportStep = 'idle' | 'selecting_sheet' | 'mapping' | 'preview';

const StudentsManagement: React.FC<StudentsManagementProps> = ({ students, setStudents }) => {
  const [filterGrade, setFilterGrade] = useState('الكل');
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [importStep, setImportStep] = useState<ImportStep>('idle');
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [availableSheets, setAvailableSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({
    name: '',
    nationalId: '',
    grade: '',
    section: '',
    phone: ''
  });
  const [previewData, setPreviewData] = useState<Student[]>([]);

  // استخراج الصفوف الفريدة للفلترة
  const grades = useMemo(() => ['الكل', ...Array.from(new Set(students.map(s => s.grade)))], [students]);

  // الطلاب المفلترون والمرتبون (حسب الصف ثم أبجدياً)
  const processedStudents = useMemo(() => {
    let result = students;
    
    if (filterGrade !== 'الكل') {
      result = result.filter(s => s.grade === filterGrade);
    }
    
    if (searchQuery) {
      result = result.filter(s => s.name.includes(searchQuery) || s.nationalId.includes(searchQuery));
    }
    
    return sortByGradeLevel(result);
  }, [students, filterGrade, searchQuery]);

  const handleClearDatabase = () => {
    if (window.confirm('⚠️ تحذير: هل أنت متأكد من مسح جميع بيانات الطلاب من القاعدة السحابية؟ لا يمكن التراجع عن هذا الإجراء.')) {
      setStudents([]);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const wb = await readWorkbook(file);
      setWorkbook(wb);
      setAvailableSheets(wb.SheetNames);
      setSelectedSheet(wb.SheetNames[0]);
      setImportStep('selecting_sheet');
    } catch (error) {
      alert('خطأ في قراءة الملف');
    }
  };

  const proceedToMapping = () => {
    if (!workbook || !selectedSheet) return;
    const worksheet = workbook.Sheets[selectedSheet];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    const excelHeaders = (jsonData[0] || []).map(h => String(h));
    setHeaders(excelHeaders);
    const autoMapping = { ...fieldMapping };
    excelHeaders.forEach(h => {
      const header = h.trim();
      if (header.includes('اسم')) autoMapping.name = h;
      if (header.includes('هوية') || header.includes('سجل') || header.includes('رقم الطالب')) autoMapping.nationalId = h;
      if (header.includes('صف') || header.includes('مرحلة')) autoMapping.grade = h;
      if (header.includes('فصل')) autoMapping.section = h;
      if (header.includes('جوال') || header.includes('هاتف') || header.includes('موبايل')) autoMapping.phone = h;
    });
    setFieldMapping(autoMapping);
    setImportStep('mapping');
  };

  const proceedToPreview = () => {
    if (!workbook || !selectedSheet) return;
    const rawData = getSheetData(workbook, selectedSheet);
    const mapped = mapFieldsToStudents(rawData, fieldMapping);
    setPreviewData(mapped);
    setImportStep('preview');
  };

  const finalizeImport = () => {
    setStudents(prev => [...prev, ...previewData]);
    resetImport();
    alert(`تم استيراد ${previewData.length} طالب بنجاح مع أرقام الجوال.`);
  };

  const resetImport = () => {
    setImportStep('idle');
    setWorkbook(null);
    setPreviewData([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800">إدارة الطلاب والبيانات</h2>
          <p className="text-slate-500 font-medium">عرض مرتب حسب الصف وأبجدياً مع ربط الجوال سحابياً</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".xlsx, .xls" className="hidden" />
          
          <button 
            onClick={handleClearDatabase}
            className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all border border-red-100 shadow-sm"
            title="تصفير قاعدة البيانات"
          >
            <Eraser size={22} />
          </button>

          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all font-bold shadow-xl shadow-emerald-100"
          >
            <FileSpreadsheet size={20} />
            استيراد Excel
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all font-bold shadow-xl shadow-indigo-100">
            <Plus size={20} />
            إضافة يدوي
          </button>
        </div>
      </div>

      {/* Import Wizard Modal */}
      {importStep !== 'idle' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xl font-black text-slate-800">معالج الاستيراد السحابي</h3>
              <button onClick={resetImport} className="p-3 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8">
               {importStep === 'selecting_sheet' && (
                <div className="space-y-8 py-10">
                  <div className="text-center space-y-2">
                    <h4 className="text-lg font-black text-slate-700">اختر ورقة البيانات المناسبة</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                    {availableSheets.map(sheet => (
                      <button
                        key={sheet}
                        onClick={() => setSelectedSheet(sheet)}
                        className={`p-6 rounded-3xl border-2 transition-all text-right flex items-center justify-between ${
                          selectedSheet === sheet ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-100 bg-white text-slate-600'
                        }`}
                      >
                        <span className="font-bold">{sheet}</span>
                        {selectedSheet === sheet && <CheckCircle2 size={22} className="text-indigo-600" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {importStep === 'mapping' && (
                <div className="space-y-8">
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-amber-800 text-sm font-bold flex gap-3">
                    <Settings2 size={20}/> تأكد من ربط حقل "الجوال" بشكل صحيح لضمان تفعيل تنبيهات الغياب.
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {['name', 'nationalId', 'grade', 'section', 'phone'].map(key => (
                      <div key={key} className="space-y-2">
                        <label className="text-sm font-black text-slate-700 capitalize">
                          {key === 'name' ? 'اسم الطالب' : key === 'nationalId' ? 'رقم الهوية' : key === 'grade' ? 'الصف' : key === 'section' ? 'الفصل' : 'رقم الجوال'}
                        </label>
                        <select
                          value={fieldMapping[key]}
                          onChange={(e) => setFieldMapping({...fieldMapping, [key]: e.target.value})}
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                        >
                          <option value="">-- اختر العمود من ملف Excel --</option>
                          {headers.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {importStep === 'preview' && (
                <div className="space-y-4">
                  <div className="text-sm font-bold text-slate-500">معاينة أول 10 طلاب (تأكد من ظهور رقم الجوال):</div>
                  <div className="border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                    <table className="w-full text-right text-sm">
                        <thead className="bg-slate-50 border-b border-slate-100">
                          <tr>
                            <th className="p-4 font-black">الاسم</th>
                            <th className="p-4 font-black">رقم الهوية</th>
                            <th className="p-4 font-black">الجوال</th>
                          </tr>
                        </thead>
                        <tbody>
                          {previewData.slice(0, 10).map((s, i) => (
                            <tr key={i} className="border-b border-slate-50">
                              <td className="p-4 font-bold">{s.name}</td>
                              <td className="p-4 font-mono">{s.nationalId}</td>
                              <td className="p-4 text-emerald-600 font-bold">{s.phone || '---'}</td>
                            </tr>
                          ))}
                        </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-4">
              <button onClick={resetImport} className="px-8 py-3 text-slate-500 font-black hover:bg-slate-200 rounded-2xl">إلغاء</button>
              {importStep === 'selecting_sheet' && <button onClick={proceedToMapping} className="px-10 py-3 bg-indigo-600 text-white font-black rounded-2xl">التالي</button>}
              {importStep === 'mapping' && <button onClick={proceedToPreview} className="px-10 py-3 bg-indigo-600 text-white font-black rounded-2xl">معاينة</button>}
              {importStep === 'preview' && <button onClick={finalizeImport} className="px-10 py-3 bg-emerald-600 text-white font-black rounded-2xl">اعتماد الاستيراد</button>}
            </div>
          </div>
        </div>
      )}

      {/* Main Students Table */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50/20">
          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="بحث باسم الطالب أو الهوية..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-12 pl-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium" 
              />
            </div>
            <select value={filterGrade} onChange={(e) => setFilterGrade(e.target.value)} className="bg-white border border-slate-200 rounded-2xl text-sm px-6 py-3 font-bold text-slate-600">
              {grades.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="text-sm font-black bg-white px-6 py-3 rounded-2xl border border-slate-100 flex items-center gap-3">
            <Users size={18} className="text-indigo-500" />
            <span className="text-slate-500">إجمالي المعروض:</span>
            <span className="text-indigo-600 text-lg">{processedStudents.length}</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-xs font-black border-b border-slate-100 uppercase tracking-widest">
                <th className="p-6">اسم الطالب</th>
                <th className="p-6">الهوية</th>
                <th className="p-6">الجوال</th>
                <th className="p-6">الصف / الفصل</th>
                <th className="p-6 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {processedStudents.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50/50 group">
                  <td className="p-6 font-black text-slate-800 text-sm">{student.name}</td>
                  <td className="p-6 font-mono text-xs text-slate-500">{student.nationalId}</td>
                  <td className="p-6">
                    {student.phone ? (
                      <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs">
                        <Phone size={14}/> {student.phone}
                      </div>
                    ) : (
                      <span className="text-slate-300 text-[10px] font-bold">لا يوجد رقم</span>
                    )}
                  </td>
                  <td className="p-6">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-xl text-[10px] font-black border border-indigo-100">
                      {student.grade} / {student.section}
                    </span>
                  </td>
                  <td className="p-6 text-center">
                    <button 
                      onClick={() => setStudents(prev => prev.filter(s => s.id !== student.id))} 
                      className="p-3 hover:bg-red-50 rounded-xl text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {processedStudents.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-32 text-center text-slate-300 font-bold flex flex-col items-center gap-4">
                    <Users size={48} strokeWidth={1}/>
                    <span>لم يتم العثور على طلاب مطابقين</span>
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

export default StudentsManagement;
