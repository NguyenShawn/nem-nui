import fs from "fs";
import path from "path";

export interface LeadRecord {
  id: string;
  fullName: string;
  phone: string;
  tier: string;
  addressNote?: string;
  submittedAt: string;
  status: "new" | "contacted" | "closed";
}

const LOCAL_LEADS_PATH = path.join(process.cwd(), "data", "leads_db.json");

function ensureDirectoryExistence(filePath: string) {
  const dirname = path.dirname(filePath);
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true });
  }
}

export function readLocalLeads(): LeadRecord[] {
  try {
    ensureDirectoryExistence(LOCAL_LEADS_PATH);
    if (!fs.existsSync(LOCAL_LEADS_PATH)) {
      fs.writeFileSync(LOCAL_LEADS_PATH, JSON.stringify([]));
      return [];
    }
    const data = fs.readFileSync(LOCAL_LEADS_PATH, "utf-8");
    return JSON.parse(data || "[]");
  } catch (error) {
    console.error("Lỗi đọc leads_db.json:", error);
    return [];
  }
}

export function saveNewLead(lead: Omit<LeadRecord, "id" | "status">): LeadRecord {
  const leads = readLocalLeads();
  const newRecord: LeadRecord = {
    id: "LEAD_" + Date.now(),
    ...lead,
    status: "new",
  };
  leads.unshift(newRecord);
  try {
    ensureDirectoryExistence(LOCAL_LEADS_PATH);
    fs.writeFileSync(LOCAL_LEADS_PATH, JSON.stringify(leads, null, 2), "utf-8");
  } catch (error) {
    console.error("Lỗi ghi leads_db.json:", error);
  }
  return newRecord;
}