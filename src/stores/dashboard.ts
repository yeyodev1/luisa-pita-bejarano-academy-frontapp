import { defineStore } from 'pinia'
import { contentService } from '@/services/contentService'
import type { Achievement, CalendarEvent, Lesson, LessonComment, MediaAsset, MemberCourse, Recipe } from '@/types'

function messageOf(error: unknown): string {
  return (error as { message?: string })?.message || 'No pudimos cargar el contenido.'
}

async function withDelivery<T extends MediaAsset | undefined>(asset: T): Promise<T> {
  if (!asset) return asset
  try {
    const response = await contentService.getAssetDelivery(asset)
    return { ...asset, deliveryUrl: response.data.data.url }
  } catch {
    return asset
  }
}

async function hydrateLesson(lesson: Lesson): Promise<Lesson> {
  const [video, thumbnail, materials] = await Promise.all([
    withDelivery(lesson.video),
    withDelivery(lesson.thumbnail),
    Promise.all((lesson.materials || []).map(withDelivery)),
  ])
  return { ...lesson, video, thumbnail, materials }
}

export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    courses: [] as MemberCourse[],
    calendarEvents: [] as CalendarEvent[],
    recipes: [] as Recipe[],
    achievements: [] as Achievement[],
    commentsByLesson: {} as Record<string, LessonComment[]>,
    currentCourse: null as MemberCourse | null,
    currentLesson: null as Lesson | null,
    loading: false,
    error: '',
  }),
  getters: {
    totalProgress: (state) => {
      if (!state.courses.length) return 0
      return Math.round(state.courses.reduce((sum, course) => sum + course.progress.percent, 0) / state.courses.length)
    },
    completedAchievements: (state) => state.achievements.filter((item) => Boolean(item.earned)),
    nextEvent: (state) => [...state.calendarEvents]
      .filter((item) => new Date(item.startsAt).getTime() > Date.now())
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())[0] || null,
  },
  actions: {
    async run<T>(request: () => Promise<T>): Promise<T | null> {
      this.loading = true
      this.error = ''
      try {
        return await request()
      } catch (error) {
        this.error = messageOf(error)
        return null
      } finally {
        this.loading = false
      }
    },
    async fetchCourses() {
      const response = await this.run(() => contentService.getCourses())
      if (!response) return
      this.courses = await Promise.all(response.data.data.map(async (course) => ({
        ...course,
        cover: await withDelivery(course.cover),
      })))
    },
    async fetchCourse(identifier: string) {
      this.currentCourse = null
      const response = await this.run(() => contentService.getCourse(identifier))
      if (!response) return
      const course = response.data.data
      this.currentCourse = {
        ...course,
        cover: await withDelivery(course.cover),
        lessons: await Promise.all((course.lessons || []).map(hydrateLesson)),
      }
    },
    async fetchLesson(id: string) {
      this.currentLesson = null
      const response = await this.run(() => contentService.getLesson(id))
      if (response) this.currentLesson = await hydrateLesson(response.data.data)
    },
    async fetchCalendar() {
      const response = await this.run(() => contentService.getCalendarEvents())
      if (!response) return
      this.calendarEvents = await Promise.all(response.data.data.events.map(async (event) => ({
        ...event,
        cover: await withDelivery(event.cover),
      })))
    },
    async fetchRecipes() {
      const response = await this.run(() => contentService.getRecipes())
      if (!response) return
      this.recipes = await Promise.all(response.data.data.recipes.map(async (recipe) => ({
        ...recipe,
        cover: await withDelivery(recipe.cover),
      })))
    },
    async fetchAchievements() {
      const response = await this.run(() => contentService.getAchievements())
      if (!response) return
      this.achievements = await Promise.all(response.data.data.map(async (achievement) => ({
        ...achievement,
        icon: await withDelivery(achievement.icon),
      })))
    },
    async fetchComments(lessonId: string) {
      const response = await this.run(() => contentService.getComments(lessonId))
      if (response) this.commentsByLesson[lessonId] = response.data.data.comments
    },
    async addComment(lessonId: string, body: string) {
      const response = await this.run(() => contentService.createComment(lessonId, body))
      if (response) await this.fetchComments(lessonId)
      return Boolean(response)
    },
    async removeComment(lessonId: string, commentId: string) {
      await contentService.deleteComment(commentId)
      this.commentsByLesson[lessonId] = (this.commentsByLesson[lessonId] || []).filter((item) => item._id !== commentId)
    },
    async saveProgress(lessonId: string, watchedSeconds: number, lastPositionSeconds: number, durationSeconds: number, completed?: boolean) {
      const percent = durationSeconds ? Math.min(100, Math.round((watchedSeconds / durationSeconds) * 100)) : 0
      const response = await contentService.updateProgress(lessonId, { watchedSeconds, lastPositionSeconds, percent, completed })
      if (this.currentLesson?._id === lessonId) this.currentLesson.progress = response.data.data.progress
      const courseProgress = response.data.data.courseProgress
      const currentCourse = this.currentCourse
      if (currentCourse && currentCourse._id === courseProgress.courseId) currentCourse.progress = courseProgress
      const course = this.courses.find((item) => item._id === courseProgress.courseId)
      if (course) course.progress = courseProgress
    },
  },
})
