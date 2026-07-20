import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import { adminContentService } from "@/services/adminContentService";
import type { ContentStatus, Course, Lesson, MediaAsset } from "@/types";
import type { CourseDraft, Editor, LessonDraft } from "./types";

function messageFrom(error: unknown, fallback: string) {
  return (error as { message?: string }).message || fallback;
}

export function statusLabel(status?: ContentStatus) {
  return status === "published"
    ? "Publicado"
    : status === "archived"
      ? "Archivado"
      : "Borrador";
}

export function formatDuration(seconds = 0) {
  if (!seconds) return "Sin duración";
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return remaining ? `${minutes} min ${remaining} s` : `${minutes} min`;
}

export function useAdminCourses() {
  const courses = ref<Course[]>([]);
  const selected = ref<Course | null>(null);
  const lessons = ref<Lesson[]>([]);
  const loading = ref(false);
  const lessonsLoading = ref(false);
  const saving = ref(false);
  const error = ref("");
  const editor = ref<Editor>(null);
  const editingCourse = ref("");
  const editingLesson = ref("");
  const courseDraft = ref<CourseDraft>();
  const lessonDraft = ref<LessonDraft>();
  const originalCourseCover = ref<MediaAsset>();
  const originalLessonAssets = ref<MediaAsset[]>([]);

  const publishedCourses = computed(
    () => courses.value.filter((course) => course.status === "published").length,
  );
  const publishedLessons = computed(
    () => lessons.value.filter((lesson) => lesson.status === "published").length,
  );
  const setupSteps = computed(() => [
    {
      label: "Crear el curso",
      description: "Define el nombre y objetivo",
      icon: "fa-book-open",
      done: courses.value.length > 0,
    },
    {
      label: "Añadir portada",
      description: "Dale una identidad visual",
      icon: "fa-image",
      done: Boolean(selected.value?.cover),
    },
    {
      label: "Subir clases",
      description: "Agrega videos y materiales",
      icon: "fa-circle-play",
      done: lessons.value.length > 0,
    },
    {
      label: "Publicar",
      description: "Hazlo visible en la academia",
      icon: "fa-rocket",
      done: selected.value?.status === "published" && publishedLessons.value > 0,
    },
  ]);
  const setupProgress = computed(
    () => setupSteps.value.filter((step) => step.done).length,
  );

  async function choose(course: Course) {
    selected.value = course;
    lessonsLoading.value = true;
    try {
      lessons.value = (
        await adminContentService.listLessons<Lesson>(course._id)
      ).data.data.sort((a, b) => a.order - b.order);
    } catch (loadError) {
      error.value = messageFrom(
        loadError,
        "No se pudieron cargar las clases.",
      );
    } finally {
      lessonsLoading.value = false;
    }
  }

  async function loadCourses(preferredId?: string) {
    loading.value = true;
    error.value = "";
    try {
      courses.value = await adminContentService.list<Course>("courses");
      const nextSelected = courses.value.find(
        (course) => course._id === (preferredId || selected.value?._id),
      );
      if (nextSelected) await choose(nextSelected);
      else if (!courses.value.length) {
        selected.value = null;
        lessons.value = [];
      }
    } catch (loadError) {
      error.value = messageFrom(loadError, "No se pudo cargar la biblioteca.");
    } finally {
      loading.value = false;
    }
  }

  function openCourseEditor(course?: Course) {
    editingCourse.value = course?._id || "";
    originalCourseCover.value = course?.cover;
    courseDraft.value = course
      ? {
          title: course.title,
          slug: course.slug,
          summary: course.summary,
          description: course.description,
          status: course.status || "draft",
          order: course.order,
          cover: course.cover,
        }
      : {
          title: "",
          slug: "",
          summary: "",
          description: "",
          status: "draft",
          order: courses.value.length,
          cover: undefined,
        };
    editor.value = "course";
  }

  function openLessonEditor(lesson?: Lesson) {
    if (!selected.value) return;
    editingLesson.value = lesson?._id || "";
    originalLessonAssets.value = lesson
      ? ([lesson.video, lesson.thumbnail, ...(lesson.materials || [])].filter(
          Boolean,
        ) as MediaAsset[])
      : [];
    lessonDraft.value = lesson
      ? {
          title: lesson.title,
          slug: lesson.slug,
          summary: lesson.summary,
          content: lesson.content || "",
          status: lesson.status || "draft",
          order: lesson.order,
          durationSeconds: lesson.durationSeconds,
          video: lesson.video,
          thumbnail: lesson.thumbnail,
          materials: [...(lesson.materials || [])],
        }
      : {
          title: "",
          slug: "",
          summary: "",
          content: "",
          status: "draft",
          order: lessons.value.length,
          durationSeconds: 0,
          video: undefined,
          thumbnail: undefined,
          materials: [],
        };
    editor.value = "lesson";
  }

  function closeEditor() {
    if (!saving.value) editor.value = null;
  }

  async function saveCourse(draft: CourseDraft) {
    saving.value = true;
    error.value = "";
    try {
      const payload: Record<string, unknown> = { ...draft };
      if (!payload.slug) delete payload.slug;
      const response = editingCourse.value
        ? await adminContentService.update<Course>(
            "courses",
            editingCourse.value,
            payload,
          )
        : await adminContentService.create<Course>("courses", payload);
      if (
        originalCourseCover.value &&
        originalCourseCover.value.publicId !== draft.cover?.publicId
      ) {
        await adminContentService
          .deleteMedia(
            originalCourseCover.value.publicId,
            originalCourseCover.value.resourceType,
          )
          .catch(() => undefined);
      }
      editor.value = null;
      await loadCourses(response.data.data._id);
    } catch (saveError) {
      error.value = messageFrom(saveError, "No se pudo guardar el curso.");
    } finally {
      saving.value = false;
    }
  }

  async function saveLesson(draft: LessonDraft) {
    if (!selected.value) return;
    saving.value = true;
    error.value = "";
    try {
      const payload: Record<string, unknown> = {
        ...draft,
        materials: [...draft.materials],
      };
      if (!payload.slug) delete payload.slug;
      if (editingLesson.value)
        await adminContentService.updateLesson(editingLesson.value, payload);
      else await adminContentService.createLesson(selected.value._id, payload);
      const retained = new Set(
        [draft.video, draft.thumbnail, ...draft.materials]
          .filter(Boolean)
          .map((item) => item!.publicId),
      );
      await Promise.allSettled(
        originalLessonAssets.value
          .filter((item) => !retained.has(item.publicId))
          .map((item) =>
            adminContentService.deleteMedia(item.publicId, item.resourceType),
          ),
      );
      editor.value = null;
      await choose(selected.value);
    } catch (saveError) {
      error.value = messageFrom(saveError, "No se pudo guardar la clase.");
    } finally {
      saving.value = false;
    }
  }

  async function deleteCourse(course: Course) {
    if (
      !confirm(
        `¿Eliminar “${course.title}” y todas sus clases, progreso y comentarios?`,
      )
    )
      return;
    await adminContentService.remove("courses", course._id);
    if (selected.value?._id === course._id) selected.value = null;
    await loadCourses();
  }

  async function deleteLesson(lesson: Lesson) {
    if (!confirm(`¿Eliminar la clase “${lesson.title}” y su progreso?`)) return;
    await adminContentService.removeLesson(lesson._id);
    if (selected.value) await choose(selected.value);
  }

  async function moveLesson(index: number, direction: number) {
    if (!selected.value) return;
    const target = index + direction;
    if (target < 0 || target >= lessons.value.length) return;
    [lessons.value[index], lessons.value[target]] = [
      lessons.value[target]!,
      lessons.value[index]!,
    ];
    await adminContentService.reorderLessons(
      selected.value._id,
      lessons.value.map((item) => item._id),
    );
  }

  async function moveCourse(index: number, direction: number) {
    const target = index + direction;
    if (target < 0 || target >= courses.value.length) return;
    [courses.value[index], courses.value[target]] = [
      courses.value[target]!,
      courses.value[index]!,
    ];
    await adminContentService.reorderCourses(
      courses.value.map((item) => item._id),
    );
  }

  async function removeAsset(asset: MediaAsset | null | undefined) {
    if (!asset) return;
    const persisted =
      asset.publicId === originalCourseCover.value?.publicId ||
      originalLessonAssets.value.some(
        (item) => item.publicId === asset.publicId,
      );
    if (!persisted)
      await adminContentService.deleteMedia(asset.publicId, asset.resourceType);
  }

  function handleEscape(event: KeyboardEvent) {
    if (event.key === "Escape" && editor.value) closeEditor();
  }

  watch(editor, (value) => {
    document.body.style.overflow = value ? "hidden" : "";
  });
  onMounted(() => {
    window.addEventListener("keydown", handleEscape);
    loadCourses();
  });
  onBeforeUnmount(() => {
    window.removeEventListener("keydown", handleEscape);
    document.body.style.overflow = "";
  });

  return {
    courses,
    selected,
    lessons,
    loading,
    lessonsLoading,
    saving,
    error,
    editor,
    editingCourse,
    editingLesson,
    courseDraft,
    lessonDraft,
    publishedCourses,
    publishedLessons,
    setupSteps,
    setupProgress,
    loadCourses,
    choose,
    openCourseEditor,
    openLessonEditor,
    closeEditor,
    saveCourse,
    saveLesson,
    deleteCourse,
    deleteLesson,
    moveCourse,
    moveLesson,
    removeAsset,
  };
}
