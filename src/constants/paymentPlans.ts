export const PAYMENT_PLANS = [
  {
    id: 'monthly',
    name: '1 mes',
    label: 'Plan mensual',
    months: 1,
    price: 47,
    description: 'Un mes de acceso completo para empezar a tu ritmo.',
  },
  {
    id: 'quarterly',
    name: '3 meses',
    label: 'Plan trimestral',
    months: 3,
    price: 97,
    description: 'Tres meses para construir hábitos con continuidad.',
  },
  {
    id: 'semiannual',
    name: '6 meses',
    label: 'Plan semestral',
    months: 6,
    price: 247,
    description: 'Seis meses de acompañamiento y progreso sostenido.',
  },
  {
    id: 'annual',
    name: '12 meses',
    label: 'Plan anual',
    months: 12,
    price: 400,
    description: 'Un año completo para consolidar tu transformación.',
  },
] as const

export type PaymentPlan = (typeof PAYMENT_PLANS)[number]['id']

export function getPaymentPlan(plan: PaymentPlan) {
  return PAYMENT_PLANS.find((item) => item.id === plan)!
}

export function paymentPlanLabel(plan: PaymentPlan) {
  return getPaymentPlan(plan).label
}
