import APIBase from './httpBase'
import type { ApiResponse } from './authService'

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

  async prepareBox(payload: { email: string; name: string; lastName: string; plan: 'annual' | 'monthly' }) {
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
      type: 'manual' | 'payphone'
      plan: 'monthly' | 'annual'
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
}

export const paymentService = new PaymentService()
export default PaymentService
