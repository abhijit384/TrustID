import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  Sparkles, 
  User, 
  ShieldAlert, 
  KeyRound, 
  ArrowRight, 
  CheckCircle2, 
  Loader2, 
  RefreshCw,
  Send,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { Logo } from '../components/Sidebar';

export const Login = () => {
  const navigate = useNavigate();
  const { user, login, registerWithOtp, loginAsAdmin, loginAsUser, loading: authLoading } = useAuth();

  // If already logged in, redirect straight to dashboard
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  // Auth Mode: 'signin' | 'signup'
  const [mode, setMode] = useState('signin');

  // Sign In States
  const [email, setEmail] = useState(() => localStorage.getItem('trustid_remembered_email') || '');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Sign Up States
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [signupStep, setSignupStep] = useState(1); // 1: form, 2: otp
  const [otpCode, setOtpCode] = useState('');
  const [otpTimer, setOtpTimer] = useState(60);
  const [otpPreview, setOtpPreview] = useState(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  // Status & Feedback
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Countdown timer for OTP resend
  useEffect(() => {
    let interval;
    if (signupStep === 2 && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [signupStep, otpTimer]);

  const handleSignInSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (rememberMe) {
      localStorage.setItem('trustid_remembered_email', email);
    } else {
      localStorage.removeItem('trustid_remembered_email');
    }

    const res = await login(email, password);
    if (res.success) {
      navigate('/dashboard');
    } else {
      setError(res.error);
    }
  };

  // Sign Up: Step 1 -> Send Real-Time OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!regName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }
    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match. Please verify your entries.');
      return;
    }

    setIsSendingOtp(true);
    try {
      const response = await authAPI.sendOtp({
        name: regName.trim(),
        email: regEmail.trim(),
        purpose: 'registration'
      });

      if (response.data.preview_otp) {
        setOtpPreview(response.data.preview_otp);
      }
      setSuccessMsg(response.data.message || `Verification OTP sent to ${regEmail}.`);
      setSignupStep(2);
      setOtpTimer(60);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to dispatch verification OTP. Please try again.';
      setError(msg);
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Sign Up: Resend OTP
  const handleResendOtp = async () => {
    if (otpTimer > 0) return;
    setError('');
    setIsSendingOtp(true);
    try {
      const response = await authAPI.sendOtp({
        name: regName.trim(),
        email: regEmail.trim(),
        purpose: 'registration'
      });
      if (response.data.preview_otp) {
        setOtpPreview(response.data.preview_otp);
      }
      setSuccessMsg(`A new OTP has been dispatched to ${regEmail}.`);
      setOtpTimer(60);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to resend OTP.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Sign Up: Step 2 -> Verify OTP & Register
  const handleVerifyOtpAndRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!otpCode.trim() || otpCode.trim().length < 4) {
      setError('Please enter the verification code sent to your email.');
      return;
    }

    const res = await registerWithOtp(regName.trim(), regEmail.trim(), regPassword, otpCode.trim());
    if (res.success) {
      navigate('/dashboard');
    } else {
      setError(res.error);
    }
  };

  const handleQuickDemo = async (roleType) => {
    setError('');
    setSuccessMsg('');
    let res = roleType === 'admin' ? await loginAsAdmin() : await loginAsUser();
    if (res.success) {
      navigate('/dashboard');
    } else {
      setError(res.error);
    }
  };

  return (
    <div className="min-h-screen bg-[#080c14] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-cyan-500 selection:text-black">
      {/* Subtle backdrop glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-4">
          <Logo />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Secure Identity Screening Portal
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          AI-powered multimodal document verification with cryptographic session security
        </p>

        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[11px] font-mono text-cyan-300">
          <Sparkles className="w-3 h-3 text-cyan-400" /> TRUSTID AI • TRUST AI ENGINE
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="glass-panel py-7 px-6 sm:px-8 rounded-2xl border border-slate-800 shadow-2xl space-y-5">
          
          {/* Mode Switcher Tabs: Sign In vs Create Account */}
          <div className="flex rounded-xl bg-slate-900/80 p-1 border border-slate-800">
            <button
              type="button"
              onClick={() => { setMode('signin'); setError(''); setSuccessMsg(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                mode === 'signin'
                  ? 'bg-cyan-500 text-black shadow-glow-cyan font-extrabold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setSignupStep(1); setError(''); setSuccessMsg(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                mode === 'signup'
                  ? 'bg-cyan-500 text-black shadow-glow-cyan font-extrabold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Create Account
            </button>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" />
              <div className="flex-1">{successMsg}</div>
            </div>
          )}

          {/* Dev Preview OTP Toast */}
          {otpPreview && mode === 'signup' && signupStep === 2 && (
            <div className="p-3 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs flex items-center justify-between">
              <span className="font-mono">Security OTP Code: <strong className="text-white text-sm tracking-widest">{otpPreview}</strong></span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-200">Dispatched</span>
            </div>
          )}

          {/* TAB 1: SIGN IN FORM */}
          {mode === 'signin' && (
            <form onSubmit={handleSignInSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Account Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="officer@example.com"
                    className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-400">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-800 text-cyan-500 focus:ring-cyan-500"
                  />
                  <span>Stay logged in</span>
                </label>
                <span className="text-slate-500 text-[11px] font-mono">Auto-Saved Session</span>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-sky-500 via-cyan-500 to-blue-600 text-white shadow-glow-cyan hover:opacity-95 transition-all flex items-center justify-center gap-2"
              >
                {authLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: CREATE ACCOUNT (STEP 1: DETAILS) */}
          {mode === 'signup' && signupStep === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Officer Sarah Jenkins"
                    className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="sarah.jenkins@agency.gov"
                    className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/20"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  A real-time security OTP will be dispatched to this address.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Password (min 6 characters)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showRegPassword ? "text" : "password"}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Create secure password"
                    className="w-full pl-10 pr-10 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showRegPassword ? "text" : "password"}
                    required
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/20"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSendingOtp}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 text-white shadow-glow-cyan hover:opacity-95 transition-all flex items-center justify-center gap-2 mt-2"
              >
                {isSendingOtp ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Checking Email & Sending OTP...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Verification OTP</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: CREATE ACCOUNT (STEP 2: OTP VERIFICATION) */}
          {mode === 'signup' && signupStep === 2 && (
            <form onSubmit={handleVerifyOtpAndRegister} className="space-y-4 animate-in fade-in duration-300">
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-center space-y-1">
                <p className="text-xs text-slate-300">
                  Verification code dispatched to:
                </p>
                <p className="text-xs font-mono font-bold text-cyan-400 break-all">
                  {regEmail}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 text-center">
                  Enter 6-Digit Email OTP
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  autoFocus
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="• • • • • •"
                  className="w-full text-center tracking-[0.5em] text-xl font-mono py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-cyan-300 placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 font-bold"
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => setSignupStep(1)}
                  className="text-slate-400 hover:text-slate-200 transition-colors"
                >
                  ← Edit details
                </button>

                <button
                  type="button"
                  disabled={otpTimer > 0 || isSendingOtp}
                  onClick={handleResendOtp}
                  className={`flex items-center gap-1 font-mono transition-colors ${
                    otpTimer > 0
                      ? 'text-slate-500 cursor-not-allowed'
                      : 'text-cyan-400 hover:underline cursor-pointer'
                  }`}
                >
                  <RefreshCw className={`w-3 h-3 ${isSendingOtp ? 'animate-spin' : ''}`} />
                  {otpTimer > 0 ? `Resend code in ${otpTimer}s` : 'Resend OTP'}
                </button>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-600 text-white shadow-glow-cyan hover:opacity-95 transition-all flex items-center justify-center gap-2"
              >
                {authLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Activating Account...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verify OTP & Launch Workspace</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Quick Demo Account Selector (1-Click) */}
          <div className="pt-4 border-t border-slate-800/80">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block text-center mb-2.5">
              One-Click Demo Access
            </span>
            <div className="grid grid-cols-2 gap-3">
              {/* Administrator */}
              <button
                type="button"
                onClick={() => handleQuickDemo('admin')}
                className="p-3 rounded-xl border border-purple-500/30 bg-purple-950/20 hover:bg-purple-900/30 text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" /> Subhashree Saha
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-semibold">
                    ADMIN
                  </span>
                </div>
                <div className="mt-1.5">
                  <p className="text-[10px] text-slate-300 font-medium">Administrator</p>
                  <p className="text-[10px] font-mono text-slate-400 truncate">demo.admin@example.com</p>
                  <span className="mt-1.5 inline-block text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-amber-300 border border-slate-700">
                    DEMO ACCOUNT
                  </span>
                </div>
              </button>

              {/* User */}
              <button
                type="button"
                onClick={() => handleQuickDemo('user')}
                className="p-3 rounded-xl border border-sky-500/30 bg-sky-950/20 hover:bg-sky-900/30 text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> User
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-semibold">
                    USER
                  </span>
                </div>
                <div className="mt-1.5">
                  <p className="text-[10px] text-slate-300 font-medium">User</p>
                  <p className="text-[10px] font-mono text-slate-400 truncate">demo.user@example.com</p>
                  <span className="mt-1.5 inline-block text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-amber-300 border border-slate-700">
                    DEMO ACCOUNT
                  </span>
                </div>
              </button>
            </div>
            
            <p className="mt-2.5 text-center text-[10px] text-slate-500">
              Demo credentials: <span className="font-mono text-slate-400">Demo@123</span> • Real password authentication enforced
            </p>
          </div>
        </div>

        <div className="mt-4 text-center">
          <Link to="/" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
            ← Back to TRUSTID Overview
          </Link>
        </div>
      </div>
    </div>
  );
};
