/**
 * ============================================================================
 * GOOGLE APPS SCRIPT WEB APP CONFIGURATION FILE
 * ============================================================================
 * 
 * INSTRUCTIONS:
 * Enter your deployed Google Apps Script Web App URL below in the GOOGLE_APPS_SCRIPT_URL constant.
 * 
 * 1. Open your Google Sheet containing the UDISE data.
 * 2. Click Extensions > Apps Script and paste the code from code.js.
 * 3. Click Deploy > New deployment > Type: Web app.
 * 4. Execute as: "Me", Who has access: "Anyone".
 * 5. Copy the Web app URL (starts with https://script.google.com/macros/s/...)
 * 6. Paste it into the GOOGLE_APPS_SCRIPT_URL constant below:
 */

export const GOOGLE_APPS_SCRIPT_URL: string =
  (import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL as string) ||
  "https://script.google.com/macros/s/AKfycbyPxpDG7fyBE_bTZpMEhdvM73OGExY7FW8Huj5TAl8YGdUIXjd509D4FyxVSShLByS3Rw/exec";

/**
 * Helper to check if a valid Google Apps Script URL has been provided.
 */
export const isAppsScriptUrlConfigured = (): boolean => {
  return (
    typeof GOOGLE_APPS_SCRIPT_URL === "string" &&
    GOOGLE_APPS_SCRIPT_URL.trim().length > 0 &&
    GOOGLE_APPS_SCRIPT_URL.includes("script.google.com/macros/s/") &&
    !GOOGLE_APPS_SCRIPT_URL.includes("PASTE_YOUR_")
  );
};
