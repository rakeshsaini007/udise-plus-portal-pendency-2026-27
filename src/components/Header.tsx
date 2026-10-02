import React from 'react';
import { School, RefreshCw, Code2 } from 'lucide-react';

interface HeaderProps {
  onRefresh: () => void;
  isRefreshing: boolean;
  onOpenScriptModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onRefresh,
  isRefreshing,
  onOpenScriptModal,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Portal Identity */}
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-700 to-cyan-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <School className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  UDISE+ Portal
                </span>
                <span className="hidden sm:inline-block text-xs text-slate-500 font-medium">
                  Department of Basic Education
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                UDISE + Portal Pendency Dashboard
              </h1>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {onOpenScriptModal && (
              <button
                onClick={onOpenScriptModal}
                title="Apps Script Guide & Deployment"
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
              >
                <Code2 className="w-4 h-4 text-slate-600" />
              </button>
            )}

            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Reload data from Google Sheet"
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
