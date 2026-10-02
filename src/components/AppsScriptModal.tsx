import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Code2,
  ExternalLink,
  ShieldCheck,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';
import { GOOGLE_APPS_SCRIPT_URL, isAppsScriptUrlConfigured } from '../config';

interface AppsScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTestConnection: (url: string) => Promise<boolean>;
}

export const AppsScriptModal: React.FC<AppsScriptModalProps> = ({
  isOpen,
  onClose,
  onTestConnection,
}) => {
  const [copied, setCopied] = useState(false);
  const [testUrl, setTestUrl] = useState(GOOGLE_APPS_SCRIPT_URL);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [testMessage, setTestMessage] = useState('');

  if (!isOpen) return null;

  const isConfigured = isAppsScriptUrlConfigured();

  const handleCopyCode = async () => {
    try {
      const res = await fetch('/code.js');
      let text = '';
      if (res.ok) {
        text = await res.text();
      } else {
        // Fallback embedded text if file fetch fails
        text = `// Please view /code.js in the project files root directory`;
      }
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const runTest = async () => {
    if (!testUrl.trim()) return;
    setTestStatus('testing');
    setTestMessage('Pinging Google Apps Script Web App...');

    try {
      const ok = await onTestConnection(testUrl);
      if (ok) {
        setTestStatus('success');
        setTestMessage('Success! Successfully communicated with your Google Apps Script Web App.');
      } else {
        setTestStatus('failed');
        setTestMessage('Connection failed. Make sure deployment access is set to "Anyone".');
      }
    } catch (e: any) {
      setTestStatus('failed');
      setTestMessage(e.message || 'Request failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Google Apps Script Setup & Deploy Guide
              </h2>
              <p className="text-xs text-slate-300">
                Connect your Google Sheet to the UDISE+ Dashboard in 2 minutes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Target File Highlight Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-blue-100 rounded-lg text-blue-700 shrink-0 mt-0.5">
                <FileCode className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-blue-900">
                  File where you enter your Google Apps Script URL:
                </h3>
                <p className="text-xs text-blue-800 leading-relaxed">
                  Open <code className="px-2 py-0.5 rounded bg-blue-100 font-mono font-bold text-blue-900">src/config.ts</code> in the code editor, and update the constant:
                </p>
                <div className="mt-2 bg-slate-900 text-cyan-300 font-mono text-xs p-3 rounded-lg overflow-x-auto">
                  <span className="text-slate-400">// Inside src/config.ts:</span><br />
                  <span className="text-purple-400">export const</span> <span className="text-yellow-300">GOOGLE_APPS_SCRIPT_URL</span> = <span className="text-emerald-300">"https://script.google.com/macros/s/AKfycb.../exec"</span>;
                </div>
              </div>
            </div>
          </div>

          {/* Current URL Status */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Current Configured URL
              </span>
              <p className="text-xs font-mono font-medium text-slate-800 mt-1 break-all">
                {GOOGLE_APPS_SCRIPT_URL || '(Empty - currently running in local preview mode)'}
              </p>
            </div>
            <div className="shrink-0">
              {isConfigured ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  URL Configured
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Not configured yet
                </span>
              )}
            </div>
          </div>

          {/* Step by Step Deployment Instructions */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-xs">
              Step-by-Step Instructions:
            </h3>

            <ol className="space-y-3 text-xs text-slate-700">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-200 font-bold text-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <strong className="text-slate-900">Open your Google Sheet</strong> containing your UDISE data columns.
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-200 font-bold text-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  Click top menu <strong className="text-slate-900">Extensions</strong> &gt; <strong className="text-slate-900">Apps Script</strong>.
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-200 font-bold text-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  In the Apps Script editor, copy all code from the file <code className="px-1.5 py-0.5 rounded bg-slate-100 font-mono font-semibold">code.js</code> (located in this project's root) and paste it into the editor.
                  <div className="mt-2">
                    <button
                      onClick={handleCopyCode}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors shadow-xs"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Code Copied to Clipboard!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Copy code.js to Clipboard</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-200 font-bold text-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                  4
                </span>
                <div>
                  Click the blue <strong className="text-slate-900">Deploy</strong> button &gt; <strong className="text-slate-900">New deployment</strong>.
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-200 font-bold text-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                  5
                </span>
                <div>
                  Click the gear icon (Select type) and choose <strong className="text-slate-900">Web app</strong>.
                  <div className="mt-1.5 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px] space-y-1">
                    <div>• <strong>Execute as:</strong> "Me" (your email)</div>
                    <div>• <strong>Who has access:</strong> <span className="font-bold underline text-amber-950">"Anyone"</span> (CRITICAL: Must select Anyone so dashboard fetch calls can connect without auth blockage!)</div>
                  </div>
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-200 font-bold text-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                  6
                </span>
                <div>
                  Click <strong className="text-slate-900">Deploy</strong>, authorize if prompted, and copy the generated <strong className="text-slate-900">Web App URL</strong> (ends with <code className="font-mono text-slate-800">/exec</code>).
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 font-bold text-white flex items-center justify-center shrink-0 mt-0.5">
                  7
                </span>
                <div>
                  Open <code className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 font-mono font-bold">src/config.ts</code> and paste your URL into <code className="font-mono text-blue-900 font-bold">GOOGLE_APPS_SCRIPT_URL</code>. That's it!
                </div>
              </li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
