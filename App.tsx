
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import FunnelWizard from './components/FunnelWizard';
import ChatCoach from './components/ChatCoach';
import QuickTools from './components/QuickTools';
import AuthScreen from './components/AuthScreen';
import { AppView, FunnelProject, UserProfile } from './types';
import { Plus, History, Mail, Download, FileText, Image as ImageIcon, MessageCircle, MessageSquare, ArrowRight } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('funnel_user');
        return saved ? JSON.parse(saved) : null;
    }
    return null;
  });

  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [activeProject, setActiveProject] = useState<FunnelProject | null>(null);
  
  // Navigation State for Animations
  const [slideDirection, setSlideDirection] = useState<'forward' | 'backward' | 'none'>('none');
  const viewOrder = [AppView.DASHBOARD, AppView.WIZARD, AppView.TOOLS, AppView.CHAT];

  // Initialize projects from localStorage if available
  const [projects, setProjects] = useState<FunnelProject[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('funnel_projects');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse projects from local storage');
        }
      }
    }
    return [];
  });
  
  const [toolParams, setToolParams] = useState<{ topic: string, type: any } | null>(null);

  // Persist projects
  useEffect(() => {
    localStorage.setItem('funnel_projects', JSON.stringify(projects));
  }, [projects]);

  // Persist User
  useEffect(() => {
      if (currentUser) {
          localStorage.setItem('funnel_user', JSON.stringify(currentUser));
      } else {
          localStorage.removeItem('funnel_user');
      }
  }, [currentUser]);

  const handleLogin = (user: UserProfile) => {
      setCurrentUser(user);
      setCurrentView(AppView.DASHBOARD);
  };

  const handleLogout = () => {
      setCurrentUser(null);
  };
  
  const handleNavigation = (view: AppView) => {
    if (view === currentView) return;

    const prevIndex = viewOrder.indexOf(currentView);
    const nextIndex = viewOrder.indexOf(view);
    
    if (nextIndex > prevIndex) setSlideDirection('forward');
    else if (nextIndex < prevIndex) setSlideDirection('backward');
    else setSlideDirection('none');

    setCurrentView(view);
    if (view !== AppView.CHAT) setActiveProject(null);
  };

  // "Auto-Save" Server Simulation
  const handleAutoSave = (project: FunnelProject) => {
    setProjects(prev => {
        const exists = prev.findIndex(p => p.id === project.id);
        if (exists >= 0) {
            const updated = [...prev];
            updated[exists] = project;
            return updated;
        } else {
            return [project, ...prev];
        }
    });
  };

  const handleOpenProject = (project: FunnelProject) => {
      setActiveProject(project);
      if (project.type === 'CHAT_SESSION') {
          handleNavigation(AppView.CHAT);
      } else if (project.type === 'STRATEGY') {
          handleDownloadPDF(project);
      } else {
          alert("Content copied to clipboard!");
          navigator.clipboard.writeText(project.content);
      }
  };

  const handleGenerateEmails = (project: FunnelProject) => {
    setToolParams({
        topic: `${project.productName} (Target Audience: ${project.targetAudience})`,
        type: 'email_sequence'
    });
    handleNavigation(AppView.TOOLS);
  };

  const handleToolRequest = (type: any, topic: string) => {
    setToolParams({
        topic: topic,
        type: type
    });
    handleNavigation(AppView.TOOLS);
  };

  const handleDownloadPDF = (project: FunnelProject) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${project.name} - FunnelMate Strategy</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
        <style>
            @page { margin: 0; size: auto; }
            body { background: #f9fafb; -webkit-print-color-adjust: exact; print-color-adjust: exact; font-family: sans-serif; padding: 3rem; color: #334155; }
            h1 { font-size: 2rem; font-weight: 800; margin-bottom: 0.5rem; color: #0f172a; text-align: center; }
            .subtitle { text-align: center; color: #64748b; margin-bottom: 3rem; font-size: 0.875rem; }
            
            /* Overview Section */
            .overview-box { background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 1rem; padding: 1.5rem; margin-bottom: 3rem; color: #3730a3; page-break-inside: avoid; }
            .overview-box strong { color: #312e81; font-weight: 800; }
            
            /* Step Cards */
            .step-card { background: white; border: 1px solid #e2e8f0; border-radius: 1rem; padding: 2rem; margin-bottom: 2rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); page-break-inside: avoid; }
            
            /* Step Pill */
            h2 { 
                background: #dbeafe; 
                color: #1e40af; 
                display: inline-block; 
                padding: 0.25rem 0.75rem; 
                border-radius: 0.5rem; 
                font-size: 0.75rem; 
                font-weight: 800; 
                text-transform: uppercase; 
                letter-spacing: 0.05em;
                margin-bottom: 1rem; 
            }
            
            /* Step Title */
            h3 { font-size: 1.25rem; font-weight: 700; color: #0f172a; margin-bottom: 0.75rem; margin-top: 0; }
            
            /* Script Block */
            blockquote { 
                background: #f8fafc; 
                padding: 1.5rem; 
                border-radius: 0.75rem; 
                font-style: italic; 
                color: #475569; 
                border-left: 4px solid #cbd5e1; 
                margin: 1.5rem 0; 
                font-family: serif;
            }
            
            /* Checklist */
            ul { list-style: none; padding: 0; margin: 1.5rem 0; }
            ul li { 
                padding-left: 2rem; 
                position: relative; 
                margin-bottom: 0.75rem; 
                color: #475569; 
                font-size: 0.875rem; 
                font-weight: 500;
            }
            ul li::before { 
                content: '✓'; 
                color: #10b981; 
                background: #d1fae5;
                width: 1.25rem;
                height: 1.25rem;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                position: absolute; 
                left: 0; 
                font-size: 0.75rem;
                font-weight: bold;
                top: 0;
            }
            
            /* CTA */
            .cta-text { 
                text-align: center; 
                margin-top: 2rem; 
                padding-top: 1.5rem;
                border-top: 1px solid #f1f5f9;
                color: #2563eb; 
                font-weight: 700; 
                font-size: 0.875rem;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }
            
            p { margin: 0.5rem 0; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="max-w-4xl mx-auto">
            <div class="header">
                <h1>${project.name}</h1>
                <p class="subtitle">Generated by FunnelMate AI • ${new Date(project.createdAt).toLocaleDateString()}</p>
            </div>
            <div id="content"></div>
        </div>
        <script>
           const markdownText = \`${project.content.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;
           const html = marked.parse(markdownText);
           const contentDiv = document.getElementById('content');
           contentDiv.innerHTML = html;
           
           // Post-process to group content into cards
           const children = Array.from(contentDiv.children);
           contentDiv.innerHTML = '';
           
           let currentWrapper = null;
           
           children.forEach(child => {
               if (child.tagName === 'H1') {
                   currentWrapper = document.createElement('div');
                   currentWrapper.className = 'overview-box';
                   child.style.display = 'none';
                   contentDiv.appendChild(currentWrapper);
               } else if (child.tagName === 'H2') {
                   currentWrapper = document.createElement('div');
                   currentWrapper.className = 'step-card';
                   contentDiv.appendChild(currentWrapper);
                   currentWrapper.appendChild(child);
               } else if (child.tagName === 'STRONG' && child.textContent.toLowerCase().includes('call to action')) {
                   child.className = 'cta-text';
                   child.style.display = 'block';
                   if (currentWrapper) currentWrapper.appendChild(child);
               } else {
                   if (currentWrapper) {
                       currentWrapper.appendChild(child);
                   } else {
                       contentDiv.appendChild(child);
                   }
               }
           });
           
           setTimeout(() => { window.print(); }, 800);
        </script>
      </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const getAnimationClass = () => {
      if (slideDirection === 'forward') return 'animate-slide-right';
      if (slideDirection === 'backward') return 'animate-slide-left';
      return 'animate-fade';
  };

  const renderDashboard = () => (
    <div className="p-4 space-y-6">
      
      {/* 1. Welcome / CTA */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg shadow-blue-200 dark:shadow-blue-900/20">
        <h2 className="text-2xl font-bold mb-2">Welcome Back, {currentUser?.name}!</h2>
        <p className="opacity-90 text-sm mb-4">Ready to build your next income stream?</p>
        <button
          onClick={() => { setActiveProject(null); handleNavigation(AppView.WIZARD); }}
          className="bg-white text-blue-700 px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 hover:bg-blue-50 transition-colors shadow-sm"
        >
          <Plus size={16} /> New Funnel
        </button>
      </div>

      {/* 3. History Section */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
            <History size={18} className="text-gray-500 dark:text-gray-400" /> Recent History
        </h3>
        {projects.length === 0 ? (
          <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
            <p className="text-gray-400 dark:text-gray-500 text-sm">No funnels yet.</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Start the Wizard to create one!</p>
          </div>
        ) : (
          <div className="space-y-3 pb-20">
            {projects.map(p => (
              <div key={p.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow group">
                <div 
                    onClick={() => handleOpenProject(p)}
                    className="flex justify-between items-start cursor-pointer"
                >
                    <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg shrink-0 ${
                            p.type === 'STRATEGY' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 
                            p.type === 'ANALYSIS' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' : 
                            p.type === 'CAMPAIGN_WA' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                            p.type === 'CAMPAIGN_EMAIL' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                            p.type === 'CHAT_SESSION' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' :
                            'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                            {p.type === 'STRATEGY' && <FileText size={20} />}
                            {p.type === 'ANALYSIS' && <ImageIcon size={20} />}
                            {(p.type === 'COPY' || p.type === 'CAMPAIGN_EMAIL') && <Mail size={20} />}
                            {p.type === 'CAMPAIGN_WA' && <MessageCircle size={20} />}
                            {p.type === 'CHAT_SESSION' && <MessageSquare size={20} />}
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-800 dark:text-gray-200 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{p.name}</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 capitalize">
                                {p.type === 'CAMPAIGN_WA' ? 'WhatsApp Campaign' : p.type === 'CHAT_SESSION' ? 'Chat Coach Session' : p.type.toLowerCase().replace('_', ' ')} • {new Date(p.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </div>
                
                <div className="mt-4 flex gap-2">
                    {p.type === 'STRATEGY' && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleGenerateEmails(p); }}
                            className="flex-1 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                        >
                            <Mail size={12} /> Email Sequence
                        </button>
                    )}
                    {(p.type === 'STRATEGY' || p.type === 'COPY' || p.type === 'CAMPAIGN_EMAIL') && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleDownloadPDF(p); }}
                            className="flex-1 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                            <Download size={12} /> Download
                        </button>
                    )}
                     {p.type === 'CHAT_SESSION' && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleOpenProject(p); }}
                            className="flex-1 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 hover:bg-indigo-100 dark:hover:bg-indigo-900/30"
                        >
                            <ArrowRight size={12} /> Resume Chat
                        </button>
                    )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // AUTH GUARD
  if (!currentUser) {
      return <AuthScreen onLogin={handleLogin} />;
  }

  return (
    <Layout 
        currentView={currentView} 
        onNavigate={handleNavigation}
        user={currentUser}
        onLogout={handleLogout}
    >
      <div key={currentView} className={`h-full ${getAnimationClass()}`}>
        {currentView === AppView.DASHBOARD && renderDashboard()}
        {currentView === AppView.WIZARD && (
            <FunnelWizard 
                onAutoSave={handleAutoSave} 
                onToolRequest={handleToolRequest} 
                onDownload={handleDownloadPDF} 
                initialData={activeProject?.type === 'STRATEGY' ? activeProject : undefined} 
            />
        )}
        {currentView === AppView.CHAT && (
            <ChatCoach 
                onAutoSave={handleAutoSave} 
                initialProject={activeProject?.type === 'CHAT_SESSION' ? activeProject : undefined} 
            />
        )}
        {currentView === AppView.TOOLS && (
            <QuickTools 
                initialTopic={toolParams?.topic} 
                initialType={toolParams?.type} 
                onAutoSave={handleAutoSave}
            />
        )}
      </div>
    </Layout>
  );
};

export default App;
