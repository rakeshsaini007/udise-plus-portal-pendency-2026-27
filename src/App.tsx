/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { UdiseSearchAndForm } from './components/UdiseSearchAndForm';
import { AppsScriptModal } from './components/AppsScriptModal';
import { SchoolRecord, DashboardMetrics } from './types';
import {
  fetchAllSchoolsData,
  computeMetrics,
} from './services/api';
import { isAppsScriptUrlConfigured } from './config';

export default function App() {
  const [schools, setSchools] = useState<SchoolRecord[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalSchools: 0,
    completedSchools: 0,
    pendingSchools: 0,
    totalFeededStudents: 0,
    totalNotFeededStudents: 0,
    totalStudentsRecorded: 0,
    completionRate: 0,
  });
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isScriptModalOpen, setIsScriptModalOpen] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    isLive: boolean;
    message: string;
  }>({
    isLive: isAppsScriptUrlConfigured(),
    message: 'Loading school performance data...',
  });

  // Load data on mount
  const loadData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const result = await fetchAllSchoolsData();
      setSchools(result.schools);
      setMetrics(result.metrics);
      setConnectionStatus({
        isLive: result.isLive,
        message: result.message || (result.isLive ? 'Connected to Google Sheet' : 'Local Preview Mode'),
      });
    } catch (err: any) {
      console.error('Error fetching data:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle successful save or update
  const handleSuccess = (updatedRecord: SchoolRecord, action: 'saved' | 'updated') => {
    setSchools((prev) => {
      const idx = prev.findIndex((s) => s.udise.trim() === updatedRecord.udise.trim());
      let next: SchoolRecord[];
      if (idx >= 0) {
        next = [...prev];
        next[idx] = updatedRecord;
      } else {
        next = [updatedRecord, ...prev];
      }
      setMetrics(computeMetrics(next));
      return next;
    });
  };

  // Test custom connection from modal
  const handleTestConnection = async (testUrl: string): Promise<boolean> => {
    try {
      const url = new URL(testUrl);
      url.searchParams.set('action', 'getAll');
      url.searchParams.set('_t', Date.now().toString());

      const res = await fetch(url.toString());
      if (res.ok) {
        const json = await res.json();
        return json.status === 'success';
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 font-sans flex flex-col">
      {/* Header */}
      <Header
        onRefresh={loadData}
        isRefreshing={isRefreshing}
        onOpenScriptModal={() => setIsScriptModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* UDISE Lookup, Existing Data Card & Update/Submit Form */}
        <UdiseSearchAndForm
          onSuccess={handleSuccess}
          availableSchools={schools}
        />
      </main>

      {/* Modal for Google Apps Script Code & Instructions */}
      <AppsScriptModal
        isOpen={isScriptModalOpen}
        onClose={() => setIsScriptModalOpen(false)}
        onTestConnection={handleTestConnection}
      />
    </div>
  );
}
