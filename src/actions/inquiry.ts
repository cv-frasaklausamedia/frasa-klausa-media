'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { getClientIp, contactRateLimiter } from '@/lib/rate-limit';
import {
  actionSuccess,
  handleActionError,
  type ActionResponse,
} from '@/lib/action-response';
import {
  createInquiryRecord,
  updateInquiryStatusRecord,
  deleteInquiryRecord,
} from '@/lib/inquiries/data-access';
import {
  executeSubmitContactInquiry,
  executeUpdateInquiryStatus,
  executeDeleteInquiry,
  type InquiryServiceDeps,
} from '@/lib/inquiries/service';
import type { ContactInquiryInput, UpdateInquiryStatusInput } from '@/validations/inquiry';
import type { InquiryStatus } from '@/types/database';
import { logger } from '@/lib/logger';

function getRealInquiryServiceDeps(): InquiryServiceDeps {
  return {
    auth: {
      requireAdmin: () => requireAdmin(),
    },
    rateLimit: {
      checkLimit: async (identifier: string) => {
        const res = await contactRateLimiter.limit(identifier);
        return {
          success: res.success,
          remaining: res.remaining,
          reset: res.reset,
        };
      },
    },
    db: {
      createInquiry: (data) => createInquiryRecord(data),
      updateInquiryStatus: (id, status) => updateInquiryStatusRecord(id, status),
      deleteInquiry: (id) => deleteInquiryRecord(id),
    },
  };
}

/**
 * Server Action publik untuk mengirim pesan kontak inquiry (PRD §6.3.7, §13, §15.11).
 * Dilindungi rate limiting (IP + email), honeypot anti-spam, dan validasi Zod ketat di server.
 */
export async function submitContactInquiryAction(
  input: ContactInquiryInput
): Promise<ActionResponse<{ message: string }>> {
  try {
    const startTime = Date.now();
    const clientIp = await getClientIp();
    const deps = getRealInquiryServiceDeps();

    const result = await executeSubmitContactInquiry(deps, input, { clientIp });

    logger.info('Contact inquiry received and stored', {
      action: 'submitContactInquiryAction',
      status: 200,
      durationMs: Date.now() - startTime,
      metadata: {
        clientIp,
        emailDomain: input.email.split('@')[1],
        subjectLength: input.subject?.length || 0,
      },
    });

    // Revalidasi inbox admin agar pesan baru langsung tampak
    revalidatePath('/admin/inbox');

    return actionSuccess({ message: result.message });
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Server Action admin untuk memperbarui status penanganan pesan (unread / replied / archived).
 * Wajib admin aktif.
 */
export async function updateInquiryStatusAction(
  input: UpdateInquiryStatusInput
): Promise<ActionResponse<{ message: string }>> {
  try {
    const deps = getRealInquiryServiceDeps();
    const result = await executeUpdateInquiryStatus(deps, input);

    revalidatePath('/admin/inbox');
    return actionSuccess({ message: result.message });
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Server Action admin untuk menghapus pesan dari basis data.
 * Wajib admin aktif.
 */
export async function deleteInquiryAction(
  id: string
): Promise<ActionResponse<{ message: string }>> {
  try {
    const deps = getRealInquiryServiceDeps();
    const result = await executeDeleteInquiry(deps, id);

    revalidatePath('/admin/inbox');
    return actionSuccess({ message: result.message });
  } catch (error) {
    return handleActionError(error);
  }
}
