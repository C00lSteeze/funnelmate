
import React, { useEffect, useState } from 'react';
import { X, FileText, Calendar, HardDrive, ChevronDown, ChevronUp, Mail, Image as ImageIcon, MessageCircle, MessageSquare } from 'lucide-react';
import { FunnelProject } from '../types';

interface StorageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SortField = 'date' | 'name' | 'size';
type SortOrder = 'asc' | 'desc';

export const StorageModal: React.FC<StorageModalProps> = ({ isOpen, onClose }) => {
  const [files, setFiles] = useState<FunnelProject[]>([]);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem('funnel_projects');
      if (saved) {
        try {
          setFiles(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse storage", e);
        }
      }
    }
  }, [isOpen]);

  const sortedFiles = [...files].sort((a, b) => {
    let valA: any = a[sortField === 'date' ? 'createdAt' : sortField === 'name' ? 'name' : 'content'];
    let valB: any = b[sortField === 'date' ? 'createdAt' : sortField === 'name' ? 'name' : 'content'];

    if (sortField === 'size') {
        valA = a.content.length; // Approximate size by content length
        valB = b.content.length;
    }

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const getSize = (str: string) => {
    const bytes = new Blob([str]).size;
    return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
  };

  const getFileIcon = (type: FunnelProject['type']) => {
      switch(type) {
          case 'STRATEGY': return <FileText size={18} />;
          case 'ANALYSIS': return <ImageIcon size={18} />;
          case 'CAMPAIGN_EMAIL': 
          case 'COPY': return <Mail size={18} />;
          case 'CAMPAIGN_WA': return <MessageCircle size={18} />;
          case 'CHAT_SESSION': return <MessageSquare size={18} />;
          default: return <FileText size={18} />;
      }
  };

  const getFileColorClass = (type: FunnelProject['type']) => {
      switch(type) {
          case 'STRATEGY': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
          case 'ANALYSIS': return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
          case 'CAMPAIGN_EMAIL': 
          case 'COPY': return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
          case 'CAMPAIGN_WA': return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
          case 'CHAT_SESSION': return 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400';
          default: return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400';
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
           <div className="flex items-center gap-2">
             <HardDrive className="text-blue-600 dark:text-blue-400" size={20} />
             <h3 className="font-bold text-gray-800 dark:text-gray-100">Local Storage</h3>
           </div>
           <button onClick={onClose} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500">
             <X size={20} />
           </button>
        </div>

        {/* Controls */}
        <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex gap-2 overflow-x-auto no-scrollbar">
            {/* Sort Buttons */}
            {(['date', 'name', 'size'] as SortField[]).map(field => (
                <button
                    key={field}
                    onClick={() => {
                        if (sortField === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        else {
                            setSortField(field);
                            setSortOrder('desc'); 
                        }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border ${
                        sortField === field 
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' 
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                >
                    <span className="capitalize">{field}</span>
                    {sortField === field && (
                        sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                </button>
            ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-gray-50/50 dark:bg-gray-900/50">
            {sortedFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <HardDrive size={32} className="mb-2 opacity-50" />
                    <p className="text-sm">No files found locally.</p>
                </div>
            ) : (
                sortedFiles.map(file => (
                    <div key={file.id} className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between group">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${getFileColorClass(file.type)}`}>
                                {getFileIcon(file.type)}
                            </div>
                            <div className="min-w-0">
                                <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate pr-4">{file.name}</h4>
                                <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                                    <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(file.createdAt).toLocaleDateString()}</span>
                                    <span>•</span>
                                    <span>{getSize(file.content)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
        
        <div className="p-3 border-t border-gray-100 dark:border-gray-700 text-center text-xs text-gray-400 bg-white dark:bg-gray-800">
            {sortedFiles.length} file{sortedFiles.length !== 1 && 's'} stored
        </div>
      </div>
    </div>
  );
};
