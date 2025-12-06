
import React, { useState } from 'react';
import { Home, Wand2, MessageSquare, Zap, Settings, MoreVertical, Moon, Sun, HardDrive } from 'lucide-react';
import { AppView } from '../types';
import { StorageModal } from './StorageModal';

interface LayoutProps {
  children: React.ReactNode;
  currentView: AppView;
  onNavigate: (view: AppView) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, onNavigate }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showStorage, setShowStorage] = useState(false);

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex justify-center transition-colors duration-200">
      {/* Mobile container simulation */}
      <div className="w-full max-w-md bg-white dark:bg-gray-800 h-[100dvh] flex flex-col shadow-2xl relative overflow-hidden transition-colors duration-200">
        
        {/* Header */}
        <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 shadow-md z-20 flex items-center justify-between shrink-0 relative">
          <div className="flex items-center gap-2">
             {/* Logo Icon Placeholder */}
             <div className="bg-white/20 p-1.5 rounded-lg">
                <Wand2 size={18} className="text-white" />
             </div>
             <h1 className="text-lg font-bold tracking-tight">FunnelMate AI</h1>
          </div>
          
          <div className="flex items-center gap-3">
              <span className="text-[10px] font-semibold bg-white/20 px-2 py-0.5 rounded-full border border-white/10">BETA</span>
              <button onClick={() => setShowMenu(!showMenu)} className="p-1 hover:bg-white/10 rounded-full transition-colors relative">
                  <MoreVertical size={20} className="text-white" />
              </button>
          </div>

          {/* Dropdown Menu - Positioned top right as requested */}
          {showMenu && (
              <div className="absolute top-14 right-4 bg-white dark:bg-gray-700 rounded-lg shadow-xl border border-gray-100 dark:border-gray-600 py-2 w-48 z-50 animate-in fade-in slide-in-from-top-2 text-gray-800 dark:text-gray-100">
                  <div className="px-3 py-1 text-[10px] font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider">Data</div>
                  <button 
                    onClick={() => { setShowStorage(true); setShowMenu(false); }} 
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-2"
                  >
                      <HardDrive size={14} /> Local Storage
                  </button>

                  <div className="my-1 border-t border-gray-100 dark:border-gray-600" />
                  
                  <div className="px-3 py-1 text-[10px] font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider">Theme</div>
                  <button onClick={() => toggleTheme('light')} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-2">
                      <Sun size={14} /> Light
                  </button>
                  <button onClick={() => toggleTheme('dark')} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-2">
                      <Moon size={14} /> Dark
                  </button>
                  <button onClick={() => toggleTheme('system')} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-2">
                      <Settings size={14} /> System
                  </button>
              </div>
          )}
        </header>

        {/* Storage Modal */}
        <StorageModal isOpen={showStorage} onClose={() => setShowStorage(false)} />

        {/* Main Content (Scrollable) */}
        <main className="flex-1 overflow-y-auto no-scrollbar relative bg-slate-50 dark:bg-gray-900 z-10 transition-colors duration-200">
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
