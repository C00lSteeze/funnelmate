import React, { useState } from 'react';
import { generateFunnelStrategy } from '../services/gemini';
import { FunnelProject } from '../types';
import { ArrowRight, CheckCircle2, Loader2, Sparkles, AlertCircle, Monitor, Mail, PlayCircle, Save } from 'lucide-react';
import VoiceInput from './VoiceInput';
import { Tooltip } from './Tooltip';

interface FunnelWizardProps {
  onComplete: (project: FunnelProject) => void;
  onToolRequest: (type: 'lead_magnet' | 'email_sequence' | 'landing_page', topic: string) => void;
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

const FunnelWizard: React.FC<FunnelWizardProps> = ({ onComplete, onToolRequest }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    niche: '',
    productName: '',
    targetAudience: ''
  });

  const [generatedStrategy, setGeneratedStrategy] = useState<string>('');
  
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
      setStep(4); // Move to results
    } catch (err) {
      setError("Failed to generate strategy. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    const newProject: FunnelProject = {
      id: Date.now().toString(),
      name: `${formData.productName} Funnel`,
      type: 'STRATEGY',
      niche: formData.niche,
      productName: formData.productName,
      targetAudience: formData.targetAudience,
      content: generatedStrategy,
      createdAt: Date.now()
    };
    onComplete(newProject);
  };

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
          <input
            type="text"
            value={formData.niche}
            onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
            placeholder="e.g., Weight Loss for Moms, AI Tools for Biz"
            className="w-full p-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
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
          <input
            type="text"
            value={formData.productName}
            onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
            placeholder="e.g., ClickFunnels, JavaBurn, Jasper AI"
            className="w-full p-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
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
          <input
            type="text"
            value={formData.targetAudience}
            onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
            placeholder="e.g., Busy moms over 30, Small business owners"
            className="w-full p-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all bg-white dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
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
              <button onClick={() => setStep(1)} className="text-sm text-gray-500 dark:text-gray-400 hover:underline">Start Over</button>
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
                onClick={handleSave}
                className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 shadow-lg shadow-green-200 dark:shadow-green-900/20 flex items-center justify-center gap-2"
             >
                <Save size={18} /> Save Strategy
             </button>
          </div>
        </div>
      );
  };

  return (
    <div className="p-4 h-full overflow-y-auto no-scrollbar">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Funnel Builder</h2>
      
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderResults()}
    </div>
  );
};

export default FunnelWizard;