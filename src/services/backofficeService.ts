import APIBase from './httpBase'
import type { ApiResponse } from '@/types'

export type BillingPeriod = 'mensual' | 'anual' | 'gratis' | 'por uso' | ''
export type TechServiceStatus = 'activo' | 'pendiente' | 'cancelado'

export interface TechService {
  _id: string
  name: string
  category: string
  provider: string
  purpose: string
  url: string
  accountEmail: string
  costAmount: number | null
  currency: string
  billingPeriod: BillingPeriod
  paidBy: string
  renewsAt: string | null
  status: TechServiceStatus
  notes: string
  order: number
}

export type RequestStatus = 'nueva' | 'en_progreso' | 'hecha' | 'descartada'
export type RequestPriority = 'normal' | 'urgente'

export interface AdminRequest {
  _id: string
  title: string
  description: string
  priority: RequestPriority
  status: RequestStatus
  createdByName: string
  notes: { authorName: string; body: string; createdAt: string }[]
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

const ROOT = 'admin/backoffice'

class BackofficeService extends APIBase {
  listServices() {
    return this.get<ApiResponse<TechService[]>>(`${ROOT}/services`)
  }

  seedServices() {
    return this.post<ApiResponse<{ created: number; services: TechService[] }>>(
      `${ROOT}/services/seed`,
      {},
    )
  }

  createService(payload: Partial<TechService>) {
    return this.post<ApiResponse<TechService>>(`${ROOT}/services`, payload)
  }

  updateService(id: string, payload: Partial<TechService>) {
    return this.put<ApiResponse<TechService>>(`${ROOT}/services/${id}`, payload)
  }

  deleteService(id: string) {
    return this.delete<ApiResponse<{ deleted: boolean }>>(`${ROOT}/services/${id}`)
  }

  listRequests() {
    return this.get<ApiResponse<AdminRequest[]>>(`${ROOT}/requests`)
  }

  createRequest(payload: { title: string; description: string; priority: RequestPriority }) {
    return this.post<ApiResponse<AdminRequest>>(`${ROOT}/requests`, payload)
  }

  updateRequest(id: string, payload: Partial<Pick<AdminRequest, 'title' | 'description' | 'priority' | 'status'>>) {
    return this.put<ApiResponse<AdminRequest>>(`${ROOT}/requests/${id}`, payload)
  }

  addNote(id: string, body: string) {
    return this.post<ApiResponse<AdminRequest>>(`${ROOT}/requests/${id}/notes`, { body })
  }

  deleteRequest(id: string) {
    return this.delete<ApiResponse<{ deleted: boolean }>>(`${ROOT}/requests/${id}`)
  }
}

export const backofficeService = new BackofficeService()
