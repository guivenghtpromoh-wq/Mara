import {
  Dispute,
  DisputeMessage,
  RefundRecord,
  ModerationReport,
  AuditLog
} from '../types';
import { db, doc, getDoc, setDoc, updateDoc, collection, getDocs, query, where } from '../lib/firebase';
import { OperationType, handleFirestoreError } from '../lib/firebase';

export const disputeService = {
  // --- DISPUTES ---
  async getDisputes(params?: { userId?: string; sellerId?: string }): Promise<Dispute[]> {
    try {
      const colRef = collection(db, 'disputes');
      let q = query(colRef);
      if (params?.userId) {
        q = query(colRef, where('buyer_id', '==', params.userId));
      } else if (params?.sellerId) {
        q = query(colRef, where('seller_id', '==', params.sellerId));
      }

      const snap = await getDocs(q);
      const list: Dispute[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Dispute));
      return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch (err) {
      console.warn('Could not read disputes:', err);
      return [];
    }
  },

  async getDisputeById(id: string): Promise<Dispute | null> {
    try {
      const snap = await getDoc(doc(db, 'disputes', id));
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() } as Dispute;
    } catch (err) {
      console.warn('Could not read dispute by id:', err);
      return null;
    }
  },

  async createDispute(data: {
    order_id: string;
    seller_order_id: string;
    buyer_id: string;
    seller_id: string;
    reason: string;
    refund_requested_amount?: number;
    initial_message: string;
  }): Promise<Dispute> {
    try {
      const newDoc = doc(collection(db, 'disputes'));
      const now = new Date().toISOString();
      const firstMsg: DisputeMessage = {
        id: `msg-${Date.now()}`,
        sender_id: data.buyer_id,
        sender_role: 'BUYER',
        text: data.initial_message,
        created_at: now,
      };

      const dispute: Dispute = {
        id: newDoc.id,
        order_id: data.order_id,
        seller_order_id: data.seller_order_id,
        buyer_id: data.buyer_id,
        seller_id: data.seller_id,
        reason: data.reason,
        status: 'OPEN',
        dispute_type: 'BUYER_VS_SELLER',
        refund_requested_amount: data.refund_requested_amount,
        messages: [firstMsg],
        created_at: now,
        updated_at: now,
      };

      await setDoc(newDoc, dispute);

      // Audit log
      await this.recordAuditLog({
        actor_id: data.buyer_id,
        actor_email: 'buyer',
        actor_role: 'BUYER',
        action: 'DISPUTE_OPENED',
        target_type: 'DISPUTE',
        target_id: newDoc.id,
        details: { order_id: data.order_id, reason: data.reason },
      });

      return dispute;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'disputes');
    }
  },

  async addDisputeMessage(disputeId: string, message: Omit<DisputeMessage, 'id' | 'created_at'>): Promise<void> {
    try {
      const ref = doc(db, 'disputes', disputeId);
      const snap = await getDoc(ref);
      if (!snap.exists()) throw new Error('Dispute not found');
      const dispute = snap.data() as Dispute;
      const now = new Date().toISOString();

      const newMsg: DisputeMessage = {
        id: `msg-${Date.now()}`,
        ...message,
        created_at: now,
      };

      await updateDoc(ref, {
        messages: [...(dispute.messages || []), newMsg],
        updated_at: now,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `disputes/${disputeId}`);
    }
  },

  async resolveDispute(
    disputeId: string,
    resolution: {
      status: 'RESOLVED' | 'CLOSED';
      notes: string;
      actor_id: string;
      actor_email: string;
      refund_approved_amount?: number;
    }
  ): Promise<void> {
    try {
      const ref = doc(db, 'disputes', disputeId);
      const snap = await getDoc(ref);
      if (!snap.exists()) throw new Error('Dispute not found');
      const dispute = snap.data() as Dispute;
      const now = new Date().toISOString();

      await updateDoc(ref, {
        status: resolution.status,
        resolution_notes: resolution.notes,
        resolved_at: now,
        updated_at: now,
      });

      // Record Audit Log
      await this.recordAuditLog({
        actor_id: resolution.actor_id,
        actor_email: resolution.actor_email,
        actor_role: 'ADMIN',
        action: 'DISPUTE_RESOLVED',
        target_type: 'DISPUTE',
        target_id: disputeId,
        details: { status: resolution.status, notes: resolution.notes, refund_amount: resolution.refund_approved_amount },
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `disputes/${disputeId}`);
    }
  },

  // --- REFUNDS ---
  async getRefunds(): Promise<RefundRecord[]> {
    try {
      const snap = await getDocs(collection(db, 'refunds'));
      const list: RefundRecord[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as RefundRecord));
      return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch {
      return [];
    }
  },

  async requestRefund(data: {
    order_id: string;
    seller_order_id: string;
    buyer_id: string;
    seller_id: string;
    amount: number;
    currency: string;
    reason: string;
  }): Promise<RefundRecord> {
    try {
      const newDoc = doc(collection(db, 'refunds'));
      const now = new Date().toISOString();
      const record: RefundRecord = {
        id: newDoc.id,
        ...data,
        status: 'REQUESTED',
        created_at: now,
        updated_at: now,
      };
      await setDoc(newDoc, record);
      return record;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'refunds');
    }
  },

  // --- MODERATION & REPORTS ---
  async getModerationReports(status?: string): Promise<ModerationReport[]> {
    try {
      const colRef = collection(db, 'moderation_reports');
      const snap = await getDocs(colRef);
      const list: ModerationReport[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as ModerationReport));
      return status ? list.filter((r) => r.status === status) : list;
    } catch {
      return [];
    }
  },

  async createModerationReport(data: {
    target_type: ModerationReport['target_type'];
    target_id: string;
    reporter_id: string;
    reason: string;
    details?: string;
  }): Promise<ModerationReport> {
    try {
      const newDoc = doc(collection(db, 'moderation_reports'));
      const now = new Date().toISOString();
      const report: ModerationReport = {
        id: newDoc.id,
        ...data,
        status: 'PENDING',
        created_at: now,
      };
      await setDoc(newDoc, report);
      return report;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'moderation_reports');
    }
  },

  async updateModerationReport(
    id: string,
    updates: { status: ModerationReport['status']; action_taken: string; admin_id: string; admin_email: string }
  ): Promise<void> {
    try {
      const ref = doc(db, 'moderation_reports', id);
      const now = new Date().toISOString();
      await updateDoc(ref, {
        status: updates.status,
        action_taken: updates.action_taken,
        reviewed_by: updates.admin_id,
        reviewed_at: now,
      });

      await this.recordAuditLog({
        actor_id: updates.admin_id,
        actor_email: updates.admin_email,
        actor_role: 'ADMIN',
        action: 'MODERATION_ACTION',
        target_type: 'REPORT',
        target_id: id,
        details: updates,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `moderation_reports/${id}`);
    }
  },

  // --- AUDIT LOGS (APPEND-ONLY) ---
  async recordAuditLog(log: Omit<AuditLog, 'id' | 'created_at'>): Promise<void> {
    try {
      const newDoc = doc(collection(db, 'audit_logs'));
      const now = new Date().toISOString();
      const record: AuditLog = {
        id: newDoc.id,
        ...log,
        created_at: now,
      };
      await setDoc(newDoc, record);
    } catch (err) {
      console.warn('Audit logging warning:', err);
    }
  },

  async getAuditLogs(limitCount = 50): Promise<AuditLog[]> {
    try {
      const snap = await getDocs(collection(db, 'audit_logs'));
      const list: AuditLog[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as AuditLog));
      return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, limitCount);
    } catch {
      return [];
    }
  },
};
