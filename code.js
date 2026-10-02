/**
 * ============================================================================
 * GOOGLE APPS SCRIPT CODE FOR UDISE+ SCHOOL PERFORMANCE DASHBOARD
 * File: code.js
 * ============================================================================
 * 
 * INSTRUCTIONS FOR DEPLOYMENT IN GOOGLE SHEETS:
 * 1. Open your Google Sheet containing the school data (or create a new one).
 * 2. In the top menu, click on "Extensions" -> "Apps Script".
 * 3. Delete any existing code in the editor and paste this entire code.
 * 4. Click the "Save" (disk) icon at the top.
 * 5. (Optional) Run the function "setupSheetHeaders()" once to format columns.
 * 6. Click the blue "Deploy" button (top right) -> choose "New deployment".
 * 7. Click the gear icon (Select type) -> select "Web app".
 * 8. Set the configuration:
 *      - Description: "UDISE Dashboard API"
 *      - Execute as: "Me (your email)"
 *      - Who has access: "Anyone" (CRITICAL: Must be "Anyone" so dashboard can fetch)
 * 9. Click "Deploy". If prompted, click "Authorize access" and follow prompts.
 * 10. Copy the generated "Web App URL" (ends with /exec).
 * 11. Open "src/config.ts" in your dashboard project and paste the URL into:
 *      export const GOOGLE_APPS_SCRIPT_URL = "YOUR_DEPLOYED_URL_HERE";
 * ============================================================================
 */

// Target Sheet Name. Leave empty "" to use the first active sheet tab.
var SHEET_NAME = "";

/**
 * Handle HTTP GET Requests
 * Used to fetch all school data or query by UDISE Code
 */
function doGet(e) {
  try {
    var sheet = getTargetSheet();
    var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "getAll";
    var udise = (e && e.parameter && e.parameter.udise) ? String(e.parameter.udise).trim() : "";

    // Action: Query single school by UDISE code
    if (action === "getByUdise") {
      if (!udise) {
        return createJsonResponse({ status: "error", message: "UDISE code is required." });
      }
      var school = findSchoolByUdise(sheet, udise);
      if (school) {
        return createJsonResponse({
          status: "success",
          found: true,
          data: school.data,
          rowIndex: school.rowIndex,
          hasExistingData: checkHasExistingData(school.data)
        });
      } else {
        return createJsonResponse({
          status: "success",
          found: false,
          message: "School with UDISE code " + udise + " not found in sheet."
        });
      }
    }

    // Action: Save or Update via GET (CORS-friendly fallback)
    if (action === "saveOrUpdate") {
      var payload = {
        udise: e.parameter.udise || "",
        schoolName: e.parameter.schoolName || "",
        headmaster: e.parameter.headmaster || "",
        mobile: e.parameter.mobile || "",
        feededStudents: e.parameter.feededStudents || "0",
        notFeededStudents: e.parameter.notFeededStudents || "0",
        reason: e.parameter.reason || ""
      };
      return handleSaveOrUpdate(sheet, payload);
    }

    // Default Action: Return all schools with metrics
    var allData = getAllSchoolsData(sheet);
    return createJsonResponse({
      status: "success",
      totalCount: allData.schools.length,
      metrics: allData.metrics,
      schools: allData.schools
    });

  } catch (err) {
    return createJsonResponse({
      status: "error",
      message: err.toString()
    });
  }
}

/**
 * Handle HTTP POST Requests
 * Used to submit or update school data
 */
function doPost(e) {
  try {
    var sheet = getTargetSheet();
    var payload = {};

    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (jsonErr) {
        payload = e.parameter || {};
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    return handleSaveOrUpdate(sheet, payload);
  } catch (err) {
    return createJsonResponse({
      status: "error",
      message: err.toString()
    });
  }
}

/**
 * Core Logic to Save or Update School Record
 */
function handleSaveOrUpdate(sheet, payload) {
  var udise = String(payload.udise || "").trim();
  if (!udise) {
    return createJsonResponse({ status: "error", message: "UDISE code is required." });
  }

  var schoolName = String(payload.schoolName || "").trim();
  var headmaster = String(payload.headmaster || "").trim().toUpperCase();
  var mobile = String(payload.mobile || "").trim();
  var feededStudents = payload.feededStudents !== undefined && payload.feededStudents !== "" ? Number(payload.feededStudents) : 0;
  var notFeededStudents = payload.notFeededStudents !== undefined && payload.notFeededStudents !== "" ? Number(payload.notFeededStudents) : 0;
  var reason = String(payload.reason || "").trim();
  if (notFeededStudents === 0) {
    reason = "100% Entry Completed";
  }

  var existing = findSchoolByUdise(sheet, udise);

  if (existing) {
    // UPDATE EXISTING ROW (1-indexed row number)
    var r = existing.rowIndex;
    // Columns:
    // Col 1: UDISE Code
    // Col 2: School Name (update if provided)
    // Col 3: Name of Headmaster
    // Col 4: Mobile Number
    // Col 5: Number of students feeded on Udise Plus portal by S02 Form
    // Col 6: Number of Students which are even not feeded on Udise Plus portal
    // Col 7: Reason for Pendency
    
    if (schoolName) {
      sheet.getRange(r, 2).setValue(schoolName);
    }
    sheet.getRange(r, 3).setValue(headmaster);
    sheet.getRange(r, 4).setValue(mobile);
    sheet.getRange(r, 5).setValue(feededStudents);
    sheet.getRange(r, 6).setValue(notFeededStudents);
    sheet.getRange(r, 7).setValue(reason);

    var updatedRecord = {
      udise: udise,
      schoolName: schoolName || existing.data.schoolName,
      headmaster: headmaster,
      mobile: mobile,
      feededStudents: feededStudents,
      notFeededStudents: notFeededStudents,
      reason: reason,
      updatedAt: new Date().toISOString()
    };

    return createJsonResponse({
      status: "success",
      action: "updated",
      message: "School performance metrics updated successfully for " + (updatedRecord.schoolName || udise) + "!",
      data: updatedRecord
    });
  } else {
    // APPEND NEW RECORD
    var newRow = [
      udise,
      schoolName,
      headmaster,
      mobile,
      feededStudents,
      notFeededStudents,
      reason
    ];
    sheet.appendRow(newRow);

    var newRecord = {
      udise: udise,
      schoolName: schoolName,
      headmaster: headmaster,
      mobile: mobile,
      feededStudents: feededStudents,
      notFeededStudents: notFeededStudents,
      reason: reason,
      createdAt: new Date().toISOString()
    };

    return createJsonResponse({
      status: "success",
      action: "saved",
      message: "School performance data saved successfully for " + (schoolName || udise) + "!",
      data: newRecord
    });
  }
}

/**
 * Find school row by UDISE Code
 */
function findSchoolByUdise(sheet, targetUdise) {
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return null; // Only header or empty

  var cleanTarget = String(targetUdise).trim();

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var rowUdise = String(row[0] || "").trim();
    if (rowUdise === cleanTarget) {
      return {
        rowIndex: i + 1, // 1-indexed for Sheets API
        data: formatRowData(row)
      };
    }
  }
  return null;
}

/**
 * Format a row array into a structured JSON school object
 */
function formatRowData(row) {
  var udise = String(row[0] || "").trim();
  var schoolName = String(row[1] || "").trim();
  var headmaster = String(row[2] || "").trim();
  var mobile = String(row[3] || "").trim();
  var feededStudents = row[4] !== "" && row[4] !== undefined ? Number(row[4]) : 0;
  var notFeededStudents = row[5] !== "" && row[5] !== undefined ? Number(row[5]) : 0;
  var reason = String(row[6] || "").trim();

  return {
    udise: udise,
    schoolName: schoolName,
    headmaster: headmaster,
    mobile: mobile,
    feededStudents: isNaN(feededStudents) ? 0 : feededStudents,
    notFeededStudents: isNaN(notFeededStudents) ? 0 : notFeededStudents,
    reason: reason,
    isComplete: Boolean(headmaster && mobile && (feededStudents > 0 || notFeededStudents > 0 || reason))
  };
}

/**
 * Check if the school already has performance/entry data
 */
function checkHasExistingData(schoolObj) {
  if (!schoolObj) return false;
  return Boolean(
    schoolObj.headmaster ||
    schoolObj.mobile ||
    schoolObj.feededStudents > 0 ||
    schoolObj.notFeededStudents > 0 ||
    schoolObj.reason
  );
}

/**
 * Fetch all schools and compute aggregate dashboard metrics
 */
function getAllSchoolsData(sheet) {
  var data = sheet.getDataRange().getValues();
  var schools = [];
  var totalFeeded = 0;
  var totalNotFeeded = 0;
  var completedCount = 0;
  var pendingCount = 0;

  if (data.length > 1) {
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var school = formatRowData(row);
      if (school.udise) {
        schools.push(school);
        totalFeeded += school.feededStudents;
        totalNotFeeded += school.notFeededStudents;
        if (school.isComplete) {
          completedCount++;
        } else {
          pendingCount++;
        }
      }
    }
  }

  var totalStudents = totalFeeded + totalNotFeeded;
  var completionRate = totalStudents > 0 ? Math.round((totalFeeded / totalStudents) * 100) : 0;

  return {
    schools: schools,
    metrics: {
      totalSchools: schools.length,
      completedSchools: completedCount,
      pendingSchools: pendingCount,
      totalFeededStudents: totalFeeded,
      totalNotFeededStudents: totalNotFeeded,
      totalStudentsRecorded: totalStudents,
      completionRate: completionRate
    }
  };
}

/**
 * Get active or named sheet
 */
function getTargetSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (SHEET_NAME) {
    var sheet = ss.getSheetByName(SHEET_NAME);
    if (sheet) return sheet;
  }
  return ss.getSheets()[0];
}

/**
 * Helper to build JSON responses with appropriate headers
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * One-time setup utility: Run this from the Apps Script editor to set up
 * matching headers and seed the sample data from the screenshot!
 */
function setupSheetHeaders() {
  var sheet = getTargetSheet();
  var headers = [
    "UDISE Code",
    "School Name",
    "Name of Headmaster",
    "Mobile Number",
    "Number of students feeded on Udise Plus portal by S02 Form",
    "Number of Students which are even not feeded on Udise Plus portal",
    "Reason for Pendency"
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
  sheet.setFrozenRows(1);

  // If sheet is empty except headers, add the initial list from the screenshot
  if (sheet.getLastRow() === 1) {
    var sampleRows = [
      ["9050326306", "A S M CHILDRENS VALLEY PUBLIC SCHOOL BHOOBRA", "", "", "", "", ""],
      ["9050316244", "A.C.M. PUBLIC JHS TANDA", "", "", "", "", ""],
      ["9050316257", "A.C.M. PUBLIC SCHOOL TANDA", "", "", "", "", ""],
      ["9050306102", "A.T. HSS DAHKKA NAGLIYA", "", "", "", "", ""],
      ["9050302617", "ABDULLA PUBLIC SCHOOL NARPAT NAGAR", "", "", "", "", ""],
      ["9054109641", "ADARSH BAL J,H SCHOOL", "", "", "", "", ""],
      ["9050315848", "ADARSH BAL NIKATAN MASWASHI", "", "", "", "", ""],
      ["9050301202", "ADARSH BAL VIDHYALY SHAJADNAGAR", "", "", "", "", ""],
      ["9050302606", "ADARSH EKTA PUBLIC SCHOOL", "", "", "", "", ""],
      ["9050323601", "ADARSH JANTA MONT. SCHOOL", "", "", "", "", ""]
    ];
    sheet.getRange(2, 1, sampleRows.length, headers.length).setValues(sampleRows);
  }
}
