import APIBase from './httpBase'
import type { ApiResponse } from './authService'
import type { PaymentPlan } from '@/constants/paymentPlans'

export interface PreparePaymentResponse {
  paymentId: string
  payWithCard: string
  clientTransactionId: string
}

export interface PaymentBoxConfig {
  token: string
  storeId: string
  amount: number
  amountWithoutTax: number
  currency: string
  clientTransactionId: string
  reference: string
  responseUrl: string
}

export interface ConfirmPaymentResponse {
  status: string
  transactionId?: number
  isNewUser?: boolean
  plainPassword?: string
  emailSent?: boolean
  email?: string
}

export interface NuveiLinkResponse {
  paymentUrl: string
  paymentQr?: string
  devReference: string
  amount: number
  isNewUser: boolean
}

export interface NuveiStatusResponse {
  status: 'pending' | 'approved' | 'failed' | 'canceled'
  plan: PaymentPlan
  amount: number
  transactionId?: string
  isNewUser?: boolean
  plainPassword?: string
  email?: string
}

class PaymentService extends APIBase {
  async prepareAnnual(payload: { email: string; name: string; lastName: string }) {
    return this.post<ApiResponse<PreparePaymentResponse>>('payments/prepare', {
      ...payload,
      origin: window.location.origin,
    })
  }

  async prepareMonthly(payload: { email: string; name: string; lastName: string }) {
    return this.post<ApiResponse<PreparePaymentResponse>>('payments/prepare-monthly', {
      ...payload,
      origin: window.location.origin,
    })
  }

  async preparePlan(payload: { email: string; name: string; lastName: string; plan: PaymentPlan }) {
    return this.post<ApiResponse<PreparePaymentResponse>>('payments/prepare-plan', {
      ...payload,
      origin: window.location.origin,
    })
  }

  async prepareBox(payload: { email: string; name: string; lastName: string; plan: PaymentPlan }) {
    return this.post<ApiResponse<PaymentBoxConfig>>('payments/prepare-box', {
      ...payload,
      origin: window.location.origin,
    })
  }

  async confirmPayment(id: string, clientTransactionId: string) {
    return this.get<ApiResponse<ConfirmPaymentResponse>>('payments/confirm', undefined, {
      params: { id, clientTransactionId },
    })
  }

  async resendWelcome(clientTransactionId: string) {
    return this.post<ApiResponse<{ email: string }>>('payments/resend-welcome-public', { clientTransactionId })
  }

  async history() {
    return this.get<ApiResponse<{ history: Array<{
      id: string
      type: 'manual' | 'payphone' | 'nuvei'
      plan: PaymentPlan
      amount: number
      currency: 'USD'
      status: string
      receiptImage?: string
      notes?: string
      payphoneTransactionId?: number | null
      clientTransactionId?: string
      createdAt: string
    }> }>>('payments/history')
  }

  async cancelPending() {
    return this.post<ApiResponse<{ canceled: number }>>('payments/cancel-pending', {})
  }

  async cancelSubscription() {
    return this.post<ApiResponse<{ email: string; subscriptionStatus: string }>>('payments/cancel-subscription', {})
  }

  // ── Nuvei (Link to Pay) ────────────────────────────────────────────────────
  /** Mientras el comercio no esté activado por Nuvei esto devuelve enabled:false. */
  async nuveiEnabled(): Promise<boolean> {
    try {
      const res = await this.get<ApiResponse<{ enabled: boolean }>>('payments/nuvei/health')
      return res.data.data.enabled === true
    } catch {
      return false
    }
  }

  async createNuveiLink(payload: {
    email: string
    name: string
    lastName: string
    plan: PaymentPlan
  }) {
    return this.post<ApiResponse<NuveiLinkResponse>>('payments/nuvei/create-link', {
      ...payload,
      origin: window.location.origin,
    })
  }

  async nuveiStatus(devReference: string) {
    return this.get<ApiResponse<NuveiStatusResponse>>(`payments/nuvei/status/${devReference}`)
  }
}

export const paymentService = new PaymentService()
export default PaymentService
