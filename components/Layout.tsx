
import React, { useState, useEffect } from 'react';
import { Home, Wand2, MessageSquare, Zap, Settings, MoreVertical, Moon, Sun, HardDrive, User, LogOut, Cloud, Check } from 'lucide-react';
import { AppView, UserProfile } from '../types';
import { StorageModal } from './StorageModal';

interface LayoutProps {
  children: React.ReactNode;
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  user: UserProfile;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, onNavigate, user, onLogout }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showStorage, setShowStorage] = useState(false);
  const [isSynced, setIsSynced] = useState(true);

  // Swipe State
  const [touchStart, setTouchStart] = useState<{x: number, y: number} | null>(null);
  const [touchEnd, setTouchEnd] = useState<{x: number, y: number} | null>(null);

  // Simulate Cloud Sync Pulse
  useEffect(() => {
    const interval = setInterval(() => {
        setIsSynced(false);
        setTimeout(() => setIsSynced(true), 2000);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: AppView.DASHBOARD, label: 'Home', icon: Home },
    { id: AppView.WIZARD, label: 'Builder', icon: Wand2 },
    { id: AppView.TOOLS, label: 'Tools', icon: Zap },
    { id: AppView.CHAT, label: 'Coach', icon: MessageSquare },
  ];

  const toggleTheme = (mode: 'light' | 'dark' | 'system') => {
      if (mode === 'dark') {
          document.documentElement.classList.add('dark');
          localStorage.setItem('theme', 'dark');
      } else if (mode === 'light') {
          document.documentElement.classList.remove('dark');
          localStorage.setItem('theme', 'light');
      } else {
          localStorage.removeItem('theme');
          if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
              document.documentElement.classList.add('dark');
          } else {
              document.documentElement.classList.remove('dark');
          }
      }
      setShowMenu(false);
  };

  // Initialize theme on mount
  React.useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // --- Swipe Handlers ---
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({
        x: e.targetTouches[0].clientX,
        y: e.targetTouches[0].clientY
    });
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({
        x: e.targetTouches[0].clientX,
        y: e.targetTouches[0].clientY
    });
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const xDistance = touchStart.x - touchEnd.x;
    const yDistance = touchStart.y - touchEnd.y;

    if (Math.abs(xDistance) > minSwipeDistance && Math.abs(xDistance) > Math.abs(yDistance)) {
        const isLeftSwipe = xDistance > 0;
        const isRightSwipe = xDistance < 0;

        const currentIndex = navItems.findIndex(item => item.id === currentView);
        let nextIndex = currentIndex;

        if (isLeftSwipe && currentIndex < navItems.length - 1) {
            // Swipe Left -> Go Next
            nextIndex = currentIndex + 1;
        } 
        
        if (isRightSwipe && currentIndex > 0) {
            // Swipe Right -> Go Previous
            nextIndex = currentIndex - 1;
        }

        if (nextIndex !== currentIndex) {
            onNavigate(navItems[nextIndex].id);
        }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex justify-center transition-colors duration-200">
      {/* Mobile container simulation */}
      <div 
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className="w-full max-w-md bg-white dark:bg-gray-800 h-[100dvh] flex flex-col shadow-2xl relative overflow-hidden transition-colors duration-200 touch-pan-y"
      >
        
        {/* Header */}
        <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 shadow-md z-20 flex items-center justify-between shrink-0 relative">
          <div className="flex items-center gap-2">
             <div className="bg-white/20 p-1.5 rounded-lg">
                <Wand2 size={18} className="text-white" />
             </div>
             <h1 className="text-lg font-bold tracking-tight">FunnelMate AI</h1>
          </div>
          
          <div className="flex items-center gap-3">
              {/* Cloud Sync Indicator */}
              <div className="flex items-center gap-1.5 bg-black/20 px-2 py-1 rounded-full border border-white/5 backdrop-blur-sm">
                 <Cloud size={10} className="text-blue-200" />
                 <span className="text-[10px] font-medium text-blue-100 flex items-center gap-1">
                    {isSynced ? 'Saved' : 'Syncing...'}
                    {isSynced && <Check size={8} className="text-green-400" />}
                 </span>
              </div>

              <button onClick={() => setShowMenu(!showMenu)} className="p-1 hover:bg-white/10 rounded-full transition-colors relative">
                  <MoreVertical size={20} className="text-white" />
              </button>
          </div>

          {/* Unified Settings Dropdown */}
          {showMenu && (
              <div className="absolute top-14 right-4 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 w-64 z-50 animate-in fade-in slide-in-from-top-2 overflow-hidden">
                  
                  {/* Profile Section */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 overflow-hidden border border-gray-200 dark:border-gray-700 shrink-0">
                           <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{user.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                          {user.plan === 'pro' && (
                             <span className="inline-block mt-1 text-[10px] bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded font-bold">PRO PLAN</span>
                          )}
                      </div>
                  </div>

                  {/* Menu Items */}
                  <div className="p-2 space-y-1">
                      {/* Data Section */}
                      <div className="px-3 py-2 mt-1 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Data</div>
                      <button 
                        onClick={() => { setShowStorage(true); setShowMenu(false); }} 
                        className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2.5 text-gray-700 dark:text-gray-200 transition-colors"
                      >
                          <HardDrive size={16} className="text-gray-500 dark:text-gray-400" /> 
                          <span>Local Backup</span>
                      </button>

                      <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
                      
                      {/* Appearance Section */}
                      <div className="px-3 py-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Appearance</div>
                      <button onClick={() => toggleTheme('light')} className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2.5 text-gray-700 dark:text-gray-200 transition-colors">
                          <Sun size={16} className="text-gray-500 dark:text-gray-400" /> 
                          <span>Light Mode</span>
                      </button>
                      <button onClick={() => toggleTheme('dark')} className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2.5 text-gray-700 dark:text-gray-200 transition-colors">
                          <Moon size={16} className="text-gray-500 dark:text-gray-400" /> 
                          <span>Dark Mode</span>
                      </button>
                      <button onClick={() => toggleTheme('system')} className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2.5 text-gray-700 dark:text-gray-200 transition-colors">
                          <Settings size={16} className="text-gray-500 dark:text-gray-400" /> 
                          <span>System Default</span>
                      </button>

                      <div className="my-1 border-t border-gray-100 dark:border-gray-700" />

                      {/* Log Out */}
                      <button onClick={() => { onLogout(); setShowMenu(false); }} className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2.5 text-red-600 dark:text-red-400 transition-colors">
                          <LogOut size={16} /> 
                          <span>Sign Out</span>
                      </button>
                  </div>
              </div>
          )}

          {/* Click outside to close */}
          {showMenu && (
              <div 
                  className="fixed inset-0 z-40 bg-transparent" 
                  onClick={() => setShowMenu(false)}
              />
          )}
        </header>

        {/* Storage Modal */}
        <StorageModal isOpen={showStorage} onClose={() => setShowStorage(false)} />

        {/* Main Content (Scrollable) */}
        <main 
            className="flex-1 overflow-y-auto no-scrollbar relative bg-slate-50 dark:bg-gray-900 z-10 transition-colors duration-200"
        >
          {children}
        </main>

        {/* Bottom Navigation */}
        <nav className="bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 px-2 py-2 pb-5 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-30 shrink-0 transition-colors duration-200">
          <div className="flex justify-between items-center">
            {navItems.map((item) => {
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className="relative group flex flex-col items-center justify-center flex-1 h-14"
                >
                  {/* Active Indicator Background */}
                  {isActive && (
                    <span className="absolute -top-2 w-8 h-1 bg-blue-600 rounded-b-lg shadow-[0_0_8px_rgba(37,99,235,0.5)] transition-all duration-300" />
                  )}
                  
                  <div className={`transition-all duration-200 ${isActive ? '-translate-y-1' : 'group-hover:-translate-y-0.5'}`}>
                    <item.icon 
                      size={24} 
                      className={`mb-1 transition-colors duration-200 ${
                        isActive ? 'text-blue-600 dark:text-blue-400 fill-blue-50 dark:fill-blue-900/20' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                      }`} 
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                  </div>
                  
                  <span className={`text-[10px] font-medium transition-colors duration-200 ${
                    isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                  }`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

      </div>
    </div>
  );
};

export default Layout;
