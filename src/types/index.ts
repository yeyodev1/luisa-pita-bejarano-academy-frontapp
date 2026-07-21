export interface ApiError {
  status: number
  message: string
  data?: unknown
}

export interface ApiResponse<T> {
  data: T
  message: string
}

export type ContentStatus = 'draft' | 'published' | 'archived'
export type ResourceType = 'image' | 'video' | 'raw'

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface MediaAsset {
  publicId: string
  resourceType: ResourceType
  provider?: 'cloudinary' | 'bunny'
  format?: string
  bytes?: number
  width?: number
  height?: number
  duration?: number
  originalFilename?: string
  createdAt?: string
  deliveryUrl?: string
}

export interface LessonMaterial extends MediaAsset {
  title: string
}

export interface LessonProgress {
  _id?: string
  course?: string
  lesson?: string
  watchedSeconds: number
  lastPositionSeconds?: number
  percent: number
  completed: boolean
  manualCompletion?: boolean | null
  completedAt?: string | null
}

export interface CourseProgress {
  courseId?: string
  totalLessons: number
  completedLessons: number
  percent: number
  lessons?: LessonProgress[]
}

export interface Lesson {
  _id: string
  course?: string
  title: string
  slug: string
  summary: string
  content?: string
  status?: ContentStatus
  order: number
  durationSeconds: number
  video?: MediaAsset
  thumbnail?: MediaAsset
  materials?: LessonMaterial[]
  publishedAt?: string | null
  progress?: LessonProgress | null
}

export interface Course {
  _id: string
  slug: string
  title: string
  summary: string
  description: string
  status?: ContentStatus
  order: number
  cover?: MediaAsset
  publishedAt?: string | null
  lessons?: Lesson[]
  progress?: CourseProgress
}

export interface MemberCourse extends Course {
  progress: CourseProgress
}

export interface CalendarEvent {
  _id: string
  title: string
  description: string
  startsAt: string
  endsAt?: string | null
  timezone: string
  meetingUrl: string
  status?: ContentStatus
  cover?: MediaAsset
}

export interface Recipe {
  _id: string
  slug: string
  title: string
  summary: string
  description: string
  ingredients: string[]
  instructions: string[]
  prepMinutes: number
  cookMinutes: number
  servings: number
  status?: ContentStatus
  order: number
  cover?: MediaAsset
  publishedAt?: string | null
}

export interface EarnedAchievement {
  _id: string
  user: string
  achievement: string
  awardedAt: string
  notes: string
}

export interface Achievement {
  _id: string
  slug: string
  title: string
  description: string
  status?: ContentStatus
  order: number
  icon?: MediaAsset
  earned?: EarnedAchievement | null
}

export interface CommentUser {
  _id: string
  name: string
  lastName?: string
  profilePicture?: string | null
}

export interface CommentLesson {
  _id: string
  title: string
  course?: string
}

export interface LessonComment {
  _id: string
  lesson: string | CommentLesson
  user: string | CommentUser
  body: string
  status: 'pending' | 'published' | 'rejected'
  moderatedBy?: string | null
  moderatedAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface MediaDelivery {
  publicId: string
  provider?: 'cloudinary' | 'bunny'
  cloudName?: string
  url: string
}

export interface ProgressUpdateResponse {
  progress: LessonProgress
  courseProgress: CourseProgress
}

export interface RecordedClass {
  _id: string
  title: string
  classDate: string
  startsAt: string
  endsAt: string
  recordingUrl: string
  notesUrl?: string
  status?: ContentStatus
  createdAt?: string
  updatedAt?: string
}
