const SHEET_ID = "18zmgvI4P13ddm8xQLN7Fru2c8Ea6305Olr8g5tYJlos";
const SHEET_GID = "2041609797";
const DEFAULT_PORT = 3000;

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function buildSheetCsvUrl() {
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SHEET_GID}`;
}

module.exports = {
  DEFAULT_PORT,
  SHEET_GID,
  SHEET_ID,
  buildSheetCsvUrl,
  requireEnv,
};
