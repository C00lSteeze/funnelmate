
import React, { useState, useEffect } from 'react';
import { analyzeCompetitorImage, generateVideoScript, generateTextCopy, generateImage } from '../services/gemini';
import { Zap, Image as ImageIcon, Copy, Loader2, UploadCloud, Save, CheckCircle2, Video, AlertTriangle, Sparkles, RefreshCw, Wand2, Search } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { FunnelProject } from '../types';
import VoiceInput from './VoiceInput';
import { Tooltip } from './Tooltip';

interface QuickToolsProps {
  initialTopic?: string;
  initialType?: 'headline' | 'tweet' | 'email_subject' | 'ad_copy' | 'landing_page' | 'lead_magnet' | 'lead_magnet_ideas' | 'email_sequence' | 'whatsapp_template' | 'facebook_post' | 'pov_video_script';
  onAutoSave: (project: FunnelProject) => void;
}

const QuickTools: React.FC<QuickToolsProps> = ({ initialTopic = '', initialType = 'headline', onAutoSave }) => {
  const [activeTab, setActiveTab] = useState<'copy' | 'analyze' | 'script'>('copy');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasSavedManually, setHasSavedManually] = useState(false);

  // Copy Gen State
  const [copyFramework, setCopyFramework] = useState('PAS');
  const [copyTopic, setCopyTopic] = useState(initialTopic);
  const [copyAudience, setCopyAudience] = useState('');
  const [copyFormat, setCopyFormat] = useState('');
  const [copyExperience, setCopyExperience] = useState('Intermediate');
  const [copyKeyword, setCopyKeyword] = useState('');

  // Script Gen State
  const [scriptFramework, setScriptFramework] = useState('PAS');
  const [scriptTopic, setScriptTopic] = useState('');
  const [scriptAudience, setScriptAudience] = useState('');
  const [scriptFormat, setScriptFormat] = useState('');
  const [scriptExperience, setScriptExperience] = useState('Intermediate');
  const [scriptKeyword, setScriptKeyword] = useState('');

  // Image Analysis State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('');
  
  // Vision Mode State
  const [visionMode, setVisionMode] = useState<'analyze' | 'generate'>('analyze');
  const [imagePrompt, setImagePrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  // Update state if props change (re-navigation)
  useEffect(() => {
    if (initialTopic) {
        setCopyTopic(initialTopic);
        setScriptTopic(initialTopic);
    }
    if (initialType) {
        setCopyFormat(initialType.replace(/_/g, ' '));
    }
  }, [initialTopic, initialType]);

  // Simulated Progress Bar for Analysis
  useEffect(() => {
    let interval: any;
    if (loading && activeTab === 'analyze') {
        setAnalysisProgress(0);
        interval = setInterval(() => {
            setAnalysisProgress(prev => {
                // Fast start, slow end, max 95% until complete
                if (prev >= 95) return prev;
                const increment = prev < 50 ? 5 : prev < 80 ? 2 : 0.5;
                return prev + Math.random() * increment;
            });
        }, 200);
    } else if (!loading && result) {
        setAnalysisProgress(100);
    }
    return () => clearInterval(interval);
  }, [loading, activeTab, result]);


  // Auto-Save Effect when result changes
  useEffect(() => {
      if (!result && !generatedImage) return;
      
      // PREVIEW MODE: Skip auto-save for specific long-form content types
      // This allows the user to review before saving to their project list
      if (activeTab === 'copy' && (copyFormat.toLowerCase().includes('email') || copyFormat.toLowerCase().includes('whatsapp'))) {
          return;
      }

      let type: FunnelProject['type'] = 'COPY';
      if (activeTab === 'analyze') type = visionMode === 'generate' ? 'IMAGE_GENERATION' : 'ANALYSIS';
      if (activeTab === 'script') type = 'VIDEO_SCRIPT';
      
      const project: FunnelProject = {
          id: Date.now().toString(),
          name: activeTab === 'copy' ? `Copy: ${copyTopic.substring(0, 15)}...` : 
                activeTab === 'script' ? `Script: ${scriptTopic.substring(0, 15)}...` : 
                visionMode === 'generate' ? `Image: ${imagePrompt.substring(0, 15)}...` : 'Competitor Analysis',
          type: type,
          content: generatedImage || result || '',
          niche: activeTab === 'copy' ? copyTopic : activeTab === 'script' ? scriptTopic : visionMode === 'generate' ? imagePrompt : 'Image Analysis',
          productName: activeTab === 'copy' ? copyTopic : activeTab === 'script' ? scriptTopic : visionMode === 'generate' ? 'Generated Image' : 'Competitor Image',
          targetAudience: activeTab === 'copy' ? copyAudience : activeTab === 'script' ? scriptAudience : 'General',
          createdAt: Date.now()
      };
      
      onAutoSave(project);
  }, [result, generatedImage]); // Only runs when result or generatedImage is updated

  const handleVoiceInput = (setter: React.Dispatch<React.SetStateAction<string>>) => (text: string) => {
    setter(prev => prev ? `${prev} ${text}` : text);
  };

  const extractErrorMessage = (e: any): string => {
      if (e instanceof Error) {
          const msg = e.message.toLowerCase();
          if (msg.includes('429')) return "Quota exceeded. Please wait a moment and try again.";
          if (msg.includes('400')) return "Invalid request. Please check your inputs.";
          if (msg.includes('403')) return "Access denied. Please check your API key.";
          if (msg.includes('503')) return "AI service is temporarily unavailable. Please try again later.";
          if (msg.includes('fetch failed')) return "Network error. Please check your internet connection.";
          return e.message;
      }
      return "An unexpected error occurred. Please try again.";
  };

  const handleCopyGen = async () => {
    if (!copyTopic || !copyAudience || !copyFormat) return;
    setLoading(true);
    setResult(null);
    setError(null);
    setHasSavedManually(false);
    try {
      const text = await generateTextCopy(
        copyFramework,
        copyTopic,
        copyAudience,
        copyFormat,
        copyExperience,
        copyKeyword
      );
      setResult(text);
    } catch (e) {
      console.error("Copy generation error:", e);
      setError(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const handleScriptGen = async () => {
    if (!scriptTopic || !scriptAudience || !scriptFormat) return;
    setLoading(true);
    setResult(null);
    setError(null);
    setHasSavedManually(false);
    try {
      const text = await generateVideoScript(
        scriptFramework,
        scriptTopic,
        scriptAudience,
        scriptFormat,
        scriptExperience,
        scriptKeyword
      );
      setResult(text);
    } catch (e) {
      console.error("Script generation error:", e);
      setError(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const handleManualSave = () => {
    if (!result && !generatedImage) return;
    
    let type: FunnelProject['type'] = 'COPY';
    if (activeTab === 'copy' && copyFormat.toLowerCase().includes('whatsapp')) type = 'CAMPAIGN_WA';
    if (activeTab === 'copy' && copyFormat.toLowerCase().includes('email')) type = 'CAMPAIGN_EMAIL';
    if (activeTab === 'script') type = 'VIDEO_SCRIPT';
    if (activeTab === 'analyze' && visionMode === 'generate') type = 'IMAGE_GENERATION';

    const project: FunnelProject = {
        id: Date.now().toString(),
        name: activeTab === 'script' ? `Script: ${scriptTopic.substring(0, 15)}...` : 
              activeTab === 'analyze' && visionMode === 'generate' ? `Image: ${imagePrompt.substring(0, 15)}...` :
              activeTab === 'analyze' ? 'Competitor Analysis' : `Copy: ${copyTopic.substring(0, 15)}...`,
        type: type,
        content: generatedImage || result || '',
        niche: activeTab === 'script' ? scriptTopic : activeTab === 'analyze' && visionMode === 'generate' ? imagePrompt : copyTopic,
        productName: activeTab === 'script' ? scriptTopic : activeTab === 'analyze' && visionMode === 'generate' ? 'Generated Image' : copyTopic,
        targetAudience: activeTab === 'script' ? scriptAudience : activeTab === 'copy' ? copyAudience : 'General',
        createdAt: Date.now()
    };
    
    onAutoSave(project);
    setHasSavedManually(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Reset previous states
      setError(null);
      setResult(null);

      // 1. Validate File Size (Max 4MB)
      const MAX_SIZE = 4 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
          const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
          setError(`Image is too large (${sizeMB}MB). Please upload an image under 4MB to ensure fast analysis.`);
          return;
      }

      // 2. Validate File Type
      // Gemini supports: image/png, image/jpeg, image/webp, image/heic, image/heif
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
      if (!allowedTypes.includes(file.type)) {
          if (file.type.startsWith('video/')) {
              setError("This tool is for images only. Please upload a screenshot or photo instead of a video.");
          } else if (file.type === 'image/gif') {
              setError("GIFs are not supported for strategy analysis. Please use a static image (JPG, PNG, or WebP).");
          } else if (file.type.startsWith('audio/')) {
              setError("Audio files are not supported. Please upload a marketing image or screenshot.");
          } else {
              setError(`Unsupported file type (${file.type || 'unknown'}). Please upload a valid image (JPEG, PNG, or WebP).`);
          }
          return;
      }
      
      // 3. Check for empty files
      if (file.size === 0) {
          setError("The selected file appears to be empty. Please choose a different image.");
          return;
      }
      
      setUploading(true);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setSelectedImage(base64String);
        setMimeType(file.type);
        setResult(null); 
        setHasSavedManually(false);
        setUploading(false);
      };
      reader.onerror = () => {
          setError("Failed to read image file. Please try again.");
          setUploading(false);
      }
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;
    setLoading(true);
    setResult(null);
    setGeneratedImage(null);
    setError(null);
    setHasSavedManually(false);
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

  const handleGenerateImage = async () => {
    if (!imagePrompt) return;
    setLoading(true);
    setResult(null);
    setGeneratedImage(null);
    setError(null);
    setHasSavedManually(false);
    try {
      const imgData = await generateImage(imagePrompt);
      setGeneratedImage(imgData);
    } catch (e) {
      console.error("Image generation error:", e);
      setError(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const isPreviewMode = activeTab === 'copy' && (copyFormat.toLowerCase().includes('email') || copyFormat.toLowerCase().includes('whatsapp'));

  return (
    <div className="p-4 h-full flex flex-col">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Quick Tools</h2>
      
      {/* Tabs */}
      <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl mb-6">
        <button
          onClick={() => { setActiveTab('copy'); setResult(null); setError(null); setHasSavedManually(false); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'copy' ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-300 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
        >
          <Zap size={16} /> Generator
        </button>
        <button
          onClick={() => { setActiveTab('script'); setResult(null); setError(null); setHasSavedManually(false); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'script' ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-300 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
        >
          <Video size={16} /> Script
        </button>
        <button
          onClick={() => { setActiveTab('analyze'); setResult(null); setGeneratedImage(null); setError(null); setHasSavedManually(false); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'analyze' ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-300 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
        >
          <ImageIcon size={16} /> Vision
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-20">
        {activeTab === 'copy' && (
          <div className="space-y-4 animate-in fade-in">
             <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200 px-3 py-2 rounded-lg text-xs flex items-center gap-2">
                <Zap size={12} className="fill-yellow-600 text-yellow-600 dark:text-yellow-400" />
                High-converting textual post generator.
             </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                    Framework
                    <Tooltip content="Choose the copywriting framework to use." />
                </label>
                <select
                    value={copyFramework}
                    onChange={(e) => setCopyFramework(e.target.value)}
                    className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-white"
                >
                    <option value="PAS">PAS (Problem, Agitate, Solve)</option>
                    <option value="MASA">MASA (Make a Bold statement, Agitate the problem, provide a Solution, call to Action)</option>
                    <option value="AIDA">AIDA</option>
                    <option value="FOMO">FOMO</option>
                    <option value="One on One">One on One</option>
                    <option value="Before After Bridge">Before After Bridge</option>
                    <option value="Features Advantages Benefits">Features, Advantages, Benefits</option>
                    <option value="POV">POV</option>
                </select>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                    Title & Topic *
                    <Tooltip content="Type the title of the textual content and a short but descriptive topic sentence." />
                </label>
                <div className="relative">
                    <textarea 
                        rows={2}
                        value={copyTopic}
                        onChange={(e) => {
                            setCopyTopic(e.target.value);
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                        }}
                        placeholder="e.g. Why 90% of Nigerians fail at making money online"
                        className="w-full p-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900 dark:bg-gray-800 dark:text-white text-sm resize-none overflow-hidden min-h-[60px]" 
                    />
                    <div className="absolute right-2 top-3">
                       <VoiceInput onTranscript={handleVoiceInput(setCopyTopic)} />
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                    Target Audience *
                    <Tooltip content="Who is this content for?" />
                </label>
                <div className="relative">
                    <textarea 
                        rows={1}
                        value={copyAudience}
                        onChange={(e) => {
                            setCopyAudience(e.target.value);
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                        }}
                        placeholder="e.g. Students and 9-to-5 workers"
                        className="w-full p-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900 dark:bg-gray-800 dark:text-white text-sm resize-none overflow-hidden min-h-[46px]" 
                    />
                    <div className="absolute right-2 top-3">
                       <VoiceInput onTranscript={handleVoiceInput(setCopyAudience)} />
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                    Content Format *
                    <Tooltip content="e.g. reddit, blog, fb post, tweet, landing pages, ad copy, lead magnet etc" />
                </label>
                <div className="relative">
                    <textarea 
                        rows={1}
                        value={copyFormat}
                        onChange={(e) => {
                            setCopyFormat(e.target.value);
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                        }}
                        placeholder="e.g. LinkedIn post"
                        className="w-full p-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900 dark:bg-gray-800 dark:text-white text-sm resize-none overflow-hidden min-h-[46px]" 
                    />
                    <div className="absolute right-2 top-3">
                       <VoiceInput onTranscript={handleVoiceInput(setCopyFormat)} />
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                    Experience Level
                    <Tooltip content="Your level of experience." />
                </label>
                <select
                    value={copyExperience}
                    onChange={(e) => setCopyExperience(e.target.value)}
                    className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-white"
                >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Expert">Expert</option>
                </select>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                    Keyword
                    <Tooltip content="The keyword for the call to action." />
                </label>
                <textarea 
                    rows={1}
                    value={copyKeyword}
                    onChange={(e) => {
                        setCopyKeyword(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                    }}
                    placeholder="e.g. REVEAL"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900 dark:bg-gray-800 dark:text-white text-sm resize-none overflow-hidden min-h-[46px]" 
                />
            </div>

            <button 
                onClick={handleCopyGen}
                disabled={!copyTopic || !copyAudience || !copyFormat || loading}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 flex justify-center items-center gap-2 shadow-lg shadow-blue-200 dark:shadow-blue-900/20"
            >
                {loading ? <Loader2 className="animate-spin" size={18} /> : (isPreviewMode ? 'Generate Preview' : 'Generate Content')}
            </button>
          </div>
        )}

        {activeTab === 'script' && (
          <div className="space-y-4 animate-in fade-in">
             <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-200 px-3 py-2 rounded-lg text-xs flex items-center gap-2">
                <Video size={12} className="text-blue-600 dark:text-blue-400" />
                High-converting video script generator.
             </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                    Framework
                    <Tooltip content="Choose the copywriting framework to use." />
                </label>
                <select
                    value={scriptFramework}
                    onChange={(e) => setScriptFramework(e.target.value)}
                    className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-white"
                >
                    <option value="PAS">PAS (Problem, Agitate, Solve)</option>
                    <option value="MASA">MASA (Make a Bold statement, Agitate the problem, provide a Solution, call to Action)</option>
                    <option value="AIDA">AIDA</option>
                    <option value="FOMO">FOMO</option>
                    <option value="One on One">One on One</option>
                    <option value="Before After Bridge">Before After Bridge</option>
                    <option value="Features Advantages Benefits">Features, Advantages, Benefits</option>
                    <option value="POV">POV</option>
                </select>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                    Video Title & Topic *
                    <Tooltip content="Type the title of the video and a short but descriptive topic sentence." />
                </label>
                <div className="relative">
                    <textarea 
                        rows={2}
                        value={scriptTopic}
                        onChange={(e) => {
                            setScriptTopic(e.target.value);
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                        }}
                        placeholder="e.g. Why 90% of Nigerians fail at making money online"
                        className="w-full p-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900 dark:bg-gray-800 dark:text-white text-sm resize-none overflow-hidden min-h-[60px]" 
                    />
                    <div className="absolute right-2 top-3">
                       <VoiceInput onTranscript={handleVoiceInput(setScriptTopic)} />
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                    Target Audience *
                    <Tooltip content="Who is this video for?" />
                </label>
                <div className="relative">
                    <textarea 
                        rows={1}
                        value={scriptAudience}
                        onChange={(e) => {
                            setScriptAudience(e.target.value);
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                        }}
                        placeholder="e.g. Students and 9-to-5 workers"
                        className="w-full p-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900 dark:bg-gray-800 dark:text-white text-sm resize-none overflow-hidden min-h-[46px]" 
                    />
                    <div className="absolute right-2 top-3">
                       <VoiceInput onTranscript={handleVoiceInput(setScriptAudience)} />
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                    Content Format *
                    <Tooltip content="e.g. IG reel, TikTok video, FB post etc" />
                </label>
                <div className="relative">
                    <textarea 
                        rows={1}
                        value={scriptFormat}
                        onChange={(e) => {
                            setScriptFormat(e.target.value);
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                        }}
                        placeholder="e.g. TikTok reels"
                        className="w-full p-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900 dark:bg-gray-800 dark:text-white text-sm resize-none overflow-hidden min-h-[46px]" 
                    />
                    <div className="absolute right-2 top-3">
                       <VoiceInput onTranscript={handleVoiceInput(setScriptFormat)} />
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                    Experience Level
                    <Tooltip content="Your level of experience." />
                </label>
                <select
                    value={scriptExperience}
                    onChange={(e) => setScriptExperience(e.target.value)}
                    className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-white"
                >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Expert">Expert</option>
                </select>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                    Keyword
                    <Tooltip content="The keyword for the call to action." />
                </label>
                <textarea 
                    rows={1}
                    value={scriptKeyword}
                    onChange={(e) => {
                        setScriptKeyword(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                    }}
                    placeholder="e.g. REVEAL"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900 dark:bg-gray-800 dark:text-white text-sm resize-none overflow-hidden min-h-[46px]" 
                />
            </div>

            <button 
                onClick={handleScriptGen}
                disabled={!scriptTopic || !scriptAudience || !scriptFormat || loading}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 flex justify-center items-center gap-2 shadow-lg shadow-blue-200 dark:shadow-blue-900/20"
            >
                {loading ? <Loader2 className="animate-spin" size={18} /> : 'Generate Script'}
            </button>
          </div>
        )}

        {activeTab === 'analyze' && (
          <div className="space-y-4 animate-in fade-in">
             <div className="flex bg-purple-100/50 dark:bg-purple-900/20 p-1 rounded-lg mb-4">
                <button
                  onClick={() => { setVisionMode('analyze'); setResult(null); setGeneratedImage(null); setError(null); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all ${visionMode === 'analyze' ? 'bg-white dark:bg-gray-700 text-purple-700 dark:text-purple-300 shadow-sm' : 'text-purple-600/70 dark:text-purple-400/70'}`}
                >
                  <Search size={14} /> Analyze Image
                </button>
                <button
                  onClick={() => { setVisionMode('generate'); setResult(null); setGeneratedImage(null); setError(null); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all ${visionMode === 'generate' ? 'bg-white dark:bg-gray-700 text-purple-700 dark:text-purple-300 shadow-sm' : 'text-purple-600/70 dark:text-purple-400/70'}`}
                >
                  <Wand2 size={14} /> Generate Image
                </button>
             </div>

             {visionMode === 'analyze' ? (
                 <>
                     <div className="bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 text-purple-800 dark:text-purple-200 px-3 py-2 rounded-lg text-xs flex items-center gap-2">
                        <ImageIcon size={12} className="text-purple-600 dark:text-purple-400" />
                        Upload competitor screenshots to reveal their strategy.
                     </div>

                    {/* Upload Area */}
                    <div className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition-all relative overflow-hidden ${
                        uploading 
                        ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/10' 
                        : error && !selectedImage
                            ? 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-900/10'
                            : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer'
                    }`}>
                        <input 
                            type="file" 
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={uploading || loading}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                        />
                        
                        {uploading ? (
                            <div className="flex flex-col items-center animate-pulse">
                                <Loader2 className="text-blue-500 mb-2 animate-spin" size={32} />
                                <p className="text-sm text-blue-600 font-medium">Processing image...</p>
                            </div>
                        ) : (
                            <>
                                <UploadCloud className={`${error && !selectedImage ? 'text-red-400' : 'text-gray-400'} mb-2`} size={32} />
                                <p className={`text-sm font-medium ${error && !selectedImage ? 'text-red-500' : 'text-gray-500'}`}>
                                    {error && !selectedImage ? 'Tap to retry' : 'Tap to upload image'}
                                </p>
                                <p className="text-[10px] text-gray-400 mt-1">Max size 4MB • JPG, PNG, WebP</p>
                            </>
                        )}
                    </div>

                    {selectedImage && !uploading && !error && (
                        <div className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 group">
                            <img src={`data:${mimeType};base64,${selectedImage}`} alt="Preview" className="w-full h-48 object-cover" />
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                <p className="text-white text-xs font-medium bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm flex items-center gap-1">
                                    <RefreshCw size={10} /> Change Image
                                </p>
                            </div>
                        </div>
                    )}
                    
                    {/* Visual Progress Indicator for Analysis */}
                    {loading && (
                         <div className="space-y-2 animate-in fade-in">
                            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 px-1">
                                <span className="font-medium text-purple-600 dark:text-purple-400">Analyzing visual elements...</span>
                                <span>{Math.round(analysisProgress)}%</span>
                            </div>
                            <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-300 ease-out" 
                                    style={{ width: `${analysisProgress}%` }}
                                />
                            </div>
                         </div>
                    )}

                    <button 
                        onClick={handleAnalyze}
                        disabled={!selectedImage || loading || uploading}
                        className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 disabled:opacity-50 flex justify-center items-center gap-2 shadow-lg shadow-purple-200 dark:shadow-purple-900/20 transition-all"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" size={18} />
                                Analyzing Strategy...
                            </>
                        ) : (
                            <>
                                <Sparkles size={18} />
                                Analyze Strategy
                            </>
                        )}
                    </button>
                 </>
             ) : (
                 <>
                     <div className="bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 text-purple-800 dark:text-purple-200 px-3 py-2 rounded-lg text-xs flex items-center gap-2">
                        <Wand2 size={12} className="text-purple-600 dark:text-purple-400" />
                        Generate high-quality marketing images.
                     </div>

                     <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                            Image Prompt *
                            <Tooltip content="Describe the image you want to generate in detail." />
                        </label>
                        <div className="relative">
                            <textarea 
                                rows={3}
                                value={imagePrompt}
                                onChange={(e) => {
                                    setImagePrompt(e.target.value);
                                    e.target.style.height = 'auto';
                                    e.target.style.height = e.target.scrollHeight + 'px';
                                }}
                                placeholder="e.g. A professional workspace with a laptop, coffee cup, and a notebook, bright lighting, photorealistic"
                                className="w-full p-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white text-gray-900 dark:bg-gray-800 dark:text-white text-sm resize-none overflow-hidden min-h-[80px]" 
                            />
                            <div className="absolute right-2 top-3">
                               <VoiceInput onTranscript={handleVoiceInput(setImagePrompt)} />
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={handleGenerateImage}
                        disabled={!imagePrompt || loading}
                        className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 disabled:opacity-50 flex justify-center items-center gap-2 shadow-lg shadow-purple-200 dark:shadow-purple-900/20 transition-all"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" size={18} />
                                Generating Image...
                            </>
                        ) : (
                            <>
                                <Sparkles size={18} />
                                Generate Image
                            </>
                        )}
                    </button>
                 </>
             )}
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

        {/* Results / Preview Area */}
        {(result || generatedImage) && (
            <div className="mt-6 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm animate-in slide-in-from-bottom duration-300">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                        {isPreviewMode ? 'Preview' : 'Result'}
                    </h3>
                    <div className="flex gap-2 items-center">
                        {isPreviewMode || activeTab === 'script' || (activeTab === 'analyze' && visionMode === 'generate') ? (
                           <button
                             onClick={handleManualSave}
                             disabled={hasSavedManually}
                             className={`text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                                hasSavedManually 
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 cursor-default'
                                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                             }`}
                           >
                              {hasSavedManually ? (
                                <>
                                  <CheckCircle2 size={12} /> Saved
                                </>
                              ) : (
                                <>
                                  <Save size={12} /> Save Project
                                </>
                              )}
                           </button>
                        ) : (
                            <span className="text-gray-400 text-xs flex items-center gap-1">
                                <CheckCircle2 size={12} className="text-green-500" /> Saved
                            </span>
                        )}
                        
                        <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>

                        {generatedImage ? (
                            <a 
                                href={generatedImage}
                                download="generated-image.png"
                                className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 text-xs px-2 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                <Save size={16} /> Download
                            </a>
                        ) : (
                            <button 
                                onClick={() => {
                                    if (result) navigator.clipboard.writeText(result);
                                }}
                                className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 text-xs px-2 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                <Copy size={16} /> Copy
                            </button>
                        )}
                    </div>
                </div>
                
                {generatedImage ? (
                    <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                        <img src={generatedImage} alt="Generated" className="w-full h-auto object-contain max-h-[400px]" />
                    </div>
                ) : (
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
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default QuickTools;
