import React from 'react';
import { DashboardMetrics } from '../types';
import { School, Users, CheckCircle2, Clock, AlertTriangle, TrendingUp } from 'lucide-react';

interface MetricsOverviewProps {
  metrics: DashboardMetrics;
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({ metrics }) => {
  const completionPercentage = metrics.totalSchools > 0 
    ? Math.round((metrics.completedSchools / metrics.totalSchools) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Metric 1: Total Schools */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Schools
          </span>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <School className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-900">{metrics.totalSchools}</span>
          <span className="text-xs text-slate-500 font-medium">registered in sheet</span>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {metrics.completedSchools} Updated
          </span>
          <span className="text-slate-300">•</span>
          <span className="inline-flex items-center gap-1 font-medium text-amber-600">
            <Clock className="w-3.5 h-3.5" />
            {metrics.pendingSchools} Pending
          </span>
        </div>
      </div>

      {/* Metric 2: Feeded on UDISE+ (S02 Form) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-emerald-200 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Feeded Students (S02)
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-emerald-600">
            {metrics.totalFeededStudents.toLocaleString()}
          </span>
          <span className="text-xs text-emerald-700 bg-emerald-50 font-semibold px-2 py-0.5 rounded-full">
            Feeded
          </span>
        </div>
        <p className="mt-3 text-xs text-slate-500 font-medium truncate">
          Successfully verified on Udise Plus portal
        </p>
      </div>

      {/* Metric 3: Pendency Students */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-amber-200 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Pending Students
          </span>
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-amber-600">
            {metrics.totalNotFeededStudents.toLocaleString()}
          </span>
          <span className="text-xs text-amber-700 bg-amber-50 font-semibold px-2 py-0.5 rounded-full">
            Not feeded
          </span>
        </div>
        <p className="mt-3 text-xs text-slate-500 font-medium truncate">
          Awaiting entry or verification by Headmaster
        </p>
      </div>

      {/* Metric 4: Progress Ratio */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-indigo-200 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            School Completion
          </span>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-indigo-600">{completionPercentage}%</span>
          <span className="text-xs text-slate-500 font-medium">
            ({metrics.completedSchools}/{metrics.totalSchools} schools)
          </span>
        </div>
        <div className="mt-3 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, completionPercentage)}%` }}
          />
        </div>
      </div>
    </div>
  );
};
