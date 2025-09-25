import React, { useState, useCallback } from 'react';
import { FileUploader } from './components/FileUploader';
import { SizeSelector } from './components/SizeSelector';
import { SplitFileList } from './components/SplitFileList';
import { splitFile } from './services/fileSplitter';
import type { SplitFile as SplitFileType } from './types';
import { SpinnerIcon, WarningIcon } from './components/icons';

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [maxSizeMB, setMaxSizeMB] = useState<number>(2);
  const [splitFiles, setSplitFiles] = useState<SplitFileType[]>([]);
  const [isSplitting, setIsSplitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [fileTypeWarning, setFileTypeWarning] = useState<string | null>(null);

  const handleFileChange = useCallback((selectedFile: File | null) => {
    setFile(selectedFile);
    setSplitFiles([]);
    setError(null);
    if (selectedFile) {
      const extension = selectedFile.name.split('.').pop()?.toLowerCase();
      if (['doc', 'docx', 'xls', 'xlsx'].includes(extension || '')) {
        setFileTypeWarning('Page-aware splitting is not supported for Word/Excel. The file will be split by size, which may corrupt complex files. PDF is recommended for page-based splitting.');
      } else {
        setFileTypeWarning(null);
      }
    } else {
        setFileTypeWarning(null);
    }
  }, []);

  const handleSplit = async () => {
    if (!file) return;

    const maxSizeInBytes = maxSizeMB * 1024 * 1024;
    if (file.size <= maxSizeInBytes) {
      setError('File is already smaller than the selected chunk size. No splitting is required.');
      return;
    }

    setIsSplitting(true);
    setError(null);
    setSplitFiles([]);

    try {
      const chunks = await splitFile(file, maxSizeInBytes);
      if (chunks.length <= 1) {
        setError('This file cannot be split into multiple parts with the selected chunk size. Try selecting a smaller chunk size.');
      } else {
        setSplitFiles(chunks);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred during splitting.');
    } finally {
      setIsSplitting(false);
    }
  };
  
  const resetState = () => {
    setFile(null);
    setSplitFiles([]);
    setError(null);
    setIsSplitting(false);
    setMaxSizeMB(2);
    setFileTypeWarning(null);
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center justify-center p-4 selection:bg-cyan-400/20">
      <div className="w-full max-w-3xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 font-display">
            File Splitter Pro
          </h1>
          <p className="text-gray-400 mt-2 text-lg">
            Split ZIP, PDF, Word & Excel files into smaller chunks with ease.
          </p>
        </header>

        <main className="bg-gray-800/50 backdrop-blur-sm border border-cyan-400/20 rounded-2xl p-6 md:p-8 shadow-2xl shadow-black/30 transition-all duration-300">
          {!file || splitFiles.length > 0 ? (
             <div className={splitFiles.length > 0 ? "opacity-0 h-0 overflow-hidden" : "opacity-100 h-auto"}>
                <FileUploader onFileChange={handleFileChange} />
             </div>
          ) : null}

          {file && splitFiles.length === 0 && (
            <div className="flex flex-col space-y-6">
              <div>
                <h2 className="text-2xl font-bold font-display text-cyan-400">Selected File</h2>
                <div className="mt-2 bg-gray-700/50 p-4 rounded-lg flex justify-between items-center">
                  <span className="font-mono truncate pr-4">{file.name}</span>
                  <span className="text-gray-400 whitespace-nowrap">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
              </div>

              <SizeSelector value={maxSizeMB} onChange={setMaxSizeMB} />

              {fileTypeWarning && (
                <div className="bg-yellow-900/50 border border-yellow-500/30 text-yellow-300 p-3 rounded-lg flex items-start space-x-3">
                  <WarningIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{fileTypeWarning}</p>
                </div>
              )}

              {error && (
                 <div className="bg-red-900/50 border border-red-500/30 text-red-300 p-3 rounded-lg">
                  <p><span className="font-bold">Error:</span> {error}</p>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <button
                  onClick={handleSplit}
                  disabled={isSplitting}
                  className="w-full sm:w-auto flex-grow bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-3 px-8 rounded-lg text-lg flex items-center justify-center transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                >
                  {isSplitting ? <SpinnerIcon /> : `Split File`}
                </button>
                 <button
                  onClick={() => handleFileChange(null)}
                  disabled={isSplitting}
                  className="w-full sm:w-auto bg-gray-700 hover:bg-gray-600 text-gray-300 font-bold py-3 px-6 rounded-lg transition-colors duration-300 disabled:opacity-50"
                >
                  Change File
                </button>
              </div>

            </div>
          )}
          
          {splitFiles.length > 0 && (
            <div>
              <SplitFileList files={splitFiles} />
              <button
                onClick={resetState}
                className="w-full mt-6 bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition-all duration-300 transform hover:scale-105"
              >
                Split Another File
              </button>
            </div>
          )}
        </main>
         <footer className="text-center mt-8 text-gray-500 text-sm">
            <p>&copy; {new Date().getFullYear()} File Splitter Pro. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;