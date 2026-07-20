import APIBase from './httpBase'
import type { ApiResponse, MediaAsset, Pagination, ResourceType } from '@/types'

export type ContentKind = 'courses' | 'calendar' | 'recipes' | 'achievements' | 'comments'
export type AssetCategory = 'courses' | 'lessons' | 'materials' | 'calendar' | 'recipes' | 'achievements'

interface ListResponse<T> {
  pagination: Pagination
  courses?: T[]
  events?: T[]
  recipes?: T[]
  achievements?: T[]
  comments?: T[]
}

export interface UploadSignature {
  cloudName: string
  apiKey: string
  resourceType: ResourceType
  uploadUrl: string
  params: {
    folder: string
    source: 'uw'
    timestamp: number
    type: 'authenticated'
    signature: string
    api_key: string
  }
}

export interface BunnyUploadCredentials {
  videoId: string
  libraryId: string
  expirationTime: number
  signature: string
  uploadUrl: string
}

const collectionKeys: Record<ContentKind, keyof ListResponse<unknown>> = {
  courses: 'courses',
  calendar: 'events',
  recipes: 'recipes',
  achievements: 'achievements',
  comments: 'comments',
}

class AdminContentService extends APIBase {
  async list<T>(kind: ContentKind, params?: Record<string, string | number>) {
    const response = await this.get<ApiResponse<ListResponse<T>>>(`admin/${kind}`, undefined, {
      params: { limit: 100, ...params },
    })
    return (response.data.data[collectionKeys[kind]] || []) as T[]
  }

  create<T>(kind: Exclude<ContentKind, 'comments'>, payload: Record<string, unknown>) {
    return this.post<ApiResponse<T>>(`admin/${kind}`, payload)
  }

  update<T>(kind: Exclude<ContentKind, 'comments'>, id: string, payload: Record<string, unknown>) {
    return this.put<ApiResponse<T>>(`admin/${kind}/${id}`, payload)
  }

  remove(kind: ContentKind, id: string) {
    return this.delete<ApiResponse<{ deleted: boolean }>>(`admin/${kind}/${id}`)
  }

  listLessons<T>(courseId: string) {
    return this.get<ApiResponse<T[]>>(`admin/courses/${courseId}/lessons`)
  }

  createLesson<T>(courseId: string, payload: Record<string, unknown>) {
    return this.post<ApiResponse<T>>(`admin/courses/${courseId}/lessons`, payload)
  }

  updateLesson<T>(id: string, payload: Record<string, unknown>) {
    return this.put<ApiResponse<T>>(`admin/lessons/${id}`, payload)
  }

  removeLesson(id: string) {
    return this.delete<ApiResponse<{ deleted: boolean }>>(`admin/lessons/${id}`)
  }

  reorderCourses(courseIds: string[]) {
    return this.put<ApiResponse<unknown[]>>('admin/courses/reorder', { courseIds })
  }

  reorderLessons(courseId: string, lessonIds: string[]) {
    return this.put<ApiResponse<unknown[]>>(`admin/courses/${courseId}/lessons/reorder`, { lessonIds })
  }

  getCalendarConfig() {
    return this.get<ApiResponse<{ defaultMeetingUrl: string; defaultTimezone: string }>>('admin/calendar/config')
  }

  moderateComment(id: string, status: 'pending' | 'published' | 'rejected') {
    return this.put<ApiResponse<unknown>>(`admin/comments/${id}/moderate`, { status })
  }

  awardAchievement(id: string, userId: string, notes = '') {
    return this.post<ApiResponse<unknown>>(`admin/achievements/${id}/award`, { userId, notes })
  }

  revokeAchievement(id: string, userId: string) {
    return this.delete<ApiResponse<{ deleted: boolean }>>(`admin/achievements/${id}/award/${userId}`)
  }

  mediaSignature(resourceType: ResourceType, category: AssetCategory) {
    return this.post<ApiResponse<UploadSignature>>('admin/assets/signature', { resourceType, category })
  }

  confirmMedia(publicId: string, resourceType: ResourceType) {
    return this.post<ApiResponse<{ asset: MediaAsset }>>('admin/assets/confirm', { publicId, resourceType })
  }

  createVideoUpload(title: string) {
    return this.post<ApiResponse<BunnyUploadCredentials>>('admin/videos', { title })
  }

  confirmVideoUpload(videoId: string, file: { bytes: number; duration: number; originalFilename: string }) {
    return this.post<ApiResponse<{ asset: MediaAsset }>>(`admin/videos/${videoId}/confirm`, file)
  }

  getVideoStatus(videoId: string) {
    return this.get<ApiResponse<{ status: number; encodeProgress: number }>>(`admin/videos/${videoId}`)
  }

  deleteMedia(publicId: string, resourceType: ResourceType, provider?: MediaAsset['provider']) {
    return this.delete<ApiResponse<{ publicId: string; result: string }>>('admin/assets', undefined, {
      data: { publicId, resourceType, provider },
    })
  }
}

export const adminContentService = new AdminContentService()
