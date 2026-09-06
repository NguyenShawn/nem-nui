import { supabaseAdmin, isSupabaseConfigured } from "../supabase";

export interface AuditLogEntry {
  id?: string;
  entity_type: string;
  entity_id: string;
  action: string;
  changed_by?: string;
  old_values?: any;
  new_values?: any;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at?: string;
}

// In-memory ledger phục vụ môi trường CI và kiểm thử offline
const inMemoryAuditLogs: AuditLogEntry[] = [];
const inMemoryProcessedTxs = new Set<string>();

/**
 * Ghi nhật ký kiểm toán tài chính và hoạt động bất biến (Immutable Financial Audit Ledger)
 */
export async function logFinancialAudit(params: {
  entityType?: string;
  entityId: string;
  action: string;
  changedBy?: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<boolean> {
  const entityType = params.entityType || "order";
  const changedBy = params.changedBy || "system_webhook";

  const entry: AuditLogEntry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    entity_type: entityType,
    entity_id: params.entityId,
    action: params.action,
    changed_by: changedBy,
    old_values: params.oldValues || null,
    new_values: params.newValues || null,
    ip_address: params.ipAddress || null,
    user_agent: params.userAgent || null,
    created_at: new Date().toISOString(),
  };

  // Lưu vào bộ đệm in-memory
  inMemoryAuditLogs.unshift(entry);
  if (params.newValues?.transaction_id) {
    inMemoryProcessedTxs.add(String(params.newValues.transaction_id));
  }
  if (params.newValues?.transactionId) {
    inMemoryProcessedTxs.add(String(params.newValues.transactionId));
  }

  // Ghi vào Supabase PostgreSQL
  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const { error } = await supabaseAdmin.from("audit_logs").insert({
        entity_type: entry.entity_type,
        entity_id: entry.entity_id,
        action: entry.action,
        changed_by: entry.changed_by,
        old_values: entry.old_values,
        new_values: entry.new_values,
        ip_address: entry.ip_address,
        user_agent: entry.user_agent,
      });

      if (error) {
        console.warn("[Audit] Cảnh báo lỗi ghi audit_logs vào Supabase:", error.message);
        return false;
      }
      return true;
    } catch (ex: any) {
      console.warn("[Audit] Ngoại lệ khi ghi audit_logs Supabase:", ex?.message);
      return false;
    }
  }

  return true;
}

/**
 * Kiểm tra xem mã giao dịch (transactionId) đã được xử lý hay chưa để đảm bảo Idempotency
 */
export async function isTransactionAlreadyLogged(transactionId: string): Promise<boolean> {
  if (!transactionId || typeof transactionId !== "string" || transactionId.trim() === "") {
    return false;
  }

  const cleanTx = transactionId.trim();

  // 1. Kiểm tra L1 In-memory cache
  if (inMemoryProcessedTxs.has(cleanTx)) {
    return true;
  }

  // Kiểm tra trong inMemoryAuditLogs
  const foundInMem = inMemoryAuditLogs.some(
    (log) =>
      log.action === "WEBHOOK_PAID" &&
      (log.new_values?.transaction_id === cleanTx ||
        log.new_values?.transactionId === cleanTx ||
        log.entity_id === cleanTx)
  );
  if (foundInMem) {
    inMemoryProcessedTxs.add(cleanTx);
    return true;
  }

  // 2. Kiểm tra trên Supabase PostgreSQL (Single Source of Truth)
  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      // 2.1 Kiểm tra bảng orders có transaction_id này chưa
      const { data: orderData, error: orderErr } = await supabaseAdmin
        .from("orders")
        .select("id, code, transaction_id")
        .eq("transaction_id", cleanTx)
        .limit(1);

      if (!orderErr && orderData && orderData.length > 0) {
        inMemoryProcessedTxs.add(cleanTx);
        return true;
      }

      // 2.2 Kiểm tra bảng audit_logs với action WEBHOOK_PAID
      const { data: auditData, error: auditErr } = await supabaseAdmin
        .from("audit_logs")
        .select("id, action, new_values")
        .eq("action", "WEBHOOK_PAID")
        .filter("new_values->>transaction_id", "eq", cleanTx)
        .limit(1);

      if (!auditErr && auditData && auditData.length > 0) {
        inMemoryProcessedTxs.add(cleanTx);
        return true;
      }
    } catch (ex: any) {
      console.warn("[Audit] Ngoại lệ khi kiểm tra transaction idempotency:", ex?.message);
    }
  }

  return false;
}

/**
 * Đánh dấu một transaction ID đã được đối soát vào in-memory cache
 */
export function markTransactionProcessed(transactionId: string): void {
  if (transactionId && typeof transactionId === "string") {
    inMemoryProcessedTxs.add(transactionId.trim());
  }
}
