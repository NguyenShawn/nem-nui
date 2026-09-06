import { supabaseAdmin, isSupabaseConfigured } from "./supabase";

export interface LeadRecord {
  id: string;
  fullName: string;
  phone: string;
  tier: string;
  addressNote?: string;
  submittedAt: string;
  status: "new" | "contacted" | "closed";
}

export interface NewLeadInput {
  fullName: string;
  phone: string;
  tier: string;
  addressNote?: string;
  status?: "new" | "contacted" | "closed";
}

// In-Memory cache dự phòng cho môi trường CI và offline test
const inMemoryLeads: LeadRecord[] = [];

/**
 * Lưu khách hàng tiềm năng / đại lý sỉ mới vào Supabase PostgreSQL
 * PROJECT.md Interface Contract 2: saveLead
 */
export async function saveLead(
  lead: NewLeadInput | Omit<LeadRecord, "id" | "status">
): Promise<{ success: boolean; lead?: LeadRecord; error?: string }> {
  const localId = `LEAD_${Date.now()}`;
  const timeString = new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });

  const record: LeadRecord = {
    id: localId,
    fullName: lead.fullName,
    phone: lead.phone,
    tier: lead.tier,
    addressNote: lead.addressNote || "",
    submittedAt: (lead as any).submittedAt || timeString,
    status: (lead as any).status || "new",
  };

  // Lưu vào Supabase
  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from("leads")
        .insert({
          full_name: record.fullName,
          phone: record.phone,
          tier: record.tier,
          address_note: record.addressNote || null,
          status: record.status,
        })
        .select()
        .single();

      if (!error && data) {
        record.id = data.id;
        record.submittedAt = data.created_at;
      } else if (error) {
        console.error("[LeadDb] Lỗi insert lead vào Supabase:", error);
      }
    } catch (ex: any) {
      console.error("[LeadDb] Ngoại lệ khi lưu lead lên Supabase:", ex);
    }
  }

  inMemoryLeads.unshift(record);
  return { success: true, lead: record };
}

/**
 * Tương thích ngược đồng bộ với POST /api/leads
 */
export function saveNewLead(lead: Omit<LeadRecord, "id" | "status">): LeadRecord {
  const localId = `LEAD_${Date.now()}`;
  const timeString = new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });

  const record: LeadRecord = {
    id: localId,
    fullName: lead.fullName,
    phone: lead.phone,
    tier: lead.tier,
    addressNote: lead.addressNote || "",
    submittedAt: (lead as any).submittedAt || timeString,
    status: "new",
  };

  inMemoryLeads.unshift(record);

  // Kích hoạt ghi Supabase bất đồng bộ
  if (isSupabaseConfigured && supabaseAdmin) {
    (async () => {
      try {
        const { error } = await supabaseAdmin
          .from("leads")
          .insert({
            full_name: record.fullName,
            phone: record.phone,
            tier: record.tier,
            address_note: record.addressNote || null,
            status: "new",
          });
        if (error) console.error("[LeadDb] Lỗi ghi lead ngầm:", error);
      } catch (err) {
        console.warn("[LeadDb] Ngoại lệ ghi lead:", err);
      }
    })();
  }

  return record;
}

/**
 * Lấy danh sách tất cả Leads từ Supabase PostgreSQL (PROJECT.md Interface Contract 2)
 */
export async function getLeads(): Promise<LeadRecord[]> {
  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        return data.map((row: any) => ({
          id: row.id,
          fullName: row.full_name,
          phone: row.phone,
          tier: row.tier,
          addressNote: row.address_note || undefined,
          submittedAt: row.created_at,
          status: row.status as "new" | "contacted" | "closed",
        }));
      }
      console.error("[LeadDb] Lỗi truy vấn leads từ Supabase:", error);
    } catch (ex) {
      console.error("[LeadDb] Ngoại lệ khi lấy leads:", ex);
    }
  }

  return [...inMemoryLeads];
}

/**
 * Tương thích ngược với GET /api/leads
 */
export function readLocalLeads(): LeadRecord[] {
  // Đồng bộ ngầm với Supabase nếu có cấu hình
  if (isSupabaseConfigured && supabaseAdmin) {
    (async () => {
      try {
        const fresh = await getLeads();
        if (fresh && fresh.length > 0) {
          inMemoryLeads.length = 0;
          inMemoryLeads.push(...fresh);
        }
      } catch {}
    })();
  }

  return [...inMemoryLeads];
}