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

const OFFLINE_MESSAGE =
  "No hay conexión con el servidor. Revisa tu internet e intenta de nuevo.";

function messageFrom(error: unknown, fallback: string) {
  const message = (error as { message?: string })?.message;
  if (message === "Unknown error") return OFFLINE_MESSAGE;
  return message || fallback;
}

export function statusLabel(status?: ContentStatus) {
  return status === "published"
    ? "Publicado"
    : status === "archived"
      ? "Archivado"
      : "Borrador (oculto)";
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
  /** Error al guardar: se muestra dentro del editor, que queda abierto. */
  const editorError = ref("");
  const success = ref("");
  /** Hay un archivo subiéndose en el editor de clase. */
  const uploading = ref(false);
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

  function flash(message: string) {
    success.value = message;
    window.setTimeout(() => {
      if (success.value === message) success.value = "";
    }, 4000);
  }

  function openCourseEditor(course?: Course) {
    editorError.value = "";
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
    editorError.value = "";
    uploading.value = false;
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
    if (!saving.value) {
      editor.value = null;
      uploading.value = false;
    }
  }

  async function saveCourse(draft: CourseDraft) {
    saving.value = true;
    editorError.value = "";
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
            originalCourseCover.value.provider,
          )
          .catch(() => undefined);
      }
      editor.value = null;
      flash(
        draft.status === "published"
          ? "Curso guardado y publicado."
          : "Curso guardado. Sigue oculto para las alumnas hasta que lo publiques.",
      );
      await loadCourses(response.data.data._id);
    } catch (saveError) {
      editorError.value = messageFrom(saveError, "No se pudo guardar el curso.");
    } finally {
      saving.value = false;
    }
  }

  async function saveLesson(draft: LessonDraft) {
    if (!selected.value) return;
    saving.value = true;
    editorError.value = "";
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
            adminContentService.deleteMedia(item.publicId, item.resourceType, item.provider),
          ),
      );
      editor.value = null;
      flash(
        draft.status === "published"
          ? "Clase guardada y publicada."
          : "Clase guardada. Sigue oculta para las alumnas hasta que la publiques.",
      );
      await choose(selected.value);
    } catch (saveError) {
      editorError.value = messageFrom(saveError, "No se pudo guardar la clase.");
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
    error.value = "";
    try {
      await adminContentService.remove("courses", course._id);
      if (selected.value?._id === course._id) selected.value = null;
      flash("Curso eliminado.");
      await loadCourses();
    } catch (removeError) {
      error.value = messageFrom(removeError, "No se pudo eliminar el curso.");
    }
  }

  async function deleteLesson(lesson: Lesson) {
    if (!confirm(`¿Eliminar la clase “${lesson.title}” y su progreso?`)) return;
    error.value = "";
    try {
      await adminContentService.removeLesson(lesson._id);
      flash("Clase eliminada.");
      if (selected.value) await choose(selected.value);
    } catch (removeError) {
      error.value = messageFrom(removeError, "No se pudo eliminar la clase.");
    }
  }

  async function moveLesson(index: number, direction: number) {
    if (!selected.value) return;
    const target = index + direction;
    if (target < 0 || target >= lessons.value.length) return;
    [lessons.value[index], lessons.value[target]] = [
      lessons.value[target]!,
      lessons.value[index]!,
    ];
    try {
      await adminContentService.reorderLessons(
        selected.value._id,
        lessons.value.map((item) => item._id),
      );
    } catch (moveError) {
      error.value = messageFrom(moveError, "No se pudo cambiar el orden de las clases.");
      await choose(selected.value);
    }
  }

  async function moveCourse(index: number, direction: number) {
    const target = index + direction;
    if (target < 0 || target >= courses.value.length) return;
    [courses.value[index], courses.value[target]] = [
      courses.value[target]!,
      courses.value[index]!,
    ];
    try {
      await adminContentService.reorderCourses(
        courses.value.map((item) => item._id),
      );
    } catch (moveError) {
      error.value = messageFrom(moveError, "No se pudo cambiar el orden de los cursos.");
      await loadCourses();
    }
  }

  /** Publicar u ocultar con un clic (sin abrir el editor). */
  async function toggleCoursePublish(course: Course) {
    const publish = course.status !== "published";
    if (!publish && !confirm(`¿Ocultar “${course.title}”? Las alumnas dejarán de verlo.`)) return;
    error.value = "";
    try {
      await adminContentService.update<Course>("courses", course._id, {
        status: publish ? "published" : "draft",
      });
      const hidden = publish ? lessons.value.filter((l) => l.status !== "published").length : 0;
      flash(
        publish
          ? hidden && selected.value?._id === course._id
            ? `Curso publicado. Ojo: ${hidden} ${hidden === 1 ? "clase sigue oculta" : "clases siguen ocultas"}; publícalas para que las alumnas las vean.`
            : "Curso publicado: ya lo ven las alumnas."
          : "Curso oculto para las alumnas.",
      );
      await loadCourses(course._id);
    } catch (toggleError) {
      error.value = messageFrom(toggleError, "No se pudo cambiar el estado del curso.");
    }
  }

  async function toggleLessonPublish(lesson: Lesson) {
    if (!selected.value) return;
    const publish = lesson.status !== "published";
    error.value = "";
    try {
      await adminContentService.updateLesson(lesson._id, {
        status: publish ? "published" : "draft",
      });
      flash(
        publish
          ? selected.value.status === "published"
            ? "Clase publicada: ya la ven las alumnas."
            : "Clase publicada. Publica también el curso para que las alumnas la vean."
          : "Clase oculta para las alumnas.",
      );
      await choose(selected.value);
    } catch (toggleError) {
      error.value = messageFrom(toggleError, "No se pudo cambiar el estado de la clase.");
    }
  }

  async function removeAsset(asset: MediaAsset | null | undefined) {
    if (!asset) return;
    const persisted =
      asset.publicId === originalCourseCover.value?.publicId ||
      originalLessonAssets.value.some(
        (item) => item.publicId === asset.publicId,
      );
    if (!persisted)
      await adminContentService.deleteMedia(asset.publicId, asset.resourceType, asset.provider);
  }

  function handleEscape(event: KeyboardEvent) {
    if (event.key !== "Escape" || !editor.value) return;
    if (
      uploading.value &&
      !confirm("Hay un archivo subiéndose. Si cierras ahora se cancelará. ¿Cerrar de todos modos?")
    )
      return;
    closeEditor();
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
    editorError,
    success,
    uploading,
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
    toggleCoursePublish,
    toggleLessonPublish,
    removeAsset,
  };
}
