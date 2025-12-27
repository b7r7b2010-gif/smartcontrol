
import React, { useState, useRef } from 'react';
import { QrCode, ClipboardCheck, ScanLine, Search, Bell, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Committee, Student, AttendanceLog, Teacher } from '../types';

interface LiveExamViewProps {
  committees: Committee[];
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  attendanceLogs: AttendanceLog[];
  setAttendanceLogs: React.Dispatch<React.SetStateAction<AttendanceLog[]>>;
  teachers: Teacher[];
}

const LiveExamView: React.FC<LiveExamViewProps> = ({ committees, students, setStudents, attendanceLogs, setAttendanceLogs, teachers }) => {
  const [activeCommittee, setActiveCommittee] = useState<Committee | null>(null);
  const [scanMode, setScanMode] = useState<'envelope' | 'student' | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const committeeStudents = activeCommittee 
    ? students.filter(s => s.committeeId === activeCommittee.id)
    : [];

  const handleScanEnvelope = () => {
    setScanMode('envelope');
    // Simulate QR Scan
    setTimeout(() => {
      const randomCommittee = committees[0];
      if (randomCommittee) {
        setActiveCommittee(randomCommittee);
        setSuccessMessage(`تم استلام مظروف ${randomCommittee.name} بنجاح!`);
        setScanMode(null);
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    }, 2000);
  };

  const handleMarkAttendance = (studentId: string, status: 'present' | 'absent') => {
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, status } : s));
    
    if (status === 'absent') {
      // Simulate SMS alert to guardian and school administration
      const newLog: AttendanceLog = {
        studentId,
        committeeId: activeCommittee?.id || '',
        timestamp: new Date().toISOString(),
        status: 'absent',
        notified: true
      };
      setAttendanceLogs(prev => [newLog, ...prev]);
      alert(`تنبيه: تم إرسال رسالة غياب فورية لولي أمر الطالب: ${students.find(s => s.id === studentId)?.name}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">العمليات الحية (واجهة الملاحظ)</h2>
          <p className="text-slate-500">استلام مظاريف، تحضير الطلاب، وتتبع غياب فوري</p>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 animate-bounce">
          <CheckCircle2 size={20} />
          <span className="font-bold">{successMessage}</span>
        </div>
      )}

      {!activeCommittee ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm border border-slate-200">
          <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-6">
            <ScanLine size={48} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">امسح رمز QR الخاص بالمظروف للبدء</h3>
          <p className="text-slate-500 mb-8 max-w-md text-center">قم بتوجيه الكاميرا إلى رمز الاستجابة السريعة (QR) الموجود على مظروف الأسئلة لفتح واجهة اللجنة</p>
          <button 
            onClick={handleScanEnvelope}
            className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all font-black text-lg shadow-xl shadow-indigo-200"
          >
            {scanMode === 'envelope' ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                جاري مسح الرمز...
              </>
            ) : (
              <>
                <QrCode size={24} />
                فتح الكاميرا والمسح
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">قائمة طلاب {activeCommittee.name}</h3>
                  <p className="text-sm text-slate-500">قم بتسجيل حضور وغياب الطلاب</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xs text-slate-400 font-bold uppercase">المسجل حضوره</div>
                    <div className="text-xl font-black text-emerald-600">{committeeStudents.filter(s => s.status === 'present').length} / {committeeStudents.length}</div>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs font-bold border-b border-slate-100">
                      <th className="p-4">اسم الطالب</th>
                      <th className="p-4">الصف</th>
                      <th className="p-4">رقم الجلوس</th>
                      <th className="p-4">الحالة / التحضير</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {committeeStudents.map((student, i) => (
                      <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-bold text-slate-800">{student.name}</td>
                        <td className="p-4 text-xs text-slate-600">{student.grade}</td>
                        <td className="p-4 font-mono text-indigo-600 font-bold">#{100 + i}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleMarkAttendance(student.id, 'present')}
                              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border transition-all ${
                                student.status === 'present' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-slate-400 border-slate-200 hover:border-emerald-500'
                              }`}
                            >
                              <CheckCircle2 size={16} />
                              <span className="text-xs font-bold">حاضر</span>
                            </button>
                            <button 
                              onClick={() => handleMarkAttendance(student.id, 'absent')}
                              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border transition-all ${
                                student.status === 'absent' ? 'bg-red-500 text-white border-red-500 shadow-lg' : 'bg-white text-slate-400 border-slate-200 hover:border-red-500'
                              }`}
                            >
                              <XCircle size={16} />
                              <span className="text-xs font-bold">غائب</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <button 
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-lg hover:bg-black transition-all shadow-xl flex items-center justify-center gap-3"
              onClick={() => {
                alert('تم تسليم المظروف لكنترول الاختبارات بنجاح!');
                setActiveCommittee(null);
              }}
            >
              <ClipboardCheck size={24} />
              إنهاء اللجنة وتسليم المظروف
            </button>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h4 className="font-black text-slate-800 mb-4 flex items-center gap-2">
                <AlertCircle className="text-orange-500" size={18} />
                تعليمات اللجنة
              </h4>
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></span>
                  تأكد من مطابقة اسم الطالب مع رقم الهوية الوطنية.
                </li>
                <li className="flex gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></span>
                  عند تسجيل غياب، سيتم إشعار ولي الأمر آلياً.
                </li>
                <li className="flex gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></span>
                  لا يمكن تعديل حالة الطالب بعد إغلاق اللجنة.
                </li>
              </ul>
            </div>

            <div className="bg-indigo-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
              <QrCode className="absolute -bottom-4 -right-4 text-indigo-800 w-32 h-32 opacity-20" />
              <div className="relative z-10">
                <h4 className="font-bold mb-2">تتبع المظروف</h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                    <div className="text-xs opacity-80">تم الخروج من الكنترول: 07:30 ص</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                    <div className="text-xs opacity-80">استلام الملاحظ: 07:45 ص</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></div>
                    <div className="text-xs font-bold">الحالة: قيد الاختبار</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveExamView;
