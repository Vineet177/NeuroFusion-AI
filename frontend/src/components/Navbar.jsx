import React, { useState } from 'react';
import { 
  Search, 
  Bell, 
  User, 
  ChevronDown, 
  LogOut, 
  Activity, 
  Sparkles, 
  ShieldAlert,
  Brain,
  Menu,
  Sun,
  Moon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { patientApi, filterPatientsByUser } from '../api/patientApi';
import { MOCK_PATIENTS } from '../utils/constants';
import { API_BASE_URL } from '../api/axios';

const Navbar = ({ onToggleSidebar, selectedPatient, setSelectedPatient, onInitiateLogout }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, isDark, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showPatientSelect, setShowPatientSelect] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [patientList, setPatientList] = useState([]);

  React.useEffect(() => {
    if (showPatientSelect) {
      patientApi.getPatients().then((data) => {
        const scoped = filterPatientsByUser(data || [], user);
        setPatientList(scoped);
      });
    }
  }, [showPatientSelect, user]);

  const notifications = [
    { id: 1, text: 'High MCI probability flagged for Rameshwar Patel (81%)', time: '10m ago', urgent: true },
    { id: 2, text: 'New 3D MRI brain scan imported for Sunita Deshmukh', time: '42m ago', urgent: false },
    { id: 3, text: 'EEG Theta/Alpha ratio anomaly alert triggered', time: '2h ago', urgent: true }
  ];

  return (
    <header className="sticky top-0 z-30 w-full liquid-glass-card border-b border-purple-200/40 dark:border-purple-900/30 px-4 lg:px-6 py-3 shadow-xs">
      <div className="flex items-center justify-between">
        
        {/* Left Section: Mobile Toggle & Brand/Search */}
        <div className="flex items-center space-x-3 lg:space-x-6">
          <button 
            onClick={onToggleSidebar} 
            className="lg:hidden p-2 rounded-xl liquid-glass-card hover:border-purple-400 text-slate-700 dark:text-slate-200 transition"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search bar */}
          <div className="relative hidden md:block w-64 lg:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search patient, MRI ID, EEG log..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 rounded-xl text-xs bg-white/60 dark:bg-slate-900/60 border border-purple-200/40 dark:border-purple-900/40 text-[#171321] dark:text-[#F7F7F5] placeholder-slate-400 focus:outline-none focus:border-[#7C3AED] transition"
            />
          </div>
        </div>

        {/* Right Section: Patient Selector, Notifications, User Menu */}
        <div className="flex items-center space-x-3 lg:space-x-4">
          
          {/* Active Patient Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowPatientSelect(!showPatientSelect)}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-xl liquid-glass-card hover:border-purple-400 text-xs transition cursor-pointer"
            >
              <Brain className="w-4 h-4 text-[#7C3AED] dark:text-[#A78BFA]" />
              <div className="text-left hidden sm:block">
                <p className="text-[10px] text-[#6B6875] dark:text-slate-400 uppercase font-semibold">Active Patient</p>
                <p className="font-bold text-[#171321] dark:text-[#F7F7F5]">{selectedPatient ? selectedPatient.name : 'Select Patient'}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
            </button>

            {showPatientSelect && (
              <div className="absolute right-0 mt-2 w-72 liquid-glass-card shadow-2xl rounded-2xl py-2 z-50 border border-purple-200/60 dark:border-purple-900/50">
                <div className="px-3.5 py-1.5 border-b border-purple-100 dark:border-purple-900/40 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#171321] dark:text-slate-200 uppercase">Select Active Patient</span>
                  <span className="text-[10px] text-slate-400">{patientList.length} records</span>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {(patientList.length > 0 ? patientList : MOCK_PATIENTS).map((pat) => (
                    <button
                      key={pat.id}
                      onClick={() => {
                        setSelectedPatient(pat);
                        setShowPatientSelect(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 hover:bg-purple-500/10 transition flex items-center justify-between text-xs cursor-pointer ${
                        selectedPatient?.id === pat.id ? 'bg-purple-500/15 font-bold text-[#7C3AED]' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div>
                        <p className="font-semibold text-[#171321] dark:text-[#F7F7F5]">{pat.name}</p>
                        <p className="text-[10px] text-[#6B6875]">{pat.patient_id} • Age {pat.age}</p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        pat.status === 'High Risk' ? 'bg-rose-100 text-rose-700' :
                        pat.status === 'Moderate Risk' ? 'bg-amber-100 text-amber-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {pat.status || 'Active'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl liquid-glass-card hover:border-purple-400 text-[#171321] dark:text-slate-200 transition cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#7C3AED] animate-pulse" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 liquid-glass-card shadow-2xl rounded-2xl py-2 z-50 border border-purple-200/60 dark:border-purple-900/50">
                <div className="px-4 py-2 border-b border-purple-100 dark:border-purple-900/40 flex items-center justify-between">
                  <span className="text-xs font-bold text-[#171321] dark:text-slate-200">Clinical Alerts</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-[#7C3AED] font-bold">3 Unread</span>
                </div>
                <div className="divide-y divide-purple-100 dark:divide-purple-900/30 max-h-72 overflow-y-auto">
                  {notifications.map((n) => (
                    <div key={n.id} className="p-3 hover:bg-purple-500/5 transition text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-[#6B6875]">{n.time}</span>
                        {n.urgent && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold">Urgent</span>}
                      </div>
                      <p className="text-slate-700 dark:text-slate-200 font-medium">{n.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Profile / Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-1.5 pl-2 rounded-xl liquid-glass-card hover:border-purple-400 transition cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg overflow-hidden bg-gradient-to-br from-[#7C3AED] to-[#A78BFA] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {user?.picture || user?.profile_photo ? (
                  <img 
                    src={(user.picture || user.profile_photo).startsWith('http') || (user.picture || user.profile_photo).startsWith('blob:') ? (user.picture || user.profile_photo) : `${API_BASE_URL}${user.picture || user.profile_photo}`}
                    alt={user?.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  user?.name ? user.name.charAt(0).toUpperCase() : 'U'
                )}
              </div>
              <div className="text-left hidden lg:block pr-1">
                <p className="text-xs font-bold text-[#171321] dark:text-[#F7F7F5] leading-tight">{user?.name || 'Medical Officer'}</p>
                <p className="text-[10px] text-[#7C3AED] dark:text-[#A78BFA] font-bold capitalize">{user?.role || 'Doctor'}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-52 liquid-glass-card shadow-2xl rounded-2xl py-2 z-50 border border-purple-200/60 dark:border-purple-900/50 text-xs">
                <div className="px-3.5 py-2 border-b border-purple-100 dark:border-purple-900/40">
                  <p className="font-bold text-[#171321] dark:text-[#F7F7F5]">{user?.name || 'User'}</p>
                  <p className="text-[11px] text-[#6B6875] truncate">{user?.email || 'user@neurofusion.health'}</p>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/profile');
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-purple-500/10 text-slate-700 dark:text-slate-200 flex items-center space-x-2 cursor-pointer font-medium"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Profile Settings</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      if (onInitiateLogout) {
                        onInitiateLogout();
                      } else {
                        logout();
                        navigate('/');
                      }
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 flex items-center space-x-2 cursor-pointer font-bold"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};

export default Navbar;
