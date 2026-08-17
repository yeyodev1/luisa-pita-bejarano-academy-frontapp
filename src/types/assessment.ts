export interface AssessmentUser {
  _id: string
  name: string
  lastName?: string
  email?: string
  profilePicture?: string | null
}

export interface AssessmentComposicion {
  pesoKg: number | null
  grasaPct: number | null
  musculoPct: number | null
}

export interface AssessmentMedidas {
  busto: number | null
  cintura: number | null
  abdomen: number | null
  cadera: number | null
  brazoDer: number | null
  brazoIzq: number | null
  musloDer: number | null
  musloIzq: number | null
  pantorrillaDer: number | null
  pantorrillaIzq: number | null
}

export interface AssessmentEvaluacion {
  sentadillas: number | null
  flexiones: number | null
  planchaSeg: number | null
  mountainClimbers: number | null
  burpees: number | null
  saltosCuerda: number | null
}

export interface AssessmentCheckpoint {
  _id: string
  monthIndex: number
  date: string | null
  composicion: AssessmentComposicion
  medidas: AssessmentMedidas
  evaluacion: AssessmentEvaluacion
}

export interface AssessmentProfile {
  fechaInicial: string | null
  edad: number | null
  estaturaCm: number | null
}

export interface PhysicalAssessment {
  _id: string
  user: string | AssessmentUser
  profile: AssessmentProfile
  checkpoints: AssessmentCheckpoint[]
  createdAt?: string
  updatedAt?: string
}

export interface ProfilePayload {
  fechaInicial?: string | null
  edad?: number | null
  estaturaCm?: number | null
}

export interface CheckpointPayload {
  monthIndex: number
  date?: string | null
  composicion: Partial<AssessmentComposicion>
  medidas: Partial<AssessmentMedidas>
  evaluacion: Partial<AssessmentEvaluacion>
}
