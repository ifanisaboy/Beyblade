const { parse } = require("csv-parse/sync");
const { buildSheetCsvUrl } = require("./config");

const REFRESH_MS = 5 * 60 * 1000;

class SheetStore {
  constructor() {
    this.rowsByCode = new Map();
    this.lastLoadedAt = 0;
    this.inflight = null;
  }

  async findByCode(code) {
    await this.ensureFresh();
    return this.rowsByCode.get(normalizeCode(code)) || [];
  }

  async ensureFresh() {
    const now = Date.now();
    if (this.rowsByCode.size > 0 && now - this.lastLoadedAt < REFRESH_MS) {
      return;
    }

    if (!this.inflight) {
      this.inflight = this.reload().finally(() => {
        this.inflight = null;
      });
    }

    await this.inflight;
  }

  async reload() {
    const response = await fetch(buildSheetCsvUrl());
    if (!response.ok) {
      throw new Error(`Failed to fetch sheet data: ${response.status} ${response.statusText}`);
    }

    const csv = await response.text();
    const records = parse(csv, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const rowsByCode = new Map();
    for (const record of records) {
      const row = mapRecord(record);
      if (row.code) {
        const existingRows = rowsByCode.get(row.code) || [];
        existingRows.push(row);
        rowsByCode.set(row.code, existingRows);
      }
    }

    this.rowsByCode = rowsByCode;
    this.lastLoadedAt = Date.now();
  }
}

function mapRecord(record) {
  const normalized = {};
  for (const [key, value] of Object.entries(record)) {
    normalized[normalizeHeader(key)] = typeof value === "string" ? value.trim() : value;
  }

  return {
    code: normalizeCode(normalized.code),
    displayCode: normalized.code?.trim() || "",
    name: normalized.name?.trim() || "",
    notes: normalized.notes?.trim() || "",
    price: normalized.price?.trim() || "",
    overPrice: normalized.over_price?.trim() || "",
  };
}

function normalizeHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function normalizeCode(value) {
  return String(value || "").trim().toLowerCase();
}

module.exports = {
  SheetStore,
  normalizeCode,
};
