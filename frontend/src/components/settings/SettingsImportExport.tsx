import React, { useState, useRef } from 'react';
import { Button } from '../common/Button';
import { useSettings } from '../../hooks/useSettings';

export const SettingsImportExport: React.FC = () => {
  const { exportSettings, importSettings } = useSettings();
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    try {
      const settingsJson = exportSettings();
      const blob = new Blob([settingsJson], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `webcrawler-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting settings:', error);
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const success = importSettings(content);
        
        if (success) {
          setImportSuccess('Settings imported successfully');
          setImportError(null);
        } else {
          setImportError('Invalid settings file format');
          setImportSuccess(null);
        }
      } catch (error) {
        setImportError('Error reading settings file');
        setImportSuccess(null);
      }
    };
    
    reader.readAsText(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Import/Export Settings</h3>
      
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600 mb-3">
            Export your current settings to a JSON file or import settings from a previously exported file.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleExport}
            variant="secondary"
            size="small"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export Settings
          </Button>
          
          <Button
            onClick={triggerFileInput}
            variant="secondary"
            size="small"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Import Settings
          </Button>
        </div>
        
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          className="hidden"
        />
        
        {/* Status messages */}
        {importSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-800">{importSuccess}</p>
              </div>
            </div>
          </div>
        )}
        
        {importError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{importError}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="text-xs text-gray-500">
          <p>• Export includes all your current settings</p>
          <p>• Import will replace your current settings</p>
          <p>• Settings are stored locally in your browser</p>
        </div>
      </div>
    </div>
  );
}; 