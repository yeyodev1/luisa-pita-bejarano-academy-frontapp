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
}

export const adminService = new AdminService()
export default AdminService
