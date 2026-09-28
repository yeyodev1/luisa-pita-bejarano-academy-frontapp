/**
 * Resultado del checkout sin login, que la vista /suscripcion-activa lee para
 * mostrar a qué correo llegó el acceso y si hoy hubo cobro.
 */
export type CheckoutDone = {
  email: string
  status: 'approved' | 'pending' | 'scheduled'
  firstChargeAt: string | null
}

const KEY = 'lpb_checkout_done'

export function saveCheckoutDone(done: CheckoutDone) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(done))
  } catch {
    /* sin almacenamiento: la vista final igual funciona con el correo en la URL */
  }
}

export function readCheckoutDone(): CheckoutDone | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as CheckoutDone) : null
  } catch {
    return null
  }
}
