import { GOOGLE_APPS_SCRIPT_URL, isAppsScriptUrlConfigured } from '../config';
import { SchoolRecord, DashboardMetrics, ApiResponse } from '../types';
import { INITIAL_SAMPLE_SCHOOLS } from '../data/sampleSchools';

const LOCAL_STORAGE_KEY = 'udise_schools_data_v2';

// Initialize local cache from localStorage or sample data
export function getLocalSchools(): SchoolRecord[] {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((s: SchoolRecord) => ({
          ...s,
          reason: s.reason || '',
        }));
      }
    }
  } catch (e) {
    console.error('Failed reading localStorage', e);
  }
  return INITIAL_SAMPLE_SCHOOLS.map(s => ({ ...s, reason: '' }));
}

export function saveLocalSchools(schools: SchoolRecord[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(schools));
  } catch (e) {
    console.error('Failed writing to localStorage', e);
  }
}

export function computeMetrics(schools: SchoolRecord[]): DashboardMetrics {
  let feeded = 0;
  let notFeeded = 0;
  let completed = 0;
  let pending = 0;

  schools.forEach((s) => {
    feeded += Number(s.feededStudents) || 0;
    notFeeded += Number(s.notFeededStudents) || 0;
    if (s.isComplete || hasSchoolExistingData(s)) {
      completed++;
    } else {
      pending++;
    }
  });

  const totalStudents = feeded + notFeeded;
  const rate = totalStudents > 0 ? Math.round((feeded / totalStudents) * 100) : 0;

  return {
    totalSchools: schools.length,
    completedSchools: completed,
    pendingSchools: pending,
    totalFeededStudents: feeded,
    totalNotFeededStudents: notFeeded,
    totalStudentsRecorded: totalStudents,
    completionRate: rate,
  };
}

export function hasSchoolExistingData(s: Partial<SchoolRecord> | null | undefined): boolean {
  if (!s) return false;
  return Boolean(
    (s.headmaster && s.headmaster.trim().length > 0) ||
    (s.mobile && s.mobile.trim().length > 0) ||
    (Number(s.feededStudents) > 0) ||
    (Number(s.notFeededStudents) > 0) ||
    (s.reason && s.reason.trim().length > 0)
  );
}

/**
 * Fetch all schools and metrics from Google Apps Script (or local cache)
 */
export async function fetchAllSchoolsData(): Promise<{
  schools: SchoolRecord[];
  metrics: DashboardMetrics;
  isLive: boolean;
  message?: string;
}> {
  const isLive = isAppsScriptUrlConfigured();

  if (isLive) {
    try {
      const targetUrl = new URL(GOOGLE_APPS_SCRIPT_URL);
      targetUrl.searchParams.set('action', 'getAll');
      targetUrl.searchParams.set('_t', Date.now().toString());

      const res = await fetch(targetUrl.toString(), {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) {
        throw new Error(`Google Apps Script returned HTTP ${res.status}`);
      }

      const json = await res.json();
      if (json.status === 'success' && Array.isArray(json.schools)) {
        // Update local cache
        saveLocalSchools(json.schools);
        return {
          schools: json.schools,
          metrics: json.metrics || computeMetrics(json.schools),
          isLive: true,
          message: 'Connected to live Google Sheet via Google Apps Script',
        };
      }
    } catch (err: any) {
      console.warn('Direct fetch from Google Apps Script failed, using local cache:', err);
      // Fallback gracefully to local cache
      const local = getLocalSchools();
      return {
        schools: local,
        metrics: computeMetrics(local),
        isLive: false,
        message: `Could not connect to Google Apps Script (${err.message || 'Network error'}). Using cached/local data.`,
      };
    }
  }

  // Not configured yet
  const local = getLocalSchools();
  return {
    schools: local,
    metrics: computeMetrics(local),
    isLive: false,
    message: 'Local Preview Mode. Configure GOOGLE_APPS_SCRIPT_URL in src/config.ts to sync live with Google Sheets.',
  };
}

/**
 * Find school record by UDISE Code
 */
export async function getSchoolByUdise(udise: string): Promise<{
  school: SchoolRecord | null;
  found: boolean;
  hasExistingData: boolean;
  source: 'live' | 'local';
}> {
  const cleanUdise = udise.trim();
  if (!cleanUdise) {
    return { school: null, found: false, hasExistingData: false, source: 'local' };
  }

  const isLive = isAppsScriptUrlConfigured();

  if (isLive) {
    try {
      const targetUrl = new URL(GOOGLE_APPS_SCRIPT_URL);
      targetUrl.searchParams.set('action', 'getByUdise');
      targetUrl.searchParams.set('udise', cleanUdise);
      targetUrl.searchParams.set('_t', Date.now().toString());

      const res = await fetch(targetUrl.toString());
      if (res.ok) {
        const json = await res.json();
        if (json.status === 'success' && json.found && json.data) {
          const schoolData: SchoolRecord = {
            udise: json.data.udise,
            schoolName: json.data.schoolName,
            headmaster: json.data.headmaster || '',
            mobile: json.data.mobile || '',
            feededStudents: Number(json.data.feededStudents) || 0,
            notFeededStudents: Number(json.data.notFeededStudents) || 0,
            reason: json.data.reason || '',
            isComplete: json.data.isComplete,
            updatedAt: json.data.updatedAt,
          };
          return {
            school: schoolData,
            found: true,
            hasExistingData: Boolean(json.hasExistingData ?? hasSchoolExistingData(schoolData)),
            source: 'live',
          };
        }
      }
    } catch (e) {
      console.warn('Failed querying Google Apps Script by UDISE, falling back to local cache', e);
    }
  }

  // Fallback / Local Search
  const localList = getLocalSchools();
  const matched = localList.find((s) => s.udise.trim() === cleanUdise);

  if (matched) {
    return {
      school: { ...matched },
      found: true,
      hasExistingData: hasSchoolExistingData(matched),
      source: 'local',
    };
  }

  return { school: null, found: false, hasExistingData: false, source: 'local' };
}

/**
 * Save or Update school record in Google Apps Script and local cache
 */
export async function saveOrUpdateSchool(record: SchoolRecord): Promise<ApiResponse<SchoolRecord>> {
  const isLive = isAppsScriptUrlConfigured();

  const formattedRecord: SchoolRecord = {
    ...record,
    udise: record.udise.trim(),
    headmaster: (record.headmaster || '').trim().toUpperCase(),
    feededStudents: Number(record.feededStudents) || 0,
    notFeededStudents: Number(record.notFeededStudents) || 0,
    isComplete: true,
    updatedAt: new Date().toISOString(),
  };

  // 1. Update local cache first
  const currentSchools = getLocalSchools();
  const index = currentSchools.findIndex((s) => s.udise.trim() === formattedRecord.udise);
  let action: 'saved' | 'updated' = 'saved';

  if (index >= 0) {
    const existing = currentSchools[index];
    const hadExisting = hasSchoolExistingData(existing);
    action = hadExisting ? 'updated' : 'saved';
    currentSchools[index] = {
      ...existing,
      ...formattedRecord,
      schoolName: formattedRecord.schoolName || existing.schoolName,
    };
  } else {
    currentSchools.unshift(formattedRecord);
    action = 'saved';
  }
  saveLocalSchools(currentSchools);

  // 2. If Google Apps Script is configured, post to it
  if (isLive) {
    try {
      // Use text/plain with JSON body to avoid preflight CORS options blockage in GAS Web App
      const res = await fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'saveOrUpdate',
          ...formattedRecord,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        return {
          status: 'success',
          action: json.action || action,
          message: json.message || (action === 'updated' ? 'Record updated in Google Sheet successfully!' : 'Record saved to Google Sheet successfully!'),
          data: json.data || formattedRecord,
        };
      }
    } catch (e: any) {
      console.warn('POST to Google Apps Script failed, trying GET fallback:', e);
      try {
        // Fallback to GET method if POST encountered redirect/CORS issues
        const getUrl = new URL(GOOGLE_APPS_SCRIPT_URL);
        getUrl.searchParams.set('action', 'saveOrUpdate');
        getUrl.searchParams.set('udise', formattedRecord.udise);
        getUrl.searchParams.set('schoolName', formattedRecord.schoolName);
        getUrl.searchParams.set('headmaster', formattedRecord.headmaster);
        getUrl.searchParams.set('mobile', formattedRecord.mobile);
        getUrl.searchParams.set('feededStudents', formattedRecord.feededStudents.toString());
        getUrl.searchParams.set('notFeededStudents', formattedRecord.notFeededStudents.toString());
        getUrl.searchParams.set('reason', formattedRecord.reason);
        getUrl.searchParams.set('_t', Date.now().toString());

        const res2 = await fetch(getUrl.toString());
        if (res2.ok) {
          const json2 = await res2.json();
          return {
            status: 'success',
            action: json2.action || action,
            message: json2.message || 'Saved successfully via Google Apps Script!',
            data: json2.data || formattedRecord,
          };
        }
      } catch (err2) {
        console.error('All fetch attempts to Google Apps Script failed:', err2);
      }
    }

    return {
      status: 'success',
      action,
      message: `Record ${action === 'updated' ? 'updated' : 'saved'} in local cache. Note: Google Sheet sync encountered a connection error. Verify permissions on your Web App URL.`,
      data: formattedRecord,
    };
  }

  // Pure local mode response
  return {
    status: 'success',
    action,
    message: action === 'updated'
      ? `School performance metrics updated successfully for ${formattedRecord.schoolName || formattedRecord.udise}!`
      : `School performance data saved successfully for ${formattedRecord.schoolName || formattedRecord.udise}!`,
    data: formattedRecord,
  };
}
