import React, { useRef, useState } from 'react';
import { Database, Download, Upload, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { Habit, Task, FocusSession } from '../types';

interface BackupViewProps {
  habits: Habit[];
  tasks: Task[];
  focusSessions: FocusSession[];
  onRestoreBackup: (data: { habits: Habit[]; tasks: Task[]; focusSessions: FocusSession[] }) => void;
}

export default function BackupView({
  habits,
  tasks,
  focusSessions,
  onRestoreBackup
}: BackupViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

  const handleExport = () => {
    try {
      const dataStr = JSON.stringify({ habits, tasks, focusSessions }, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `nexus-backup-${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } catch (err) {
      console.error(err);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = event.target?.result;
        if (typeof result !== 'string') return;
        
        const parsed = JSON.parse(result);
        
        // Basic schema validation
        if (!parsed.habits || !Array.isArray(parsed.habits)) {
          throw new Error("Invalid backup file format (missing habits array)");
        }
        
        onRestoreBackup({
          habits: parsed.habits,
          tasks: parsed.tasks || [],
          focusSessions: parsed.focusSessions || []
        });

        setImportStatus({
          type: 'success',
          message: 'Backup restored successfully! Dashboard updated.'
        });
        
        setTimeout(() => setImportStatus({ type: null, message: '' }), 5000);
      } catch (err) {
        setImportStatus({
          type: 'error',
          message: 'Failed to import backup file. Please ensure it is a valid JSON file.'
        });
        setTimeout(() => setImportStatus({ type: null, message: '' }), 5000);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200/60 p-6 shadow-xs max-w-2xl mx-auto space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
        <div className="p-2 bg-stone-100 text-stone-900 rounded-xl">
          <Database className="w-4 h-4" />
        </div>
        <div>
          <h2 className="font-semibold text-sm text-stone-950">Database Backup & Recovery</h2>
          <p className="text-[10px] text-stone-400 font-medium">Backup & Data Recovery</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Export Card */}
        <div className="p-5 border border-stone-200/60 rounded-2xl hover:shadow-xs transition-all space-y-4 flex flex-col justify-between">
          <div>
            <div className="w-9 h-9 rounded-full bg-stone-100 text-stone-900 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-xs text-stone-900 mt-3">Export Data</h3>
            <p className="text-[11px] text-stone-400 mt-1">
              Download a secure backup file containing all your habits, tasks, and focus sessions to keep locally.
            </p>
          </div>
          <button
            onClick={handleExport}
            className="w-full py-2 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs"
          >
            <Download className="w-4 h-4" /> Export Backup
          </button>
        </div>

        {/* Import Card */}
        <div className="p-5 border border-stone-200/60 rounded-2xl hover:shadow-xs transition-all space-y-4 flex flex-col justify-between">
          <div>
            <div className="w-9 h-9 rounded-full bg-stone-100 text-stone-900 flex items-center justify-center">
              <Upload className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-xs text-stone-900 mt-3">Import Backup</h3>
            <p className="text-[11px] text-stone-400 mt-1">
              Upload a previously exported JSON backup file to restore all your habits, tasks, and consistency progress.
            </p>
          </div>
          <button
            onClick={handleImportClick}
            className="w-full py-2 border border-stone-200 hover:bg-stone-50 text-stone-700 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Upload className="w-4 h-4" /> Import Backup File
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />
        </div>
      </div>

      {importStatus.type && (
        <div className="p-4 rounded-xl flex items-start gap-3 border bg-stone-50 border-stone-200/60 text-stone-900">
          {importStatus.type === 'success' ? (
            <Check className="w-4 h-4 shrink-0 mt-0.5 text-green-600 animate-bounce" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500 animate-pulse" />
          )}
          <span className="text-xs font-semibold">{importStatus.message}</span>
        </div>
      )}
    </div>
  );
}
