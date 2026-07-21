import APIBase from './httpBase'
import type {
  Achievement,
  ApiResponse,
  CalendarEvent,
  Lesson,
  LessonComment,
  MemberCourse,
  MediaAsset,
  MediaDelivery,
  Pagination,
  ProgressUpdateResponse,
  Recipe,
  RecordedClass,
} from '@/types'

const ROOT = 'academy'

class ContentService extends APIBase {
  getCourses() {
    return this.get<ApiResponse<MemberCourse[]>>(`${ROOT}/courses`)
  }

  getCourse(identifier: string) {
    return this.get<ApiResponse<MemberCourse>>(`${ROOT}/courses/${identifier}`)
  }

  getLesson(id: string) {
    return this.get<ApiResponse<Lesson>>(`${ROOT}/lessons/${id}`)
  }

  updateProgress(id: string, payload: { watchedSeconds: number; lastPositionSeconds: number; percent: number; completed?: boolean }) {
    return this.put<ApiResponse<ProgressUpdateResponse>>(`${ROOT}/lessons/${id}/progress`, payload)
  }

  getCalendarEvents() {
    return this.get<ApiResponse<{ events: CalendarEvent[]; pagination: Pagination }>>(`${ROOT}/calendar`, undefined, { params: { limit: 100 } })
  }

  getRecipes() {
    return this.get<ApiResponse<{ recipes: Recipe[]; pagination: Pagination }>>(`${ROOT}/recipes`, undefined, { params: { limit: 100 } })
  }

  getRecipe(identifier: string) {
    return this.get<ApiResponse<Recipe>>(`${ROOT}/recipes/${identifier}`)
  }

  getAchievements() {
    return this.get<ApiResponse<Achievement[]>>(`${ROOT}/achievements`)
  }

  getComments(lessonId: string) {
    return this.get<ApiResponse<{ comments: LessonComment[]; pagination: Pagination }>>(`${ROOT}/lessons/${lessonId}/comments`, undefined, { params: { limit: 100 } })
  }

  createComment(lessonId: string, body: string) {
    return this.post<ApiResponse<LessonComment>>(`${ROOT}/lessons/${lessonId}/comments`, { body })
  }

  updateComment(id: string, body: string) {
    return this.put<ApiResponse<LessonComment>>(`${ROOT}/comments/${id}`, { body })
  }

  deleteComment(id: string) {
    return this.delete<ApiResponse<{ deleted: boolean }>>(`${ROOT}/comments/${id}`)
  }

  getAssetDelivery(asset: Pick<MediaAsset, 'publicId' | 'resourceType' | 'provider'>) {
    return this.post<ApiResponse<MediaDelivery>>(`${ROOT}/assets/delivery-url`, asset)
  }

  getRecordedClasses(params?: { page?: number; limit?: number }) {
    return this.get<ApiResponse<{ classes: RecordedClass[]; pagination: Pagination }>>(
      `${ROOT}/recorded-classes`,
      undefined,
      { params: { limit: 50, ...params } },
    )
  }

  getRecordedClass(id: string) {
    return this.get<ApiResponse<RecordedClass>>(`${ROOT}/recorded-classes/${id}`)
  }
}

export const contentService = new ContentService()
