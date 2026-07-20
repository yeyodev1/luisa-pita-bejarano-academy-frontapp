import type {
  ContentStatus,
  LessonMaterial,
  MediaAsset,
} from "@/types";

export type Editor = "course" | "lesson" | null;

export interface CourseDraft {
  title: string;
  slug: string;
  summary: string;
  description: string;
  status: ContentStatus;
  order: number;
  cover?: MediaAsset | null;
}

export interface LessonDraft {
  title: string;
  slug: string;
  summary: string;
  content: string;
  status: ContentStatus;
  order: number;
  durationSeconds: number;
  video?: MediaAsset | null;
  thumbnail?: MediaAsset | null;
  materials: LessonMaterial[];
}

export interface SetupStep {
  label: string;
  description: string;
  icon: string;
  done: boolean;
}
