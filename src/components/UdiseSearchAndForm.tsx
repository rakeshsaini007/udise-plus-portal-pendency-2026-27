import React, { useState, useEffect } from 'react';
import {
  Search,
  School as SchoolIcon,
  User,
  Phone,
  CheckCircle2,
  FileEdit,
  Send,
  Info,
  ShieldCheck,
  AlertTriangle,
  Lock
} from 'lucide-react';
import { SchoolRecord } from '../types';
import { getSchoolByUdise, saveOrUpdateSchool, hasSchoolExistingData } from '../services/api';

interface UdiseSearchAndFormProps {
  onSuccess: (updatedRecord: SchoolRecord, action: 'saved' | 'updated') => void;
  availableSchools: SchoolRecord[];
}

export const UdiseSearchAndForm: React.FC<UdiseSearchAndFormProps> = ({
  onSuccess,
  availableSchools,
}) => {
  // Search state
  const [searchUdise, setSearchUdise] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [existingRecord, setExistingRecord] = useState<SchoolRecord | null>(null);
  const [isDataAlreadyPresent, setIsDataAlreadyPresent] = useState<boolean>(false);
  const [searchFeedback, setSearchFeedback] = useState<{
    type: 'success' | 'info' | 'warning';
    message: string;
  } | null>(null);

  // Form states
  const [udiseCode, setUdiseCode] = useState<string>('');
  const [schoolName, setSchoolName] = useState<string>('');
  const [headmaster, setHeadmaster] = useState<string>('');
  const [mobile, setMobile] = useState<string>('');
  const [feededStudents, setFeededStudents] = useState<string>('');
  const [notFeededStudents, setNotFeededStudents] = useState<string>('');
  const [reason, setReason] = useState<string>('');

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [alertSuccess, setAlertSuccess] = useState<{
    show: boolean;
    title: string;
    message: string;
    action: 'saved' | 'updated';
  } | null>(null);

  // Business logic: Check if pending students input is "0" or greater than 0
  const pendingNum = Number(notFeededStudents);
  const isZeroPending = notFeededStudents.trim() === '0' || (!isNaN(pendingNum) && pendingNum === 0 && notFeededStudents.trim() !== '');
  const hasPendingStudents = !isZeroPending && notFeededStudents.trim() !== '' && !isNaN(pendingNum) && pendingNum > 0;

  // Quick lookup handler when UDISE Code changes or search triggered
  const handleLookupUdise = async (targetCode: string) => {
    const clean = targetCode.trim();
    if (!clean) {
      setExistingRecord(null);
      setIsDataAlreadyPresent(false);
      setSearchFeedback(null);
      return;
    }

    setIsSearching(true);
    setSearchFeedback(null);

    try {
      const res = await getSchoolByUdise(clean);

      if (res.found && res.school) {
        const found = res.school;
        const dataPresent = res.hasExistingData || hasSchoolExistingData(found);

        setExistingRecord(found);
        setIsDataAlreadyPresent(dataPresent);

        // Pre-fill form inputs
        setUdiseCode(found.udise);
        setSchoolName(found.schoolName || '');
        setHeadmaster((found.headmaster || '').toUpperCase());
        setMobile(found.mobile || '');
        setFeededStudents(found.feededStudents !== undefined ? String(found.feededStudents) : '0');
        setNotFeededStudents(found.notFeededStudents !== undefined ? String(found.notFeededStudents) : '0');
        setReason(found.reason || '');

        if (dataPresent) {
          setSearchFeedback({
            type: 'info',
            message: `Found record with existing performance data for "${found.schoolName}". Button updated to "Update Record".`,
          });
        } else {
          setSearchFeedback({
            type: 'success',
            message: `Found school "${found.schoolName}" in sheet. Ready for initial data entry.`,
          });
        }
      } else {
        // Not found in sheet
        setExistingRecord(null);
        setIsDataAlreadyPresent(false);
        setUdiseCode(clean);
        setSearchFeedback({
          type: 'warning',
          message: `UDISE Code "${clean}" is not in the current sheet list. You can enter details to add a new record.`,
        });
      }
    } catch (err: any) {
      setSearchFeedback({
        type: 'warning',
        message: 'Could not lookup UDISE code from sheet: ' + err.message,
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced auto-search when typing UDISE code in search input
  useEffect(() => {
    if (searchUdise.trim().length >= 10) {
      const timer = setTimeout(() => {
        handleLookupUdise(searchUdise);
      }, 350);
      return () => clearTimeout(timer);
    } else if (searchUdise.trim().length === 0) {
      setExistingRecord(null);
      setIsDataAlreadyPresent(false);
      setSearchFeedback(null);
    }
  }, [searchUdise]);

  // Form Reset / Clear
  const handleClearForm = () => {
    setSearchUdise('');
    setUdiseCode('');
    setSchoolName('');
    setHeadmaster('');
    setMobile('');
    setFeededStudents('');
    setNotFeededStudents('');
    setReason('');
    setExistingRecord(null);
    setIsDataAlreadyPresent(false);
    setSearchFeedback(null);
  };

  // Handle Form Submission / Update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!udiseCode.trim()) {
      alert('Please enter a valid UDISE Code.');
      return;
    }

    if (!headmaster.trim()) {
      alert('Please enter the Name of Headmaster.');
      return;
    }

    if (!mobile.trim() || mobile.trim().length < 10) {
      alert('Please enter a valid 10-digit Mobile Number.');
      return;
    }

    const pendingCount = Number(notFeededStudents) || 0;

    // Rule: If pending students is other than "0", Reason for Pendency is mandatory
    if (pendingCount > 0 && !reason.trim()) {
      alert('Please enter Reason for Pendency (Col G). It is mandatory when pending students is greater than 0.');
      return;
    }

    // Rule: If pending students is "0", Col G is filled with "100% Entry Completed"
    const finalReason = pendingCount === 0 ? '100% Entry Completed' : reason.trim();

    setIsSubmitting(true);

    const recordToSave: SchoolRecord = {
      udise: udiseCode.trim(),
      schoolName: schoolName.trim() || existingRecord?.schoolName || `School (${udiseCode})`,
      headmaster: headmaster.trim().toUpperCase(),
      mobile: mobile.trim(),
      feededStudents: Number(feededStudents) || 0,
      notFeededStudents: pendingCount,
      reason: finalReason,
    };

    try {
      const res = await saveOrUpdateSchool(recordToSave);

      const actionType = res.action || (isDataAlreadyPresent ? 'updated' : 'saved');
      const actionText = actionType === 'updated' ? 'Updated' : 'Saved';

      // 1. Give Alert as requested: "it will give alert when data is saved or updated successfully and clear the input fields"
      setAlertSuccess({
        show: true,
        title: `School Data ${actionText} Successfully!`,
        message: res.message || `Data for ${recordToSave.schoolName} (UDISE: ${recordToSave.udise}) has been ${actionType} in the Google Sheet.`,
        action: actionType,
      });

      // Also trigger a standard browser alert banner / notification
      onSuccess(res.data || recordToSave, actionType);

      // 2. Clear all input fields as requested: "and clear the input fields."
      handleClearForm();

    } catch (err: any) {
      alert(`Error saving school data: ${err.message || 'Network error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* SUCCESS ALERT BANNER */}
      {alertSuccess && alertSuccess.show && (
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-4 sm:p-5 text-emerald-900 shadow-md animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700 shrink-0 mt-0.5">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-emerald-900">{alertSuccess.title}</h3>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800 uppercase tracking-wide">
                    {alertSuccess.action} in Sheet
                  </span>
                </div>
                <p className="mt-1 text-sm text-emerald-800">{alertSuccess.message}</p>
                <p className="mt-2 text-xs font-medium text-emerald-700 bg-emerald-100/70 inline-block px-2.5 py-1 rounded-md">
                  ✓ Input fields have been cleared and dashboard metrics refreshed.
                </p>
              </div>
            </div>
            <button
              onClick={() => setAlertSuccess(null)}
              className="text-emerald-700 hover:text-emerald-900 font-semibold p-1 hover:bg-emerald-100 rounded-md transition-colors"
              title="Dismiss alert"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* SEARCH SECTION */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-600" />
              UDISE Code Lookup & Automatic Data Retrieval
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              शुरुआती शून्य के बिना यूडाइस कोड भरें
            </p>
          </div>
          {isDataAlreadyPresent && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              Record exists in sheet (Update mode enabled)
            </span>
          )}
        </div>

        {/* Input & Search Controls */}
        <div className="mt-4">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <SchoolIcon className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchUdise}
                onChange={(e) => setSearchUdise(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleLookupUdise(searchUdise);
                  }
                }}
                maxLength={11}
                placeholder="Fill UDISE Code (e.g. 9050326306)..."
                className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white font-mono tracking-wider transition-all"
              />
              {searchUdise && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchUdise('');
                    handleClearForm();
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => handleLookupUdise(searchUdise)}
              disabled={isSearching || !searchUdise.trim()}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-50"
            >
              <Search className={`w-4 h-4 ${isSearching ? 'animate-spin' : ''}`} />
              <span>{isSearching ? 'Searching...' : 'Retrieve School'}</span>
            </button>
          </div>

          {/* Search Feedback Message */}
          {searchFeedback && (
            <div
              className={`mt-3 p-3 rounded-lg text-xs font-medium flex items-center gap-2 border ${
                searchFeedback.type === 'info'
                  ? 'bg-blue-50 border-blue-200 text-blue-800'
                  : searchFeedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}
            >
              {searchFeedback.type === 'info' ? (
                <Info className="w-4 h-4 shrink-0 text-blue-600" />
              ) : searchFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
              )}
              <span>{searchFeedback.message}</span>
            </div>
          )}
        </div>
      </div>

      {/* MAIN FORM: SUBMIT OR UPDATE */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Field 1: UDISE Code (Non-editable, populated from search) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>UDISE Code <span className="text-rose-500">*</span></span>
                <span className="text-[11px] text-slate-400 font-normal lowercase flex items-center gap-1">
                  <Lock className="w-3 h-3 text-slate-400" /> auto-filled
                </span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  readOnly
                  value={udiseCode}
                  placeholder="Populated via lookup above"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-mono cursor-not-allowed select-all focus:outline-none"
                />
              </div>
            </div>

            {/* Field 2: School Name (Non-editable, populated from sheet) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>School Name <span className="text-rose-500">*</span></span>
                <span className="text-[11px] text-slate-400 font-normal lowercase flex items-center gap-1">
                  <Lock className="w-3 h-3 text-slate-400" /> auto-filled
                </span>
              </label>
              <input
                type="text"
                required
                readOnly
                value={schoolName}
                placeholder="Populated via lookup above"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-100 border border-slate-200 rounded-lg text-slate-700 cursor-not-allowed select-all focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Field 3: Name of Headmaster (English Capital Letters Only) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Name of Headmaster <span className="text-rose-500">*</span></span>
                <span className="text-[11px] text-slate-500 font-normal lowercase">(capital letters only)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={headmaster}
                  onChange={(e) => {
                    // Only English capital letters, spaces, and periods
                    const cleaned = e.target.value.toUpperCase().replace(/[^A-Z\s.]/g, '');
                    setHeadmaster(cleaned);
                  }}
                  placeholder="E.G. RAMESH KUMAR"
                  className="w-full pl-9 pr-3.5 py-2.5 text-sm uppercase bg-slate-50 border border-slate-300 rounded-lg text-slate-900 tracking-wide font-medium focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Field 4: Mobile Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Mobile Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                  placeholder="10-digit Mobile Number"
                  className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Field 5: Number of students feeded on Udise Plus portal by S02 Form */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Students Feeded (S02 Form) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  required
                  value={feededStudents}
                  onChange={(e) => setFeededStudents(e.target.value)}
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Col E: Number of students feeded on Udise Plus portal by S02 Form
              </p>
            </div>

            {/* Field 6: Number of Students which are even not feeded on Udise Plus portal */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Students NOT Feeded (Pending) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  required
                  value={notFeededStudents}
                  onChange={(e) => setNotFeededStudents(e.target.value)}
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Col F: Number of Students which are even not feeded on Udise Plus portal
              </p>
              {isZeroPending && (
                <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded-md flex items-center gap-1.5 text-xs text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Pendency is 0: Reason field hidden. Col G will be saved as <strong>"100% Entry Completed"</strong>.</span>
                </div>
              )}
            </div>
          </div>

          {/* Field 7: Reason for Pendency (Only displayed & mandatory when pending students is other than 0) */}
          {hasPendingStudents && (
            <div className="animate-in fade-in duration-200">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Reason for Pendency (Col G) <span className="text-rose-500">*</span></span>
                <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  Mandatory
                </span>
              </label>

              <textarea
                rows={2}
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Provide exact reason for pending students (e.g. Aadhaar authentication pending, physical verification in progress)..."
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-rose-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-rose-500 focus:bg-white focus:outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Col G: Reason is mandatory since pending students count is {notFeededStudents}.
              </p>
            </div>
          )}

          {/* DYNAMIC ACTION BUTTON: "Update Record" vs "Submit Record" */}
          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full sm:w-auto px-8 py-2.5 rounded-lg text-sm font-bold text-white shadow-md flex items-center justify-center gap-2 transition-all ${
                isDataAlreadyPresent
                  ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
              } disabled:opacity-50`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : isDataAlreadyPresent ? (
                <>
                  <FileEdit className="w-4 h-4" />
                  <span>Update Record</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Record</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
