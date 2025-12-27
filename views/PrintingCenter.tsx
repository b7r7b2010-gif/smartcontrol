
import React from 'react';
import { Printer, QrCode as QrIcon } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Committee, Student, Teacher } from '../types';

interface PrintingCenterProps {
  committees: Committee[];
  students: Student[];
  teachers: Teacher[];
}

const PrintingCenter: React.FC<PrintingCenterProps> = ({ committees, students, teachers }) => {
  const printPage = () => window.print();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between no-print">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">مركز الطباعة والملصقات</h2>
          <p className="text-slate-500">طباعة ملصقات اللجان، الطاولات، ومظاريف الأسئلة</p>
        </div>
        <button 
          onClick={printPage}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-bold shadow-lg shadow-indigo-100"
        >
          <Printer size={20} />
          طباعة الكل
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 no-print">
        <PrintCard title="ملصقات أبواب اللجان" description="ملصق تعريفي كبير لباب القاعة يحتوي على كود QR" icon={<Printer className="text-blue-500" />} />
        <PrintCard title="ملصقات طاولات الطلاب" description="مقاس 3x7 سم مرتبة حسب أرقام الجلوس" icon={<Printer className="text-emerald-500" />} />
        <PrintCard title="استيكرات المظاريف" description="تصميم عرضي احترافي يحتوي بيانات اللجنة والملاحظ" icon={<Printer className="text-orange-500" />} />
      </div>

      {/* Printing Preview Area */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 print:border-none print:p-0">
        <h3 className="font-bold text-slate-800 mb-8 border-b pb-4 no-print">معاينة قبل الطباعة</h3>
        
        <div className="space-y-20">
          {committees.map((committee) => (
            <div key={committee.id} className="page-break-after">
              {/* Door Label */}
              <div className="border-[4px] border-slate-900 p-8 flex flex-col items-center text-center space-y-6 max-w-2xl mx-auto mb-20 bg-white">
                <div className="text-4xl font-black border-b-4 border-slate-900 pb-4 w-full">ملصق لجنة اختبار</div>
                <div className="grid grid-cols-2 w-full gap-8 py-4">
                  <div className="text-right space-y-2">
                    <div className="text-lg text-slate-500 font-bold">رقم اللجنة</div>
                    <div className="text-5xl font-black">{committee.name}</div>
                  </div>
                  <div className="text-right space-y-2">
                    <div className="text-lg text-slate-500 font-bold">مقر اللجنة</div>
                    <div className="text-5xl font-black">{committee.roomName}</div>
                  </div>
                </div>
                <div className="text-2xl font-bold bg-slate-100 px-6 py-2 rounded-full">إجمالي الطلاب: {committee.studentIds.length}</div>
                <div className="flex items-center justify-center p-4 border-2 border-slate-200 rounded-2xl">
                  <QRCodeSVG value={`COMMITTEE:${committee.id}`} size={200} />
                </div>
                <div className="text-slate-400 font-mono">SCAN TO RECEIVE ENVELOPE</div>
              </div>

              {/* Desk Stickers 3x7 Grid */}
              <div className="grid grid-cols-3 gap-2 py-10 border-t-2 border-dashed border-slate-200">
                {students.filter(s => s.committeeId === committee.id).map((student, i) => (
                  <div key={student.id} className="border border-slate-400 p-2 h-[3cm] w-full flex flex-col justify-between items-center bg-white">
                    <div className="text-[10px] font-bold text-slate-500 self-start">{committee.name}</div>
                    <div className="text-sm font-black text-center leading-tight">{student.name}</div>
                    <div className="flex justify-between w-full items-end">
                       <div className="text-[10px] font-bold px-1 bg-slate-100">{student.grade}</div>
                       <div className="text-sm font-black text-indigo-600">رقم: {100 + i}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Envelope Label */}
              <div className="mt-20 border-2 border-slate-800 p-6 flex items-center gap-10 bg-slate-50 max-w-4xl mx-auto rounded-lg">
                <div className="flex-1 space-y-4">
                  <div className="text-2xl font-black">مظروف أسئلة الاختبارات</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-slate-400 font-bold">اسم اللجنة</div>
                      <div className="text-lg font-bold">{committee.name}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 font-bold">المقر</div>
                      <div className="text-lg font-bold">{committee.roomName}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 font-bold">عدد الطلاب</div>
                      <div className="text-lg font-bold">{committee.studentIds.length} طالب</div>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-2 border border-slate-200 rounded shadow-sm">
                  <QRCodeSVG value={`ENVELOPE:${committee.id}`} size={120} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const PrintCard: React.FC<{ title: string; description: string; icon: React.ReactNode }> = ({ title, description, icon }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 flex items-start gap-4 hover:border-indigo-300 transition-colors cursor-pointer">
    <div className="p-3 bg-slate-50 rounded-xl">{icon}</div>
    <div>
      <h4 className="font-bold text-slate-800">{title}</h4>
      <p className="text-xs text-slate-500 mt-1">{description}</p>
    </div>
  </div>
);

export default PrintingCenter;
