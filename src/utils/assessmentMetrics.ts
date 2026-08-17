import type { AssessmentCheckpoint, PhysicalAssessment } from '@/types/assessment'

export type MetricGroup = 'composicion' | 'medidas' | 'evaluacion'

export interface MetricDef {
  key: string
  label: string
  unit: string
  group: MetricGroup
  /** Dirección que cuenta como mejora para colorear deltas */
  betterWhen: 'down' | 'up'
}

export interface MetricSection {
  title: string
  metrics: MetricDef[]
}

export const METRIC_SECTIONS: MetricSection[] = [
  {
    title: 'Composición corporal',
    metrics: [
      { key: 'pesoKg', label: 'Peso', unit: 'kg', group: 'composicion', betterWhen: 'down' },
      { key: 'grasaPct', label: '% de grasa', unit: '%', group: 'composicion', betterWhen: 'down' },
      { key: 'musculoPct', label: '% de músculo', unit: '%', group: 'composicion', betterWhen: 'up' },
    ],
  },
  {
    title: 'Medidas corporales',
    metrics: [
      { key: 'busto', label: 'Busto', unit: 'cm', group: 'medidas', betterWhen: 'down' },
      { key: 'cintura', label: 'Cintura', unit: 'cm', group: 'medidas', betterWhen: 'down' },
      { key: 'abdomen', label: 'Abdomen', unit: 'cm', group: 'medidas', betterWhen: 'down' },
      { key: 'cadera', label: 'Cadera', unit: 'cm', group: 'medidas', betterWhen: 'down' },
      { key: 'brazoDer', label: 'Brazo derecho', unit: 'cm', group: 'medidas', betterWhen: 'down' },
      { key: 'brazoIzq', label: 'Brazo izquierdo', unit: 'cm', group: 'medidas', betterWhen: 'down' },
      { key: 'musloDer', label: 'Muslo derecho', unit: 'cm', group: 'medidas', betterWhen: 'down' },
      { key: 'musloIzq', label: 'Muslo izquierdo', unit: 'cm', group: 'medidas', betterWhen: 'down' },
      { key: 'pantorrillaDer', label: 'Pantorrilla derecha', unit: 'cm', group: 'medidas', betterWhen: 'down' },
      { key: 'pantorrillaIzq', label: 'Pantorrilla izquierda', unit: 'cm', group: 'medidas', betterWhen: 'down' },
    ],
  },
  {
    title: 'Evaluación física',
    metrics: [
      { key: 'sentadillas', label: 'Sentadillas en 1 min', unit: 'reps', group: 'evaluacion', betterWhen: 'up' },
      { key: 'flexiones', label: 'Flexiones de pecho en 1 min', unit: 'reps', group: 'evaluacion', betterWhen: 'up' },
      { key: 'planchaSeg', label: 'Plancha (tiempo máximo)', unit: 'seg', group: 'evaluacion', betterWhen: 'up' },
      { key: 'mountainClimbers', label: 'Mountain climbers en 1 min', unit: 'reps', group: 'evaluacion', betterWhen: 'up' },
      { key: 'burpees', label: 'Burpees en 1 min', unit: 'reps', group: 'evaluacion', betterWhen: 'up' },
      { key: 'saltosCuerda', label: 'Saltos de cuerda en 1 min', unit: 'reps', group: 'evaluacion', betterWhen: 'up' },
    ],
  },
]

export function checkpointLabel(monthIndex: number): string {
  return monthIndex === 0 ? 'Inicial' : `Mes ${monthIndex}`
}

export function sortedCheckpoints(assessment: PhysicalAssessment | null): AssessmentCheckpoint[] {
  if (!assessment) return []
  return [...assessment.checkpoints].sort((a, b) => a.monthIndex - b.monthIndex)
}

export function metricValue(checkpoint: AssessmentCheckpoint, def: MetricDef): number | null {
  const group = checkpoint[def.group] as unknown as Record<string, number | null> | undefined
  const value = group?.[def.key]
  return typeof value === 'number' ? value : null
}

export function computeIMC(pesoKg: number | null, estaturaCm: number | null): number | null {
  if (!pesoKg || !estaturaCm) return null
  const meters = estaturaCm / 100
  return Math.round((pesoKg / (meters * meters)) * 10) / 10
}

export function imcCategory(imc: number | null): string {
  if (imc === null) return ''
  if (imc < 18.5) return 'Bajo peso'
  if (imc < 25) return 'Normal'
  if (imc < 30) return 'Sobrepeso'
  return 'Obesidad'
}

/** Delta entre dos valores; null si falta alguno. */
export function delta(current: number | null, previous: number | null): number | null {
  if (current === null || previous === null) return null
  return Math.round((current - previous) * 10) / 10
}

export function formatValue(value: number | null): string {
  return value === null ? '—' : String(value)
}

export function formatDelta(value: number | null): string {
  if (value === null) return ''
  if (value === 0) return '='
  return value > 0 ? `+${value}` : String(value)
}

/** true = mejora, false = retroceso, null = sin cambio o sin datos */
export function deltaIsImprovement(value: number | null, betterWhen: 'down' | 'up'): boolean | null {
  if (value === null || value === 0) return null
  return betterWhen === 'down' ? value < 0 : value > 0
}

/** Fecha del último registro (por monthIndex más alto), null si no hay o no tiene fecha. */
export function lastCheckpointDate(assessment: PhysicalAssessment | null): string | null {
  const checkpoints = sortedCheckpoints(assessment)
  return checkpoints[checkpoints.length - 1]?.date ?? null
}

/** ¿Existe un registro con fecha dentro del mes calendario de `reference`? */
export function hasCheckpointInMonth(
  assessment: PhysicalAssessment | null,
  reference = new Date(),
): boolean {
  if (!assessment) return false
  return assessment.checkpoints.some((cp) => {
    if (!cp.date) return false
    const date = new Date(cp.date)
    return (
      date.getFullYear() === reference.getFullYear() && date.getMonth() === reference.getMonth()
    )
  })
}
