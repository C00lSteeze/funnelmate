import React, { useState, useEffect } from 'react';
import { generateQuickCopy, analyzeCompetitorImage } from '../services/gemini';
import { Zap, Image as ImageIcon, Copy, Loader2, UploadCloud, Mail, FileText, Save, Lightbulb, CheckCircle2, MessageCircle, Facebook, Video, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { FunnelProject } from '../types';
import VoiceInput from './VoiceInput';
import { Tooltip } from './Tooltip';

interface QuickToolsProps {
  initialTopic?: string;
  initialType?: 'headline' | 'tweet' | 'email_subject' | 'ad_copy' | 'landing_page' | 'lead_magnet' | 'lead_magnet_ideas' | 'email_sequence' | 'whatsapp_template' | 'facebook_post' | 'pov_video_script';
  onSave: (project: FunnelProject) => void;
}

const TEMPLATES = [
  { id: '', label: 'General / No Template' },
  { id: 'Limited-Time Offer', label: 'Limited-Time Offer' },
  { id: 'New Product Launch', label: 'New Product Launch' },
  { id: 'Flash Sale', label: 'Flash Sale (Urgency)' },
  { id: 'Holiday Special', label: 'Holiday Special' },
  { id: 'Problem-Solution', label: 'Problem-Agitate-Solve' },
  { id: 'Storytelling', label: 'Storytelling / Testimonial' },
];

const QuickTools: React.FC<QuickToolsProps> = ({ initialTopic = '', initialType = 'headline', onSave }) => {
  const [activeTab, setActiveTab] = useState<'copy' | 'analyze'>('copy');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Copy Gen State
  const [topic, setTopic] = useState(initialTopic);
  const [copyType, setCopyType] = useState<'headline' | 'tweet' | 'email_subject' | 'ad_copy' | 'landing_page' | 'lead_magnet' | 'lead_magnet_ideas' | 'email_sequence' | 'whatsapp_template' | 'facebook_post' | 'pov_video_script'>(initialType);
  const [selectedTemplate, setSelectedTemplate] = useState('');

  // Image Analysis State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('');

  // Update state if props change (re-navigation)
  useEffect(() => {
    if (initialTopic) setTopic(initialTopic);
    if (initialType) setCopyType(initialType);
  }, [initialTopic, initialType]);

  const handleVoiceInput = (text: string) => {
    setTopic(prev => prev ? `${prev} ${text}` : text);
  };

  const extractErrorMessage = (e: any): string => {
      if (e instanceof Error) {
          // Check for common API errors to provide friendlier messages
          const msg = e.message.toLowerCase();
          if (msg.includes('429')) return "Quota exceeded. Please wait a moment and try again.";
          if (msg.includes('400')) return "Invalid request parameters. Please check your inputs.";
          if (msg.includes('403')) return "Access denied. Please check your API key.";
          if (msg.includes('503')) return "AI service is temporarily unavailable. Please try again later.";
          if (msg.includes('fetch failed')) return "Network error. Please check your internet connection.";
          return e.message;
      }
      return "An unexpected error occurred. Please try again.";
  };

  const handleCopyGen = async () => {
    if (!topic) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const text = await generateQuickCopy(topic, copyType, selectedTemplate);
      setResult(text);
    } catch (e) {
      console.error("Copy generation error:", e);
      setError(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
          setError("Image is too large. Please upload an image under 4MB.");
          return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setSelectedImage(base64String);
        setMimeType(file.type);
        setResult(null); // clear previous result
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const text = await analyzeCompetitorImage(selectedImage, mimeType);
      setResult(text);
    } catch (e) {
      console.error("Analysis error:", e);
      setError(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveResult = () => {
    if (!result) return;
    
    let type: FunnelProject['type'] = 'COPY';
    if (activeTab === 'analyze') type = 'ANALYSIS';
    if (copyType === 'whatsapp_template') type = 'CAMPAIGN_WA';
    if (copyType === 'email_sequence') type = 'CAMPAIGN_EMAIL';

    const project: FunnelProject = {
        id: Date.now().toString(),
        name: activeTab === 'copy' ? `${copyType.replace(/_/g, ' ')}: ${topic.substring(0, 15)}...` : 'Competitor Analysis',
        type: type,
        content: result,
        niche: activeTab === 'copy' ? topic : 'Image Analysis',
        productName: activeTab === 'copy' ? topic : 'Competitor Image',
        targetAudience: 'General',
        createdAt: Date.now()
    };
    onSave(project);
    alert('Saved to Projects!');
  };

  return (
    <div className="p-4 h-full flex flex-col">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Quick Tools</h2>
      
      {/* Tabs */}
      <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl mb-6">
        <button
          onClick={() => { setActiveTab('copy'); setResult(null); setError(null); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'copy' ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-300 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
        >
          <Zap size={16} /> Generator
        </button>
        <button
          onClick={() => { setActiveTab('analyze'); setResult(null); setError(null); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'analyze' ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-300 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
        >
          <ImageIcon size={16} /> Vision
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-20">
        {activeTab === 'copy' ? (
          <div className="space-y-4 animate-in fade-in">
             <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200 px-3 py-2 rounded-lg text-xs flex items-center gap-2">
                <Zap size={12} className="fill-yellow-600 text-yellow-600 dark:text-yellow-400" />
                Powered by Gemini Flash Lite for speed.
             </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                    What do you need?
                    <Tooltip content="Select the type of content you want the AI to generate for you." />
                </label>
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { id: 'headline', label: 'Headline', icon: null },
                        { id: 'tweet', label: 'Tweet', icon: null },
                        { id: 'email_subject', label: 'Subject Lines', icon: null },
                        { id: 'email_sequence', label: 'Email Sequence', icon: <Mail size={12} /> },
                        { id: 'ad_copy', label: 'Ad Copy', icon: null },
                        { id: 'landing_page', label: 'Landing Page', icon: null },
                        { id: 'lead_magnet', label: 'Lead Magnet Text', icon: null },
                        { id: 'lead_magnet_ideas', label: 'Lead Magnet Ideas', icon: <Lightbulb size={12} /> },
                        { id: 'whatsapp_template', label: 'WhatsApp Template', icon: <MessageCircle size={12} /> },
                        { id: 'facebook_post', label: 'Facebook Post', icon: <Facebook size={12} /> },
                        { id: 'pov_video_script', label: 'POV Video Script', icon: <Video size={12} /> }
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => setCopyType(t.id as any)}
                            className={`py-2 px-3 text-xs rounded-lg border capitalize transition-colors flex items-center justify-center gap-1 text-center ${
                                copyType === t.id 
                                ? 'bg-blue-600 text-white border-blue-600' 
                                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                        >
                            {t.icon}
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                    Template / Scenario
                    <Tooltip content="Choose a framework (like 'FOMO' or 'Storytelling') to guide the style of the copy." />
                </label>
                <div className="relative">
                    <select
                        value={selectedTemplate}
                        onChange={(e) => setSelectedTemplate(e.target.value)}
                        className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-white"
                    >
                        {TEMPLATES.map(t => (
                            <option key={t.id} value={t.id}>{t.label}</option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500">
                        <FileText size={16} />
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                    Product / Topic
                    <Tooltip content="The main subject of your copy. Can be a product name, a specific pain point, or an idea." />
                </label>
                <div className="relative">
                    <input 
                        type="text" 
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="e.g. Keto diet plan, AI marketing tools"
                        className="w-full p-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900 placeholder-gray-500 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400" 
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                       <VoiceInput onTranscript={handleVoiceInput} />
                    </div>
                </div>
            </div>

            <button 
                onClick={handleCopyGen}
                disabled={!topic || loading}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 flex justify-center items-center gap-2 shadow-lg shadow-blue-200 dark:shadow-blue-900/20"
            >
                {loading ? <Loader2 className="animate-spin" size={18} /> : 'Generate Content'}
            </button>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in">
             <div className="bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 text-purple-800 dark:text-purple-200 px-3 py-2 rounded-lg text-xs flex items-center gap-2">
                <ImageIcon size={12} className="text-purple-600 dark:text-purple-400" />
                Upload competitor screenshots to reveal their strategy.
             </div>

            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer relative">
                <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <UploadCloud className="text-gray-400 mb-2" size={32} />
                <p className="text-sm text-gray-500 font-medium">Tap to upload image</p>
            </div>

            {selectedImage && (
                <div className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                    <img src={`data:${mimeType};base64,${selectedImage}`} alt="Preview" className="w-full h-48 object-cover" />
                </div>
            )}

            <button 
                onClick={handleAnalyze}
                disabled={!selectedImage || loading}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 flex justify-center items-center gap-2 shadow-lg shadow-blue-200 dark:shadow-blue-900/20"
            >
                {loading ? <Loader2 className="animate-spin" size={18} /> : 'Analyze Strategy'}
            </button>
          </div>
        )}

        {/* Error Display */}
        {error && (
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-300 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2">
                <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                <div>
                    <h3 className="font-semibold text-sm">Action Failed</h3>
                    <p className="text-xs mt-1 leading-relaxed">{error}</p>
                </div>
            </div>
        )}

        {/* Results Area */}
        {result && (
            <div className="mt-6 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm animate-in slide-in-from-bottom duration-300">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">Result</h3>
                    <div className="flex gap-2">
                         <button 
                            onClick={handleSaveResult}
                            className="text-gray-400 hover:text-green-600 dark:hover:text-green-400 flex items-center gap-1 text-xs"
                        >
                            <Save size={16} /> Save
                        </button>
                        <button 
                            onClick={() => navigator.clipboard.writeText(result)}
                            className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 text-xs"
                        >
                            <Copy size={16} /> Copy
                        </button>
                    </div>
                </div>
                
                <div className="prose prose-sm prose-blue max-w-none text-gray-600 dark:text-gray-300 dark:prose-invert">
                    <ReactMarkdown
                        components={activeTab === 'analyze' ? {
                            // Custom renderer for Analysis Tab results
                            h2: ({node, ...props}) => (
                                <div className="mt-6 mb-2">
                                    <span className="bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
                                        {props.children}
                                    </span>
                                </div>
                            ),
                            ul: ({node, ...props}) => <ul className="space-y-2 mt-2" {...props} />,
                            li: ({node, ...props}) => (
                                <li className="flex items-start gap-2 bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg text-sm">
                                    <CheckCircle2 size={14} className="text-green-500 shrink-0 mt-0.5" />
                                    <span>{props.children}</span>
                                </li>
                            ),
                            p: ({node, ...props}) => <p className="mb-2 text-sm leading-relaxed" {...props} />
                        } : undefined} // Default rendering for copy tab
                    >
                        {result}
                    </ReactMarkdown>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default QuickTools;