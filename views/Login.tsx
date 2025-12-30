import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { LogIn, ShieldCheck, Mail, Lock, Loader2, Sparkles, AlertCircle, UserPlus, UserCircle2, ArrowRight } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [loginType, setLoginType] = useState<'email' | 'id'>('email');
  const [identifier, setIdentifier] = useState(''); 
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState(''); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const finalEmail = loginType === 'id' 
        ? `${identifier}@controlplus.local` 
        : identifier;

      if (isRegistering) {
        // إنشاء حساب جديد أو تحديث بيانات الحساب الحالي
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: finalEmail,
          password: password,
          options: { data: { full_name: fullName || identifier.split('@')[0], role: 'admin' } }
        });

        if (authError) throw authError;
        
        if (authData.user) {
          // تأكيد إنشاء البروفايل كأدمن
          await supabase.from('profiles').upsert({
            id: authData.user.id,
            full_name: fullName || identifier.split('@')[0],
            role: 'admin'
          });
          alert('تم إعداد الحساب بنجاح! يمكنك الآن تسجيل الدخول.');
          setIsRegistering(false);
        }
      } else {
        // تسجيل الدخول العادي
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: finalEmail,
          password,
        });

        if (authError) throw authError;

        // جلب أو إنشاء بروفايل تلقائي لضمان صلاحيات الأدمن
        let { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        if (!profile) {
          const { data: newProfile } = await supabase.from('profiles').upsert({
            id: authData.user.id,
            full_name: authData.user.email?.split('@')[0] || 'مدير النظام',
            role: 'admin'
          }).select().single();
          profile = newProfile;
        }

        onLoginSuccess({ ...authData.user, profile });
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      let msg = 'خطأ في عملية الدخول.';
      if (err.message?.includes('Invalid login credentials')) msg = 'الإيميل أو كلمة المرور غير صحيحة. جرب "إنشاء حساب" إذا كنت قد نسيت كلمة المرور.';
      else if (err.message?.includes('already registered')) msg = 'هذا الحساب موجود بالفعل، جرب تسجيل الدخول مباشرة.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-500/20 rounded-full blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-[120px] animate-float"></div>

      <div className="glass-card w-full max-w-lg p-8 md:p-12 rounded-[2.5rem] relative z-10 animate-in fade-in zoom-in-95 duration-700">
        <div className="text-center mb-8">
          <div className="inline-flex p-5 bg-white rounded-3xl text-indigo-600 shadow-2xl mb-6 ring-1 ring-white/50 animate-float">
            <ShieldCheck size={42} strokeWidth={2.5} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-3">كنترول بلس</h1>
          <p className="text-slate-500 font-bold flex items-center justify-center gap-2">
            <Sparkles size={16} className="text-amber-500" />
            {isRegistering ? 'تفعيل حساب الإدارة' : 'نظام إدارة الاختبارات الموحد'}
          </p>
        </div>

        {!isRegistering && (
          <div className="flex bg-slate-100 p-1 rounded-2xl mb-8">
            <button onClick={() => setLoginType('id')} className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${loginType === 'id' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>دخول برقم المعلم</button>
            <button onClick={() => setLoginType('email')} className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${loginType === 'email' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>البريد الإلكتروني</button>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-5">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs font-bold flex items-center gap-3 animate-shake">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          {isRegistering && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-2">الاسم الكامل</label>
              <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="أدخل اسمك" className="w-full px-6 py-4 bg-white/60 border border-white/50 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/20 font-bold text-slate-800" />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-2">{loginType === 'id' && !isRegistering ? 'الرقم الوظيفي' : 'البريد الإلكتروني'}</label>
            <input type={loginType === 'id' && !isRegistering ? 'text' : 'email'} required value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder={loginType === 'id' && !isRegistering ? '12345' : 'name@school.com'} className="w-full px-6 py-4 bg-white/60 border border-white/50 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/20 font-bold text-slate-800" />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-2">كلمة المرور</label>
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-6 py-4 bg-white/60 border border-white/50 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/20 font-bold text-slate-800" />
          </div>

          <button type="submit" disabled={loading} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-2xl hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-3">
            {loading ? <Loader2 className="animate-spin" size={24} /> : isRegistering ? <UserPlus size={24} /> : <LogIn size={24} />}
            {isRegistering ? 'تفعيل الحساب الآن' : 'دخول النظام'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button onClick={() => { setIsRegistering(!isRegistering); setError(null); }} className="text-indigo-600 font-black text-sm hover:underline flex items-center justify-center gap-2 mx-auto">
            {isRegistering ? <> <ArrowRight size={16} /> العودة لتسجيل الدخول </> : <> <UserPlus size={16} /> ليس لديك حساب؟ أنشئ حساباً جديداً </>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;