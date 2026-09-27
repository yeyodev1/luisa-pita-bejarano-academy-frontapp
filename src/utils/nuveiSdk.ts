/**
 * SDK de Nuvei LATAM (ex-Paymentez) para tokenizar tarjetas en el navegador.
 * El número de tarjeta nunca pasa por nuestro servidor: Nuvei devuelve un
 * token y el backend cobra con ese token.
 * https://developers.paymentez.com/docs/payments/#javascript
 */
const SDK_URL = 'https://cdn.paymentez.com/ccapi/sdk/payment_sdk_stable.min.js'

export interface NuveiTokenizeCard {
  token?: string
  status?: 'valid' | 'review' | 'pending' | 'rejected' | string
  bin?: string
  number?: string
  type?: string
  transaction_reference?: string | null
  message?: string
}

export interface NuveiTokenizeResponse {
  card?: NuveiTokenizeCard
  error?: { type?: string; help?: string; description?: string }
}

export interface NuveiTokenizeData {
  locale: 'es' | 'en' | 'pt'
  user: { id: string; email: string }
  configuration?: {
    default_country?: string
    require_billing_address?: boolean
    require_cellphone?: boolean
    icon_colour?: string
    use_dropdowns?: boolean
  }
}

export interface NuveiPaymentGateway {
  generate_tokenize(
    data: NuveiTokenizeData,
    containerSelector: string,
    responseCallback: (response: NuveiTokenizeResponse) => void,
    notCompletedFormCallback: (message: string) => void,
  ): void
  tokenize(): void
}

type PaymentGatewayCtor = new (environment: string, appCode: string, appKey: string) => NuveiPaymentGateway

declare global {
  interface Window {
    PaymentGateway?: PaymentGatewayCtor
  }
}

let loading: Promise<PaymentGatewayCtor> | null = null

export function loadNuveiSdk(): Promise<PaymentGatewayCtor> {
  if (window.PaymentGateway) return Promise.resolve(window.PaymentGateway)
  if (loading) return loading

  loading = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SDK_URL
    script.charset = 'UTF-8'
    script.async = true
    script.onload = () => {
      if (window.PaymentGateway) resolve(window.PaymentGateway)
      else reject(new Error('El formulario de pago de Nuvei no cargó correctamente.'))
    }
    script.onerror = () => {
      loading = null
      reject(new Error('No se pudo cargar el formulario de pago. Revisa tu conexión.'))
    }
    document.head.appendChild(script)
  })
  return loading
}

/**
 * Si la tarjeta ya estaba guardada, Nuvei responde con un error que trae el
 * token existente ("Card already added: 2508629432271853872"). Lo reutilizamos.
 */
export function tokenFromAlreadyAddedError(response: NuveiTokenizeResponse): string | null {
  const match = response.error?.type?.match(/already added:\s*(\d+)/i)
  return match?.[1] ?? null
}
