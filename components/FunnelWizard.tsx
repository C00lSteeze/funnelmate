
import React, { useState, useEffect } from 'react';
import { generateFunnelStrategy } from '../services/gemini';
import { FunnelProject } from '../types';
import { ArrowRight, CheckCircle2, Loader2, Sparkles, AlertCircle, Monitor, Mail, PlayCircle, Save, Download, HelpCircle, ChevronDown, ChevronUp, Users, DollarSign } from 'lucide-react';
import VoiceInput from './VoiceInput';
import { Tooltip } from './Tooltip';

interface FunnelWizardProps {
  onAutoSave: (project: FunnelProject) => void;
  onToolRequest: (type: 'lead_magnet' | 'email_sequence' | 'landing_page', topic: string) => void;
  onDownload: (project: FunnelProject) => void;
  initialData?: FunnelProject;
}

// Data structure for the parsed result
interface ParsedStep {
    id: number;
    type: string; // "Landing Page", "Email", etc.
    title: string;
    description: string;
    script: string;
    checklist: string[];
    cta: string;
}
interface ParsedStrategy {
    hook: string;
    targeting: string;
    steps: ParsedStep[];
}

const FunnelWizard: React.FC<FunnelWizardProps> = ({ onAutoSave, onToolRequest, onDownload, initialData }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  const [formData, setFormData] = useState({
    niche: '',
    productName: '',
    targetAudience: ''
  });

  const [generatedStrategy, setGeneratedStrategy] = useState<string>('');
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  useEffect(() => {
      if (initialData) {
          setFormData({
              niche: initialData.niche || '',
              productName: initialData.productName || '',
              targetAudience: initialData.targetAudience || ''
          });
          setGeneratedStrategy(initialData.content);
          setCurrentProjectId(initialData.id);
          setStep(4);
      }
  }, [initialData]);

  // Helper to append voice text
  const handleVoiceInput = (field: keyof typeof formData) => (text: string) => {
      setFormData(prev => ({
          ...prev,
          [field]: prev[field] ? `${prev[field]} ${text}` : text
      }));
  };
  
  // Parse the markdown string into structured objects for the UI
  const parseStrategyContent = (markdown: string): ParsedStrategy => {
      // 1. Overview Extraction
      const overviewRegex = /# Strategy Overview\s+[\s\S]*?\*\*Hook:\*\*\s*(.*)\s*\*\*Targeting:\*\*\s*(.*)(?=\n##|$)/i;
      const overviewMatch = markdown.match(overviewRegex);
      
      const hook = overviewMatch ? overviewMatch[1].trim() : "See generated content below.";
      const targeting = overviewMatch ? overviewMatch[2].trim() : "";

      // 2. Steps Extraction
      const steps: ParsedStep[] = [];
      const stepRegex = /## Step (\d+): ([^\n]+)\n### ([^\n]+)\n([\s\S]*?)(?=\n## Step|\n$|$)/g;
      
      const stepMatches = [...markdown.matchAll(stepRegex)];
      
      stepMatches.forEach(m => {
          const number = parseInt(m[1]);
          const type = m[2].trim();
          const title = m[3].trim();
          const bodyRaw = m[4].trim();
          
          // Extract blockquote (Script)
          const scriptMatch = bodyRaw.match(/>\s*([\s\S]*?)(?=\n-|\n\*\*|\n$)/);
          const script = scriptMatch ? scriptMatch[1].replace(/^>\s*/gm, '').trim() : '';
          
          // Extract Checklist
          const checklistMatches = bodyRaw.match(/- (.*)/g);
          const checklist = checklistMatches ? checklistMatches.map(s => s.replace('- ', '').trim()) : [];
          
          // Extract CTA
          const ctaMatch = bodyRaw.match(/\*\*Call to Action:\*\*\s*(.*)/i);
          const cta = ctaMatch ? ctaMatch[1].trim() : '';

          // Extract Description (Text before script or checklist)
          let description = bodyRaw;
          if (scriptMatch && scriptMatch.index !== undefined) {
             description = bodyRaw.substring(0, scriptMatch.index).trim();
          } else if (checklistMatches && bodyRaw.indexOf('- ') > -1) {
             description = bodyRaw.substring(0, bodyRaw.indexOf('- ')).trim();
          }

          steps.push({
              id: number,
              type,
              title,
              description,
              script,
              checklist,
              cta
          });
      });

      return { hook, targeting, steps };
  };

  const createProjectObject = (content: string, id?: string): FunnelProject => {
    return {
      id: id || Date.now().toString(),
      name: `${formData.productName} Funnel`,
      type: 'STRATEGY',
      niche: formData.niche,
      productName: formData.productName,
      targetAudience: formData.targetAudience,
      content: content,
      createdAt: Date.now()
    };
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const strategy = await generateFunnelStrategy(
        formData.niche,
        formData.productName,
        formData.targetAudience
      );
      setGeneratedStrategy(strategy);
      
      // Auto Save immediately upon generation
      const newProject = createProjectObject(strategy);
      setCurrentProjectId(newProject.id);
      onAutoSave(newProject);
      
      setStep(4); // Move to results
    } catch (err) {
      setError("Failed to generate strategy. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!currentProjectId) return;
    const project = createProjectObject(generatedStrategy, currentProjectId);
    onDownload(project);
  };

  // -- Render Guide --
  const renderGuide = () => (
    <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 animate-in fade-in slide-in-from-bottom-2">
        <button
            onClick={() => setShowGuide(!showGuide)}
            className="flex items-center justify-between w-full text-left group"
        >
            <div className="flex items-center gap-2">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-full text-blue-600 dark:text-blue-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
                   <HelpCircle size={18} />
                </div>
                <div>
                   <span className="block font-semibold text-gray-800 dark:text-gray-200 text-sm">New to this? See how it works</span>
                </div>
            </div>
            {showGuide ? <ChevronUp size={18} className="text-gray-400"/> : <ChevronDown size={18} className="text-gray-400"/>}
        </button>

        {showGuide && (
            <div className="mt-4 bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm space-y-5 text-sm text-gray-600 dark:text-gray-300">
                <p className="leading-relaxed">
                    Most beginners fail because they send people directly to an affiliate link. People don't buy from strangers! 
                    <br/><br/>
                    You need a <strong>Funnel</strong> to build trust first. Here is the process we are building for you:
                </p>

                {/* Visual Flow */}
                <div className="flex items-center justify-between gap-2 py-2 px-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-700">
                    <div className="flex flex-col items-center text-center gap-1.5 flex-1">
                        <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center border border-gray-200 dark:border-gray-600 shadow-sm text-gray-500 dark:text-gray-400">
                            <Users size={18} />
                        </div>
                        <span className="text-[9px] font-bold uppercase text-gray-400 tracking-wide">Traffic</span>
                    </div>
                     <ArrowRight size={14} className="text-gray-300 shrink-0" />
                    <div className="flex flex-col items-center text-center gap-1.5 flex-1">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center border border-blue-200 dark:border-blue-800 shadow-sm text-blue-600 dark:text-blue-400">
                            <Monitor size={18} />
                        </div>
                        <span className="text-[9px] font-bold uppercase text-blue-600 dark:text-blue-400 tracking-wide">Your Page</span>
                    </div>
                     <ArrowRight size={14} className="text-gray-300 shrink-0" />
                    <div className="flex flex-col items-center text-center gap-1.5 flex-1">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center border border-green-200 dark:border-green-800 shadow-sm text-green-600 dark:text-green-400">
                            <DollarSign size={18} />
                        </div>
                        <span className="text-[9px] font-bold uppercase text-green-600 dark:text-green-400 tracking-wide">Sale</span>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex gap-3 items-start">
                        <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</div>
                        <p className="text-xs leading-relaxed"><strong className="text-gray-800 dark:text-gray-200">The Capture Page:</strong> We'll write a headline that makes people curious so they give you their email.</p>
                    </div>
                    <div className="flex gap-3 items-start">
                         <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</div>
                        <p className="text-xs leading-relaxed"><strong className="text-gray-800 dark:text-gray-200">The Bridge:</strong> A simple script where you introduce yourself and the product to build trust.</p>
                    </div>
                    <div className="flex gap-3 items-start">
                         <div className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</div>
                        <p className="text-xs leading-relaxed"><strong className="text-gray-800 dark:text-gray-200">The Emails:</strong> We'll write follow-up emails to sell to people who didn't buy immediately.</p>
                    </div>
                </div>
            </div>
        )}
    </div>
  );

  // -- Render Steps --

  const renderStep1 = () => (
    <div className="space-y-6 animate-in slide-in-from-right duration-300">
      <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
        <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-1">Step 1: Choose Your Niche</h3>
        <p className="text-sm text-blue-700 dark:text-blue-300">What category does your affiliate product fall into?</p>
      </div>
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
            Niche Name
            <Tooltip content="The specific market category you are targeting (e.g., 'Keto Diet', 'SaaS Marketing', 'Dog Training')." />
        </label>
        <div className="relative">
          <textarea
            rows={1}
            value={formData.niche}
            onChange={(e) => {
                setFormData({ ...formData, niche: e.target.value });
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
            }}
            placeholder="e.g., Weight Loss for Moms, AI Tools for Biz"
            className="w-full p-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 resize-none overflow-hidden min-h-[46px]"
          />
          <div className="absolute right-2 top-3">
             <VoiceInput onTranscript={handleVoiceInput('niche')} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {['Health & Fitness', 'Wealth & Biz', 'Relationships', 'Tech'].map((tag) => (
            <button
              key={tag}
              onClick={() => setFormData({ ...formData, niche: tag })}
              className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
      <button
        disabled={!formData.niche}
        onClick={() => setStep(2)}
        className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        Next <ArrowRight size={18} />
      </button>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6 animate-in slide-in-from-right duration-300">
      <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800">
        <h3 className="font-semibold text-indigo-900 dark:text-indigo-200 mb-1">Step 2: The Product</h3>
        <p className="text-sm text-indigo-700 dark:text-indigo-300">What are you promoting? Be specific.</p>
      </div>
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
            Product Name / Description
            <Tooltip content="The name of the product you are promoting. Adding a short description helps the AI understand its features." />
        </label>
        <div className="relative">
          <textarea
            rows={1}
            value={formData.productName}
            onChange={(e) => {
                setFormData({ ...formData, productName: e.target.value });
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
            }}
            placeholder="e.g., ClickFunnels, JavaBurn, Jasper AI"
            className="w-full p-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 resize-none overflow-hidden min-h-[46px]"
          />
          <div className="absolute right-2 top-3">
             <VoiceInput onTranscript={handleVoiceInput('productName')} />
          </div>
        </div>
      </div>
      <div className="flex gap-3">
        <button
            onClick={() => setStep(1)}
            className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-3 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
        >
            Back
        </button>
        <button
            disabled={!formData.productName}
            onClick={() => setStep(3)}
            className="flex-[2] bg-indigo-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
            Next <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6 animate-in slide-in-from-right duration-300">
      <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-xl border border-purple-100 dark:border-purple-800">
        <h3 className="font-semibold text-purple-900 dark:text-purple-200 mb-1">Step 3: Target Audience</h3>
        <p className="text-sm text-purple-700 dark:text-purple-300">Who is your ideal customer?</p>
      </div>
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
            Audience Description
            <Tooltip content="Be specific! E.g., 'Busy moms over 30 who want to lose weight' works better than just 'Women'." />
        </label>
        <div className="relative">
          <textarea
            rows={1}
            value={formData.targetAudience}
            onChange={(e) => {
                setFormData({ ...formData, targetAudience: e.target.value });
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
            }}
            placeholder="e.g., Busy moms over 30, Small business owners"
            className="w-full p-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all bg-white dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 resize-none overflow-hidden min-h-[46px]"
          />
          <div className="absolute right-2 top-3">
             <VoiceInput onTranscript={handleVoiceInput('targetAudience')} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
            {['Beginners', 'Experts', 'Students', 'Parents', 'Retirees'].map((tag) => (
                <button
                key={tag}
                onClick={() => setFormData({ ...formData, targetAudience: tag })}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                {tag}
                </button>
            ))}
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 p-3 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
            onClick={() => setStep(2)}
            className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-3 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
        >
            Back
        </button>
        <button
            disabled={!formData.targetAudience || loading}
            onClick={handleGenerate}
            className="flex-[2] bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <><Sparkles size={20} /> Generate Funnel</>}
        </button>
      </div>
    </div>
  );

  const renderResults = () => {
      const parsed = parseStrategyContent(generatedStrategy);
      
      return (
        <div className="animate-in fade-in duration-500 pb-20">
          <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Your Funnel Strategy</h2>
              <button onClick={() => setStep(1)} className="text-sm text-gray-500 dark:text-gray-400 hover:underline">New Project</button>
          </div>

          {/* Strategy Overview Card */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 mb-8 border border-blue-100 dark:border-blue-800">
             <div className="flex items-start gap-3 mb-4">
                 <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-lg text-blue-600 dark:text-blue-300">
                     <Monitor size={20} />
                 </div>
                 <div>
                     <h3 className="text-sm font-bold text-blue-800 dark:text-blue-200 uppercase tracking-wide">Strategy Overview</h3>
                     <div className="mt-2 text-gray-800 dark:text-gray-200 font-medium text-lg leading-relaxed">
                         {parsed.hook}
                     </div>
                     <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                         <span className="bg-white/50 dark:bg-black/20 px-2 py-1 rounded text-xs font-semibold">Targeting:</span> {parsed.targeting}
                     </div>
                 </div>
             </div>
          </div>

          {/* Timeline Steps */}
          <div className="relative space-y-8 pl-4">
             {/* Vertical Line */}
             <div className="absolute left-[27px] top-4 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700 -z-10" />

             {parsed.steps.map((stepItem, index) => {
                 const isLandingPage = stepItem.type.toLowerCase().includes('landing');
                 const isBridge = stepItem.type.toLowerCase().includes('bridge');
                 const isEmail = stepItem.type.toLowerCase().includes('email');
                 
                 const StepIcon = isLandingPage ? Monitor : isBridge ? PlayCircle : Mail;
                 const stepColor = isLandingPage ? 'blue' : isBridge ? 'indigo' : 'purple';
                 const stepBg = isLandingPage ? 'bg-blue-100 text-blue-600' : isBridge ? 'bg-indigo-100 text-indigo-600' : 'bg-purple-100 text-purple-600';
                 const stepDarkBg = isLandingPage ? 'dark:bg-blue-900/40 dark:text-blue-400' : isBridge ? 'dark:bg-indigo-900/40 dark:text-indigo-400' : 'dark:bg-purple-900/40 dark:text-purple-400';

                 return (
                     <div key={index} className="relative animate-in slide-in-from-bottom-4 fill-mode-backwards" style={{ animationDelay: `${index * 100}ms` }}>
                         {/* Step Badge */}
                         <div className="absolute -left-[3px] top-0 bg-white dark:bg-gray-900 p-1">
                             <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800 shadow-sm z-10 ${stepBg} ${stepDarkBg}`}>
                                 <StepIcon size={14} strokeWidth={2.5} />
                             </div>
                         </div>

                         {/* Card */}
                         <div className="ml-10 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                             <div className="px-5 py-3 border-b border-gray-50 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-700/30">
                                 <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${stepBg.replace('text-', 'bg-opacity-20 text-')} ${stepDarkBg}`}>{stepItem.type}</span>
                             </div>
                             
                             <div className="p-5">
                                 <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">{stepItem.title}</h4>
                                 <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{stepItem.description}</p>
                                 
                                 {stepItem.script && (
                                     <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 mb-4 border border-gray-100 dark:border-gray-700 italic text-gray-600 dark:text-gray-300 font-serif leading-relaxed relative">
                                         <span className="absolute top-2 left-2 text-4xl text-gray-200 dark:text-gray-700 font-serif leading-none">"</span>
                                         <span className="relative z-10">{stepItem.script}</span>
                                     </div>
                                 )}

                                 <div className="space-y-2 mb-4">
                                     {stepItem.checklist.map((item, i) => (
                                         <div key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                                             <CheckCircle2 size={16} className="text-green-500 shrink-0 mt-0.5" />
                                             <span>{item}</span>
                                         </div>
                                     ))}
                                 </div>

                                 {stepItem.cta && (
                                     <div className="text-center pt-3 border-t border-gray-100 dark:border-gray-700">
                                         <span className="text-xs text-gray-400 uppercase font-bold">Call to Action</span>
                                         <p className="font-bold text-blue-600 dark:text-blue-400">{stepItem.cta}</p>
                                     </div>
                                 )}
                             </div>
                         </div>
                     </div>
                 );
             })}
          </div>

          {/* Action Bar */}
          <div className="sticky bottom-4 mt-8 flex gap-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl z-20">
             <button
                onClick={handleDownload}
                className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-3 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center gap-2"
             >
                <Download size={18} /> Download for Offline Use
             </button>
          </div>
        </div>
      );
  };

  return (
    <div className="p-4 h-full overflow-y-auto no-scrollbar pb-24">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Funnel Builder</h2>
      
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderResults()}
      
      {step < 4 && renderGuide()}
    </div>
  );
};

export default FunnelWizard;
