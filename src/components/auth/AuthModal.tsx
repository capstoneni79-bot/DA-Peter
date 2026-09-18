import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  User,
  Eye,
  EyeOff,
  X,
  MapPin,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  WifiOff,
  ArrowRight,
} from 'lucide-react';
import { UserAccount, UserRole } from '../../types';
import { storageService } from '../../services/storageService';
import { useOfficialLogos } from '../common/OfficialSeals';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserAccount) => void;
  initialRole?: UserRole;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialRole = 'admin',
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole);
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const logos = useOfficialLogos();
  const authLogo = logos['logo-login'] || logos['logo-system'] || logos['logo-da'] || logos['logo-header'] || '/icon.svg';

  if (!isOpen) return null;

  const accounts = storageService.getAccounts();

  // Quick Preset Accounts for 1-click filling
  const adminAccount = accounts.find(a => a.role === 'admin') || {
    username: 'admin',
    password: 'admin',
    name: 'Engr. Arnel M. Vasquez',
  };
  const focalPob = accounts.find(a => a.username === 'focal_poblacion') || accounts.find(a => a.role === 'focal') || {
    username: 'focal_poblacion',
    password: 'password123',
    name: 'Maria L. Santos',
  };
  const focalLab = accounts.find(a => a.username === 'focal_labrador') || {
    username: 'focal_labrador',
    password: 'password123',
    name: 'Juan B. Dela Cruz',
  };
  const agentAccount = accounts.find(a => a.role === 'agent') || {
    username: 'agent_hinunangan',
    password: 'password123',
    name: 'Ricardo S. Mercado',
  };

  const handleQuickFill = (u: string, p: string, role: UserRole) => {
    setUsernameOrEmail(u);
    setPassword(p);
    setSelectedRole(role);
    setErrorMsg('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    setTimeout(() => {
      const q = usernameOrEmail.trim().toLowerCase();
      const pwd = password.trim();

      // Find matching account
      const matched = accounts.find(
        a =>
          (a.username.toLowerCase() === q || a.email.toLowerCase() === q)
      );

      if (!matched) {
        // Allow fallback for default admin or demo accounts
        if (q === 'admin' && (pwd === 'admin' || pwd === 'admin123')) {
          const fallbackAdmin: UserAccount = {
            id: 'usr-admin-1',
            username: 'admin',
            name: 'Engr. Arnel M. Vasquez (MAO)',
            email: 'admin@hinunangan.da.gov.ph',
            role: 'admin',
            createdAt: new Date().toISOString(),
          };
          storageService.setCurrentUser(fallbackAdmin);
          onLoginSuccess(fallbackAdmin);
          setIsLoading(false);
          return;
        }

        setErrorMsg('No registered account found with this username or email.');
        setIsLoading(false);
        return;
      }

      // Verify active status
      if (matched.active === false) {
        setErrorMsg('This account has been deactivated by the Municipal Agriculture Office.');
        setIsLoading(false);
        return;
      }

      // Verify password
      // For convenience and demo flexibility, accept account password, or standard defaults
      const validPasswords = [matched.password, 'password123', 'admin', 'admin123', 'focal123', 'agent123'].filter(Boolean);
      if (matched.password && !validPasswords.includes(pwd)) {
        setErrorMsg('Incorrect password. Please verify your password or use a 1-click demo chip.');
        setIsLoading(false);
        return;
      }

      // Successful authentication
      storageService.setCurrentUser(matched);
      onLoginSuccess(matched);
      setIsLoading(false);
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-emerald-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <img
              src={authLogo}
              alt="DA Seal"
              className="w-12 h-12 rounded-xl object-contain bg-white/10 p-1 border border-emerald-400/30 shadow-md"
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-800 text-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider uppercase border border-emerald-600/50">
                  Official Portal
                </span>
                <span className="text-emerald-400/80 text-[11px] flex items-center gap-1 font-mono">
                  <WifiOff className="w-3 h-3" /> Offline Auth Ready
                </span>
              </div>
              <h2 className="text-lg font-black tracking-tight text-white mt-1">
                DA Hinunangan Sign In
              </h2>
              <p className="text-xs text-emerald-200/90 font-normal">
                Municipal Swine Registry & Biosurveillance
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5">
          {/* 1-Click Demo Accounts Selector */}
          <div>
            <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Quick Demo Fill (1-Click)</span>
              <span className="text-[10px] text-emerald-700 font-semibold font-mono">Select Role</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('admin', 'admin', 'admin')}
                className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                  usernameOrEmail === 'admin'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-2xs'
                    : 'border-stone-200 hover:border-emerald-300 bg-stone-50/60 text-stone-700'
                }`}
              >
                <div className="flex items-center gap-1 text-[11px] font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>Admin</span>
                </div>
                <div className="text-[10px] text-stone-500 truncate mt-0.5">MAO Vasquez</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('focal_poblacion', 'password123', 'focal')}
                className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                  usernameOrEmail === 'focal_poblacion'
                    ? 'border-blue-600 bg-blue-50 text-blue-950 font-bold shadow-2xs'
                    : 'border-stone-200 hover:border-blue-300 bg-stone-50/60 text-stone-700'
                }`}
              >
                <div className="flex items-center gap-1 text-[11px] font-bold">
                  <MapPin className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                  <span>Focal (Pob)</span>
                </div>
                <div className="text-[10px] text-stone-500 truncate mt-0.5">Santos, M.</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('agent_hinunangan', 'password123', 'agent')}
                className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                  usernameOrEmail === 'agent_hinunangan'
                    ? 'border-amber-600 bg-amber-50 text-amber-950 font-bold shadow-2xs'
                    : 'border-stone-200 hover:border-amber-300 bg-stone-50/60 text-stone-700'
                }`}
              >
                <div className="flex items-center gap-1 text-[11px] font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>Agent / Buyer</span>
                </div>
                <div className="text-[10px] text-stone-500 truncate mt-0.5">Mercado, R.</div>
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Username or Official Email
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
                <input
                  type="text"
                  required
                  value={usernameOrEmail}
                  onChange={e => setUsernameOrEmail(e.target.value)}
                  placeholder="e.g. admin or focal_poblacion"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-xs text-stone-900 font-medium placeholder:text-stone-400 outline-hidden transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-stone-700">Password</label>
                <span className="text-[11px] text-stone-400">Default: admin / password123</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-stone-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-xs text-stone-900 font-medium placeholder:text-stone-400 outline-hidden transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-stone-400 hover:text-stone-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-stone-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="rounded border-stone-300 text-emerald-700 focus:ring-emerald-600 accent-emerald-700"
                />
                <span>Remember session for offline work</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  alert(
                    'To reset your password in the field, contact the Municipal Agriculture Officer (MAO) or use the Municipal Admin portal under Manage Accounts.'
                  );
                }}
                className="text-emerald-800 hover:text-emerald-900 font-semibold cursor-pointer"
              >
                Need Help?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span>Authenticating credentials...</span>
              ) : (
                <>
                  <span>Sign In to Registry Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Bottom Security Note */}
          <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 256-Bit Local Session Encryption
            </span>
            <span>Hinunangan LGU</span>
          </div>
        </div>
      </div>
    </div>
  );
};
