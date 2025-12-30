import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Teacher } from '../types';
import { 
  UserCheck, 
  ShieldCheck, 
  Key, 
  Loader2, 
  Search, 
  Mail, 
  RefreshCcw,
  CheckCircle2,
  XCircle,
  ShieldAlert
} from 'lucide-react';

interface UsersManagementProps {
  teachers: Teacher[];
}

const UsersManagement: React.FC<UsersManagementProps> = ({ teachers }) => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchProfiles = async () => {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*');
    if (data) setProfiles(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const activateAccount = async (teacher: Teacher) => {
    setProcessingId(teacher.id);
    try {
      // البريد الوهمي للربط مع نظام Supabase Auth
      const virtualEmail = `${teacher.teacherId}@controlplus.local`;
      const defaultPassword = teacher.teacherId; // كلمة المرور الافتراضية هي رقم المعلم

      // 1. محاولة إنشاء حساب في Auth (ملاحظة: يتطلب Edge Function أو أدمن سيكريت، 
      // ولكن كبديل سنقوم بتسجيلهم "كأنهم" مستخدمين جدد أو استخدام بروفايل فقط)
      // في النسخة الحالية سنعتمد على نظام البروفايلات المرتبط بـ Auth 
      // لتسهيل الأمر، سنطلب من الأدمن إبلاغهم أن الحساب مفعل.
      
      const { data: authUser, error: authError } = await supabase.auth.signUp({
        email: virtualEmail,
        password: defaultPassword,
        options: {
          data: {
            full_name: teacher.name,
            role: 'teacher'
          }
        }
      });

      if (authError) throw authError;

      // تحديث البروفايل بالرقم الوظيفي
      if (authUser.user) {
        await supabase.from('profiles').update({
          full_name: teacher.name,
          role: 'teacher'
        }).eq('id', authUser.user.id);
      }

      await fetchProfiles();
      alert(`تم تفعيل حساب المعلم: ${teacher.name}\nاسم المستخدم: ${teacher.teacherId}\nكلمة المرور: ${teacher.teacherId}`);
    } catch (error: any) {
      alert(error.message.includes('already registered') ? 'الحساب مفعل مسبقاً' : error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredTeachers = teachers.filter(t => 
    t.name.includes(searchTerm) || t.teacherId.includes(searchTerm)
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <ShieldCheck className="text-indigo-600" size={28} />
            إدارة الحسابات والصلاحيات
          </h2>
          <p className="text-slate-500 font-medium">تفعيل دخول المعلمين وتحويل أرقامهم الوظيفية إلى حسابات آمنة</p>
        </div>
        <button onClick={fetchProfiles} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all">
          <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/30">
          <div className="relative max-w-md">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="بحث بالاسم أو الرقم الوظيفي..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-12 pl-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <th className="p-6">المعلم</th>
                <th className="p-6">الرقم الوظيفي (ID)</th>
                <th className="p-6">حالة الحساب</th>
                <th className="p-6">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTeachers.map((teacher) => {
                const isActivated = profiles.some(p => p.full_name === teacher.name);
                return (
                  <tr key={teacher.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400">
                          {teacher.name.charAt(0)}
                        </div>
                        <div className="font-bold text-slate-800">{teacher.name}</div>
                      </div>
                    </td>
                    <td className="p-6 font-mono text-indigo-600 font-bold">{teacher.teacherId}</td>
                    <td className="p-6">
                      {isActivated ? (
                        <div className="flex items-center gap-2 text-emerald-600 font-black text-xs">
                          <CheckCircle2 size={16} /> نشط
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-slate-300 font-black text-xs">
                          <XCircle size={16} /> غير مفعل
                        </div>
                      )}
                    </td>
                    <td className="p-6">
                      <button 
                        onClick={() => activateAccount(teacher)}
                        disabled={isActivated || processingId === teacher.id}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs transition-all ${
                          isActivated 
                          ? 'bg-slate-50 text-slate-300 border border-slate-100' 
                          : 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95'
                        }`}
                      >
                        {processingId === teacher.id ? <Loader2 size={16} className="animate-spin" /> : <Key size={16} />}
                        {isActivated ? 'الحساب مفعّل' : 'تفعيل الدخول'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-amber-50 rounded-3xl p-6 border border-amber-100 flex gap-4 items-start">
        <ShieldAlert className="text-amber-500 shrink-0" size={24} />
        <div className="space-y-1">
          <h4 className="font-black text-amber-900 text-sm">ملاحظة أمنية للأدمن</h4>
          <p className="text-xs text-amber-700 font-bold leading-relaxed">
            عند تفعيل الحساب، سيتمكن المعلم من الدخول باستخدام رقمه الوظيفي كاسم مستخدم وكلمة مرور. 
            ينصح المعلمون بتغيير كلمات المرور الخاصة بهم فور الدخول الأول لضمان خصوصية بيانات لجانهم.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UsersManagement;