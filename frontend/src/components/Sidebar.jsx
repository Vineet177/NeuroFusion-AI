import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Upload, 
  Activity, 
  FileSpreadsheet, 
  FileText, 
  User, 
  LogOut, 
  BrainCircuit, 
  X,
  Sparkles,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';

const Sidebar = ({ isOpen, onClose, onInitiateLogout }) => {
  const { user, logout } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const isAdmin = String(user?.role || '').trim().toLowerCase() === 'admin';

  const allNavItems = [
    {
      name: isAdmin ? 'Admin Dashboard' : 'Doctor Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      roles: ['Admin', 'Doctor']
    },
    {
      name: 'Patients',
      path: '/patients',
      icon: Users,
      roles: ['Admin', 'Doctor']
    },
    {
      name: 'MRI Upload',
      path: '/mri-upload',
      icon: Upload,
      roles: ['Admin']
    },
    {
      name: 'EEG Upload',
      path: '/eeg-upload',
      icon: Activity,
      roles: ['Admin']
    },
    {
      name: 'MRI Analysis',
      path: '/mri-analysis',
      icon: Upload,
      roles: ['Doctor']
    },
    {
      name: 'EEG Analysis',
      path: '/eeg-analysis',
      icon: Activity,
      roles: ['Doctor']
    },
    {
      name: isAdmin ? 'Cognitive Score Entry' : 'Cognitive Assessment',
      path: '/cognitive-test',
      icon: FileSpreadsheet,
      roles: ['Admin', 'Doctor']
    },
    {
      name: 'AI Diagnostic Results',
      path: '/prediction-result',
      icon: Sparkles,
      roles: ['Admin', 'Doctor']
    },
    {
      name: 'Reports',
      path: '/reports',
      icon: FileText,
      roles: ['Admin', 'Doctor']
    },
    {
      name: 'Profile',
      path: '/profile',
      icon: User,
      roles: ['Admin', 'Doctor']
    }
  ];

  const currentRole = isAdmin ? 'Admin' : 'Doctor';
  const navItems = allNavItems.filter((item) => item.roles.includes(currentRole));

  const handleLogout = () => {
    if (onClose) onClose();
    if (onInitiateLogout) {
      onInitiateLogout();
    } else {
      logout();
      navigate('/');
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      <aside className={`fixed lg:static top-0 left-0 z-50 h-screen w-64 liquid-glass-card border-r border-purple-200/40 dark:border-purple-900/30 flex flex-col justify-between transition-transform duration-200 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        
        {/* Top Brand Header */}
        <div>
          <div className="flex items-center justify-between px-5 py-4 border-b border-purple-200/30 dark:border-purple-900/30">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#A78BFA] text-white shadow-md shadow-purple-500/20">
                <BrainCircuit className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-extrabold tracking-tight text-[#171321] dark:text-[#F7F7F5] flex items-center gap-1">
                  Neuro<span className="text-[#7C3AED] dark:text-[#A78BFA]">Fusion</span>
                </h1>
                <p className="text-[10px] text-[#6B6875] dark:text-slate-400 font-bold tracking-wider uppercase">Clinical AI Core</p>
              </div>
            </div>

            <button onClick={onClose} className="lg:hidden p-1 text-slate-400 hover:text-slate-700">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 py-4 space-y-1">
            <div className="px-3 pb-2 text-[10px] font-bold text-[#6B6875] dark:text-slate-500 uppercase tracking-widest">
              {isAdmin ? 'Admin Navigation' : 'Clinical Navigation'}
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => onClose && onClose()}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'glass-btn-primary shadow-md shadow-purple-500/25'
                        : 'text-[#6B6875] dark:text-slate-300 hover:text-[#171321] dark:hover:text-white hover:bg-purple-500/10'
                    }`
                  }
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </div>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions & Logout */}
        <div className="p-4 border-t border-purple-200/30 dark:border-purple-900/30 space-y-2.5">
          
          {/* Theme Mode Switcher */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl liquid-glass-card hover:border-purple-400 text-xs font-semibold text-[#171321] dark:text-slate-200 transition cursor-pointer"
          >
            <div className="flex items-center space-x-2">
              {isDark ? (
                <Moon className="w-4 h-4 text-[#A78BFA]" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500" />
              )}
              <span>Theme Mode</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-purple-500/10 dark:bg-purple-900/50 text-[#7C3AED] dark:text-[#A78BFA]">
              {isDark ? 'Dark' : 'Light'}
            </span>
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50/60 dark:hover:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/50 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-600" />
            <span>Sign Out</span>
          </button>

        </div>

      </aside>
    </>
  );
};

export default Sidebar;
