import APIBase from './httpBase'
import type { ApiResponse } from './authService'
import type { PaymentPlan } from '@/constants/paymentPlans'

export interface AdminUser {
  id: string
  name: string
  lastName: string
  email: string
  role: 'user' | 'admin'
  subscriptionStatus: 'none' | 'pending' | 'active' | 'canceled'
  accessUntil: string | null
  foundingMember: boolean
  isVerified: boolean
  createdAt: string
}

export interface CreateUserPayload {
  name: string
  lastName: string
  email: string
  role: 'user' | 'admin'
  accessMonths?: number
  password?: string
}

export interface UpdateAccessPayload {
  action: 'extend' | 'revoke'
  months?: number
}

export interface ManualPayment {
  id: string
  user: {
    _id: string
    name: string
    lastName: string
    email: string
  }
  plan: PaymentPlan
  amount: number
  currency: 'USD'
  status: 'pending' | 'approved'
  receiptImage: string
  notes: string
  createdBy: {
    _id: string
    name: string
    lastName: string
    email: string
  }
  createdAt: string
  updatedAt: string
}

export interface ListUsersResponse {
  users: AdminUser[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ListPaymentsResponse {
  payments: ManualPayment[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface CreatePaymentPayload {
  userId: string
  plan: PaymentPlan
  amount: number
  notes: string
  receipt: File
}

export interface AdminNuveiUser {
  _id: string
  name: string
  lastName: string
  email: string
  accessUntil?: string | null
}

export interface AdminNuveiPayment {
  id: string
  user: AdminNuveiUser | null
  plan: PaymentPlan
  amount: number
  status: 'pending' | 'approved' | 'failed' | 'canceled' | 'refunded'
  source: 'link' | 'subscription'
  transactionId: string | null
  authorizationCode: string | null
  statusDetail: number | null
  cardBrand: string | null
  cardLast4: string | null
  devReference: string
  refundedAt: string | null
  refundDetail: string | null
  refundedAmount: number | null
  receiptSentAt: string | null
  createdAt: string
}

export interface AdminRefundPreview {
  amount: number
  policyPercent: number
  acquiredAt: string
  deadline: string
  withinWindow: boolean
  policyAmount: number
}

export interface AdminNuveiSubscription {
  id: string
  user: AdminNuveiUser | null
  plan: PaymentPlan
  amount: number
  status: 'active' | 'past_due' | 'canceled'
  cardBrand: string | null
  cardLast4: string | null
  nextChargeAt: string
  lastChargeAt: string | null
  failedAttempts: number
  lastError: string | null
  canceledAt: string | null
  createdAt: string
}

class AdminService extends APIBase {
  listUsers(filters: {
    role?: string
    subscriptionStatus?: string
    search?: string
    page?: number
    limit?: number
  }) {
    return this.get<ApiResponse<ListUsersResponse>>('admin/users', undefined, {
      params: filters,
    })
  }

  createUser(payload: CreateUserPayload) {
    return this.post<ApiResponse<{ user: AdminUser }>>('admin/users', payload)
  }

  deleteUser(id: string) {
    return this.delete<ApiResponse<{ deleted: boolean }>>(`admin/users/${id}`)
  }

  updateAccess(id: string, payload: UpdateAccessPayload) {
    return this.put<ApiResponse<{ user: AdminUser }>>(
      `admin/users/${id}/access`,
      payload,
    )
  }

  setFoundingMember(id: string, foundingMember: boolean) {
    return this.put<ApiResponse<{ user: AdminUser }>>(
      `admin/users/${id}/founding-member`,
      { foundingMember },
    )
  }

  listPayments(filters?: {
    userId?: string
    status?: string
    search?: string
    page?: number
    limit?: number
  }) {
    return this.get<ApiResponse<ListPaymentsResponse>>('admin/payments', undefined, {
      params: filters,
    })
  }

  createPayment(payload: FormData) {
    return this.post<ApiResponse<{ payment: ManualPayment }>>(
      'admin/payments',
      payload,
    )
  }

  deletePayment(id: string) {
    return this.delete<ApiResponse<{ deleted: boolean }>>(`admin/payments/${id}`)
  }

  // ── Nuvei (pagos con tarjeta y suscripciones) ──────────────────────────────
  listNuveiPayments(filters: { search?: string; status?: string } = {}) {
    return this.get<ApiResponse<{ payments: AdminNuveiPayment[] }>>('admin/nuvei/payments', undefined, {
      params: filters,
    })
  }

  refundPreview(id: string) {
    return this.get<ApiResponse<AdminRefundPreview>>(`admin/nuvei/payments/${id}/refund-preview`)
  }

  /** Reembolso total con Nuvei. */
  refundNuveiPayment(id: string) {
    return this.post<ApiResponse<{ id: string; status: string; refundStatus: string; refundedAmount: number; detail: string }>>(
      `admin/nuvei/payments/${id}/refund`,
      {},
      undefined,
      { timeout: 60_000 },
    )
  }

  listNuveiSubscriptions(filters: { status?: string } = {}) {
    return this.get<ApiResponse<{ subscriptions: AdminNuveiSubscription[] }>>('admin/nuvei/subscriptions', undefined, {
      params: filters,
    })
  }

  cancelNuveiSubscription(id: string) {
    return this.post<ApiResponse<AdminNuveiSubscription>>(`admin/nuvei/subscriptions/${id}/cancel`, {})
  }

  chargeNuveiSubscription(id: string) {
    return this.post<ApiResponse<{ status: string; message?: string; transactionId?: string }>>(
      `admin/nuvei/subscriptions/${id}/charge`,
      {},
      undefined,
      { timeout: 60_000 },
    )
  }
}

export const adminService = new AdminService()
export default AdminService
