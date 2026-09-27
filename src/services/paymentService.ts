import APIBase from './httpBase'
import type { ApiResponse } from './authService'
import type { PaymentPlan } from '@/constants/paymentPlans'
import { TERMS_VERSION } from '@/constants/legal'

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

export type NuveiSubscriptionStatus = 'active' | 'past_due' | 'canceled'

export interface NuveiSubscription {
  id: string
  plan: PaymentPlan
  amount: number
  status: NuveiSubscriptionStatus
  cardBrand: string | null
  cardLast4: string | null
  nextChargeAt: string
  lastChargeAt: string | null
  failedAttempts: number
  lastError: string | null
  canceledAt: string | null
  createdAt: string
}

export interface NuveiSavedCard {
  token: string
  brand: string | null
  last4: string | null
  bin: string | null
  expiryMonth: string | null
  expiryYear: string | null
  holderName: string | null
  status: 'valid' | 'review' | 'pending' | 'rejected' | string | null
  isDefault: boolean
}

export interface NuveiCheckoutConfig {
  enabled: boolean
  plan: PaymentPlan
  amount: number
  environment: 'stg' | 'prod'
  appCode: string | null
  appKey: string | null
  user: { id: string; email: string }
  subscription: NuveiSubscription | null
}

export interface NuveiChargeResult {
  status: 'approved' | 'pending' | 'failed' | 'duplicate' | 'locked' | 'otp_required'
  paymentId?: string
  transactionId?: string
  message?: string
}

export interface NuveiGuestCheckout {
  checkoutToken: string
  environment: 'stg' | 'prod'
  appCode: string | null
  appKey: string | null
  user: { id: string; email: string }
  amount: number
}

export interface NuveiGuestCheckoutResult {
  /** otp_required: el banco pidió un código para confirmar el cobro (ver paymentId). */
  status: 'approved' | 'pending' | 'scheduled' | 'failed' | 'otp_required'
  paymentId?: string
  email?: string
  /** Solo si ya tenía acceso pagado: hoy no se cobró y el primer cobro es esta fecha. */
  firstChargeAt?: string | null
  message?: string
}

/** Los cobros con tarjeta pueden tardar más que el timeout por defecto. */
const CHARGE_TIMEOUT = 60_000

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
  async nuveiHealth(): Promise<{ enabled: boolean; subscriptionsEnabled: boolean }> {
    try {
      const res = await this.get<ApiResponse<{ enabled: boolean; subscriptionsEnabled?: boolean }>>('payments/nuvei/health')
      return {
        enabled: res.data.data.enabled === true,
        subscriptionsEnabled: res.data.data.subscriptionsEnabled === true,
      }
    } catch {
      return { enabled: false, subscriptionsEnabled: false }
    }
  }

  async nuveiEnabled(): Promise<boolean> {
    return (await this.nuveiHealth()).enabled
  }

  async nuveiStatus(devReference: string) {
    return this.get<ApiResponse<NuveiStatusResponse>>(`payments/nuvei/status/${devReference}`)
  }

  // ── Nuvei (suscripciones con tarjeta guardada) ─────────────────────────────
  async subscriptionConfig() {
    return this.get<ApiResponse<NuveiCheckoutConfig>>('payments/nuvei/subscription/config')
  }

  async mySubscription() {
    return this.get<ApiResponse<{ subscription: NuveiSubscription | null }>>('payments/nuvei/subscription')
  }

  async verifyCard(transactionId: string, otp: string) {
    return this.post<ApiResponse<{ verified: boolean }>>('payments/nuvei/card/verify', { transactionId, otp })
  }

  /** Suscripción mensual. Sin cardToken se cobra a la tarjeta principal. */
  async subscribe(cardToken?: string) {
    return this.post<ApiResponse<{
      charge: NuveiChargeResult | null
      /** Si ya tenía acceso pagado, no se cobra hoy: el primer cobro es esta fecha. */
      firstChargeAt: string | null
      subscription: NuveiSubscription | null
    }>>(
      'payments/nuvei/subscription',
      // Solo se llama con la casilla de Términos marcada.
      { cardToken, acceptTerms: true, termsVersion: TERMS_VERSION },
      undefined,
      { timeout: CHARGE_TIMEOUT },
    )
  }

  // ── Checkout sin iniciar sesión ────────────────────────────────────────────
  async checkoutStart(payload: { name: string; lastName: string; email: string }) {
    return this.post<ApiResponse<NuveiGuestCheckout>>('payments/nuvei/checkout/start', payload)
  }

  async checkoutVerifyCard(checkoutToken: string, transactionId: string, otp: string) {
    return this.post<ApiResponse<{ verified: boolean }>>('payments/nuvei/checkout/card/verify', {
      checkoutToken,
      transactionId,
      otp,
    })
  }

  async checkoutComplete(checkoutToken: string, cardToken: string) {
    return this.post<ApiResponse<NuveiGuestCheckoutResult>>(
      'payments/nuvei/checkout/complete',
      // Solo se llama con la casilla de Términos marcada.
      { checkoutToken, cardToken, acceptTerms: true, termsVersion: TERMS_VERSION },
      undefined,
      { timeout: CHARGE_TIMEOUT },
    )
  }

  async checkoutVerifyChargeOtp(checkoutToken: string, paymentId: string, otp: string) {
    return this.post<ApiResponse<NuveiGuestCheckoutResult>>(
      'payments/nuvei/checkout/charge/verify',
      { checkoutToken, paymentId, otp },
      undefined,
      { timeout: CHARGE_TIMEOUT },
    )
  }

  /** Confirma con el código del banco un cobro de suscripción (alumna con sesión). */
  async verifyChargeOtp(paymentId: string, otp: string) {
    return this.post<ApiResponse<{ charge: NuveiChargeResult; subscription: NuveiSubscription | null }>>(
      'payments/nuvei/subscription/verify-otp',
      { paymentId, otp },
      undefined,
      { timeout: CHARGE_TIMEOUT },
    )
  }

  async resendAccessEmail(email: string) {
    return this.post<ApiResponse<{ sent: boolean; cooldownSeconds: number }>>(
      'payments/nuvei/checkout/resend-access',
      { email },
    )
  }

  async listCards() {
    return this.get<ApiResponse<{ cards: NuveiSavedCard[] }>>('payments/nuvei/cards')
  }

  async saveCard(cardToken: string, makeDefault = false) {
    return this.post<ApiResponse<{ cards: NuveiSavedCard[]; charge: NuveiChargeResult | null }>>(
      'payments/nuvei/cards',
      { cardToken, makeDefault },
      undefined,
      { timeout: CHARGE_TIMEOUT },
    )
  }

  async setDefaultCard(cardToken: string) {
    return this.post<ApiResponse<{
      cards: NuveiSavedCard[]
      charge: NuveiChargeResult | null
      subscription: NuveiSubscription | null
    }>>(`payments/nuvei/cards/${encodeURIComponent(cardToken)}/default`, {}, undefined, { timeout: CHARGE_TIMEOUT })
  }

  async removeCard(cardToken: string) {
    return this.delete<ApiResponse<{ cards: NuveiSavedCard[] }>>(`payments/nuvei/cards/${encodeURIComponent(cardToken)}`)
  }
}

export const paymentService = new PaymentService()
export default PaymentService
