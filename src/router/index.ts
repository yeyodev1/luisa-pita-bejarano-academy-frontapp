import { createRouter, createWebHistory, type RouteMeta, type RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    description?: string
    canonical?: string
    ogTitle?: string
    ogDescription?: string
    ogUrl?: string
    ogImage?: string
    requiresAuth?: boolean
    requiresAdmin?: boolean
    requiresActiveAccess?: boolean
  }
}

const SITE = 'https://luisapitabejarano.com'
const OG_IMAGE =
  'https://res.cloudinary.com/dkosgkjpq/image/upload/w_1200,h_630,c_fill,g_face,q_auto,f_auto/luisa-pita/luisa-11.jpg'

const BRAND_TITLE =
  'Luisa Pita Bejarano | Comunidad anual de transformación corporal para mujeres'
const BRAND_DESC =
  'Coach de mujeres ocupadas y dueñas de negocio. Un año entero junto a Luisa para transformar tu cuerpo y tu vida. Comunidad anual cerrada — preventa VIP por invitación.'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
    meta: {
      title: BRAND_TITLE,
      description: BRAND_DESC,
      canonical: `${SITE}/`,
      ogTitle: BRAND_TITLE,
      ogDescription: BRAND_DESC,
      ogUrl: `${SITE}/`,
      ogImage: OG_IMAGE,
    } satisfies RouteMeta,
  },
  {
    path: '/politicas-privacidad',
    name: 'privacy-policy',
    component: () => import('@/views/PrivacyPolicyView.vue'),
    meta: {
      title: 'Políticas de Privacidad | Luisa Pita Bejarano',
      description:
        'Cómo Luisa Pita Bejarano trata los datos personales recogidos en luisapitabejarano.com.',
      canonical: `${SITE}/politicas-privacidad`,
      ogTitle: 'Políticas de Privacidad | Luisa Pita Bejarano',
      ogDescription: 'Tratamiento y protección de datos personales en luisapitabejarano.com.',
      ogUrl: `${SITE}/politicas-privacidad`,
      ogImage: OG_IMAGE,
    } satisfies RouteMeta,
  },
  {
    path: '/aviso-legal',
    name: 'legal-notice',
    component: () => import('@/views/LegalNoticeView.vue'),
    meta: {
      title: 'Aviso Legal | Luisa Pita Bejarano',
      description: 'Términos de uso del sitio luisapitabejarano.com.',
      canonical: `${SITE}/aviso-legal`,
      ogTitle: 'Aviso Legal | Luisa Pita Bejarano',
      ogDescription: 'Términos de uso del sitio luisapitabejarano.com.',
      ogUrl: `${SITE}/aviso-legal`,
      ogImage: OG_IMAGE,
    } satisfies RouteMeta,
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: {
      title: 'Iniciar sesión | Luisa Pita Bejarano',
      description: 'Accede a tu cuenta para unirte a la comunidad anual de transformación corporal.',
      canonical: `${SITE}/login`,
      ogTitle: 'Iniciar sesión | Luisa Pita Bejarano',
      ogDescription: 'Accede a tu cuenta para unirte a la comunidad anual de transformación corporal.',
      ogUrl: `${SITE}/login`,
      ogImage: OG_IMAGE,
    } satisfies RouteMeta,
  },
  {
    path: '/registro',
    name: 'register',
    component: () => import('@/views/RegisterView.vue'),
    meta: {
      title: 'Crear cuenta | Luisa Pita Bejarano',
      description: 'Crea tu cuenta y asegura tu cupo en la comunidad anual cerrada.',
      canonical: `${SITE}/registro`,
      ogTitle: 'Crear cuenta | Luisa Pita Bejarano',
      ogDescription: 'Crea tu cuenta y asegura tu cupo en la comunidad anual cerrada.',
      ogUrl: `${SITE}/registro`,
      ogImage: OG_IMAGE,
    } satisfies RouteMeta,
  },
  {
    path: '/verificar-email',
    name: 'verify-email',
    component: () => import('@/views/VerifyEmailView.vue'),
    meta: {
      title: 'Verificar email | Luisa Pita Bejarano',
      description: 'Confirma tu correo para activar tu cuenta.',
      canonical: `${SITE}/verificar-email`,
      ogTitle: 'Verificar email | Luisa Pita Bejarano',
      ogDescription: 'Confirma tu correo para activar tu cuenta.',
      ogUrl: `${SITE}/verificar-email`,
      ogImage: OG_IMAGE,
    } satisfies RouteMeta,
  },
  {
    path: '/recuperar-contrasena',
    name: 'forgot-password',
    component: () => import('@/views/ForgotPasswordView.vue'),
    meta: {
      title: 'Recuperar contraseña | Luisa Pita Bejarano',
      description: 'Recupera el acceso a tu cuenta.',
      canonical: `${SITE}/recuperar-contrasena`,
      ogTitle: 'Recuperar contraseña | Luisa Pita Bejarano',
      ogDescription: 'Recupera el acceso a tu cuenta.',
      ogUrl: `${SITE}/recuperar-contrasena`,
      ogImage: OG_IMAGE,
    } satisfies RouteMeta,
  },
  {
    path: '/restablecer-contrasena',
    name: 'reset-password',
    component: () => import('@/views/ResetPasswordView.vue'),
    meta: {
      title: 'Restablecer contraseña | Luisa Pita Bejarano',
      description: 'Crea una nueva contraseña para tu cuenta.',
      canonical: `${SITE}/restablecer-contrasena`,
      ogTitle: 'Restablecer contraseña | Luisa Pita Bejarano',
      ogDescription: 'Crea una nueva contraseña para tu cuenta.',
      ogUrl: `${SITE}/restablecer-contrasena`,
      ogImage: OG_IMAGE,
    } satisfies RouteMeta,
  },
  {
    path: '/pago/confirmar',
    name: 'payment-result',
    component: () => import('@/views/PaymentResultView.vue'),
    meta: {
      title: 'Confirmación de pago | Luisa Pita Bejarano',
      description: 'Resultado de tu pago en la comunidad anual Luisa Pita Bejarano.',
      canonical: `${SITE}/pago/confirmar`,
      ogTitle: 'Confirmación de pago | Luisa Pita Bejarano',
      ogDescription: 'Resultado de tu pago en la comunidad anual Luisa Pita Bejarano.',
      ogUrl: `${SITE}/pago/confirmar`,
      ogImage: OG_IMAGE,
    } satisfies RouteMeta,
  },
  {
    path: '/pay-response',
    name: 'pay-response',
    component: () => import('@/views/PaymentResultView.vue'),
    meta: {
      title: 'Confirmación de pago | Luisa Pita Bejarano',
      description: 'Resultado de tu pago en la comunidad anual Luisa Pita Bejarano.',
      canonical: `${SITE}/pay-response`,
      ogTitle: 'Confirmación de pago | Luisa Pita Bejarano',
      ogDescription: 'Resultado de tu pago en la comunidad anual Luisa Pita Bejarano.',
      ogUrl: `${SITE}/pay-response`,
      ogImage: OG_IMAGE,
    } satisfies RouteMeta,
  },
  {
    path: '/app',
    component: () => import('@/components/dashboard/DashboardLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'dashboard',
        component: () => import('@/views/dashboard/DashboardView.vue'),
        meta: {
          requiresActiveAccess: true,
          title: 'Mi cuenta | Luisa Pita Bejarano',
          description: 'Tu espacio personal de aprendizaje y transformación.',
          canonical: `${SITE}/app`,
          ogTitle: 'Mi cuenta | Luisa Pita Bejarano',
          ogDescription: 'Tu espacio personal de aprendizaje y transformación.',
          ogUrl: `${SITE}/app`,
          ogImage: OG_IMAGE,
        } satisfies RouteMeta,
      },
      {
        path: 'cursos',
        name: 'courses',
        component: () => import('@/views/dashboard/CoursesView.vue'),
        meta: {
          requiresActiveAccess: true,
          title: 'Mis cursos | Luisa Pita Bejarano',
          description: 'Todos tus cursos disponibles.',
          canonical: `${SITE}/app/cursos`,
          ogTitle: 'Mis cursos | Luisa Pita Bejarano',
          ogDescription: 'Todos tus cursos disponibles.',
          ogUrl: `${SITE}/app/cursos`,
          ogImage: OG_IMAGE,
        } satisfies RouteMeta,
      },
      {
        path: 'cursos/:slug',
        name: 'course-detail',
        component: () => import('@/views/dashboard/CourseDetailView.vue'),
        meta: {
          requiresActiveAccess: true,
          title: 'Curso | Luisa Pita Bejarano',
          description: 'Contenido del curso.',
          canonical: `${SITE}/app/cursos`,
          ogTitle: 'Curso | Luisa Pita Bejarano',
          ogDescription: 'Contenido del curso.',
          ogUrl: `${SITE}/app/cursos`,
          ogImage: OG_IMAGE,
        } satisfies RouteMeta,
      },
      {
        path: 'cursos/:slug/clases/:lessonId',
        name: 'lesson',
        component: () => import('@/views/dashboard/LessonView.vue'),
        meta: {
          requiresActiveAccess: true,
          title: 'Clase | Luisa Pita Bejarano',
          description: 'Clase en reproducción.',
          canonical: `${SITE}/app/cursos`,
          ogTitle: 'Clase | Luisa Pita Bejarano',
          ogDescription: 'Clase en reproducción.',
          ogUrl: `${SITE}/app/cursos`,
          ogImage: OG_IMAGE,
        } satisfies RouteMeta,
      },
      {
        path: 'calendario',
        name: 'calendar',
        component: () => import('@/views/dashboard/CalendarView.vue'),
        meta: {
          requiresActiveAccess: true,
          title: 'Calendario | Luisa Pita Bejarano',
          description: 'Eventos y clases de la comunidad.',
          canonical: `${SITE}/app/calendario`,
          ogTitle: 'Calendario | Luisa Pita Bejarano',
          ogDescription: 'Eventos y clases de la comunidad.',
          ogUrl: `${SITE}/app/calendario`,
          ogImage: OG_IMAGE,
        } satisfies RouteMeta,
      },
      {
        path: 'clases-en-vivo',
        redirect: { name: 'calendar' },
      },
      {
        path: 'horario',
        redirect: { name: 'calendar' },
      },
      {
        path: 'recetas',
        name: 'recipes',
        component: () => import('@/views/dashboard/RecipesView.vue'),
        meta: {
          requiresActiveAccess: true,
          title: 'Recetas | Luisa Pita Bejarano',
          description: 'Recetas saludables para tu transformación.',
          canonical: `${SITE}/app/recetas`,
          ogTitle: 'Recetas | Luisa Pita Bejarano',
          ogDescription: 'Recetas saludables para tu transformación.',
          ogUrl: `${SITE}/app/recetas`,
          ogImage: OG_IMAGE,
        } satisfies RouteMeta,
      },
      {
        path: 'logros',
        name: 'achievements',
        component: () => import('@/views/dashboard/AchievementsView.vue'),
        meta: {
          requiresActiveAccess: true,
          title: 'Logros | Luisa Pita Bejarano',
          description: 'Tus logros y reconocimientos.',
          canonical: `${SITE}/app/logros`,
          ogTitle: 'Logros | Luisa Pita Bejarano',
          ogDescription: 'Tus logros y reconocimientos.',
          ogUrl: `${SITE}/app/logros`,
          ogImage: OG_IMAGE,
        } satisfies RouteMeta,
      },
      {
        path: 'clases-grabadas',
        name: 'recorded-classes',
        component: () => import('@/views/dashboard/RecordedClassesView/index.vue'),
        meta: {
          requiresActiveAccess: true,
          title: 'Clases grabadas | Luisa Pita Bejarano',
          description: 'Biblioteca de clases en vivo grabadas de Luisa Pita Bejarano.',
          canonical: `${SITE}/app/clases-grabadas`,
          ogTitle: 'Clases grabadas | Luisa Pita Bejarano',
          ogDescription: 'Revisa las grabaciones de cada clase en vivo.',
          ogUrl: `${SITE}/app/clases-grabadas`,
          ogImage: OG_IMAGE,
        } satisfies RouteMeta,
      },
      {
        path: 'configuracion',
        name: 'settings',
        component: () => import('@/views/dashboard/SettingsView/index.vue'),
        meta: {
          title: 'Configuración | Luisa Pita Bejarano',
          description: 'Gestiona tu perfil y suscripción.',
          canonical: `${SITE}/app/configuracion`,
          ogTitle: 'Configuración | Luisa Pita Bejarano',
          ogDescription: 'Gestiona tu perfil y suscripción.',
          ogUrl: `${SITE}/app/configuracion`,
          ogImage: OG_IMAGE,
        } satisfies RouteMeta,
      },
      {
        path: 'pagos',
        name: 'payments',
        component: () => import('@/views/dashboard/PaymentsView/index.vue'),
        meta: {
          title: 'Pagos | Luisa Pita Bejarano',
          description: 'Gestiona tus pagos y suscripción.',
          canonical: `${SITE}/app/pagos`,
          ogTitle: 'Pagos | Luisa Pita Bejarano',
          ogDescription: 'Gestiona tus pagos y suscripción.',
          ogUrl: `${SITE}/app/pagos`,
          ogImage: OG_IMAGE,
        } satisfies RouteMeta,
      },
    ],
  },
  {
    path: '/admin',
    component: () => import('@/components/admin/AdminLayout.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: '',
        redirect: { name: 'admin-courses' },
      },
      {
        path: 'contenido/cursos', name: 'admin-courses', component: () => import('@/views/admin/AdminCoursesView.vue'),
        meta: { title: 'Admin - Cursos | Luisa Pita Bejarano' },
      },
      {
        path: 'contenido/calendario', name: 'admin-calendar', component: () => import('@/views/admin/AdminEntityView.vue'),
        props: { kind: 'calendar', title: 'Calendario', assetField: 'cover', assetCategory: 'calendar', fields: [{ key: 'title', label: 'Título', required: true }, { key: 'description', label: 'Descripción', type: 'textarea' }, { key: 'startsAt', label: 'Inicio', type: 'datetime-local', required: true }, { key: 'endsAt', label: 'Fin', type: 'datetime-local' }, { key: 'timezone', label: 'Zona horaria', required: true }, { key: 'meetingUrl', label: 'Enlace Meet' }, { key: 'status', label: 'Estado', type: 'select', required: true, options: [{ value: 'draft', label: 'Borrador' }, { value: 'published', label: 'Publicado' }, { value: 'archived', label: 'Archivado' }] }] },
        meta: { title: 'Admin - Calendario | Luisa Pita Bejarano' },
      },
      {
        path: 'contenido/recetas', name: 'admin-recipes', component: () => import('@/views/admin/AdminEntityView.vue'),
        props: { kind: 'recipes', title: 'Recetas', assetField: 'cover', assetCategory: 'recipes', fields: [{ key: 'title', label: 'Título', required: true }, { key: 'slug', label: 'Slug (opcional)' }, { key: 'summary', label: 'Resumen' }, { key: 'description', label: 'Descripción', type: 'textarea' }, { key: 'ingredients', label: 'Ingredientes (uno por línea)', type: 'textarea', list: true }, { key: 'instructions', label: 'Pasos (uno por línea)', type: 'textarea', list: true }, { key: 'prepMinutes', label: 'Minutos de preparación', type: 'number' }, { key: 'cookMinutes', label: 'Minutos de cocción', type: 'number' }, { key: 'servings', label: 'Porciones', type: 'number' }, { key: 'order', label: 'Orden', type: 'number' }, { key: 'status', label: 'Estado', type: 'select', required: true, options: [{ value: 'draft', label: 'Borrador' }, { value: 'published', label: 'Publicada' }, { value: 'archived', label: 'Archivada' }] }] },
        meta: { title: 'Admin - Recetas | Luisa Pita Bejarano' },
      },
      {
        path: 'contenido/logros', name: 'admin-achievements', component: () => import('@/views/admin/AdminEntityView.vue'),
        props: { kind: 'achievements', title: 'Logros', assetField: 'icon', assetCategory: 'achievements', fields: [{ key: 'title', label: 'Título', required: true }, { key: 'slug', label: 'Slug (opcional)' }, { key: 'description', label: 'Descripción', type: 'textarea', required: true }, { key: 'order', label: 'Orden', type: 'number' }, { key: 'status', label: 'Estado', type: 'select', required: true, options: [{ value: 'draft', label: 'Borrador' }, { value: 'published', label: 'Publicado' }, { value: 'archived', label: 'Archivado' }] }] },
        meta: { title: 'Admin - Logros | Luisa Pita Bejarano' },
      },
      {
        path: 'contenido/comentarios', name: 'admin-comments', component: () => import('@/views/admin/AdminEntityView.vue'),
        props: { kind: 'comments', title: 'Comentarios', fields: [], readonly: true },
        meta: { title: 'Admin - Comentarios | Luisa Pita Bejarano' },
      },
      {
        path: 'contenido/clases-grabadas',
        name: 'admin-recorded-classes',
        component: () => import('@/views/admin/AdminRecordedClassesView.vue'),
        meta: { title: 'Admin - Clases grabadas | Luisa Pita Bejarano' },
      },
      {
        path: 'usuarios',
        name: 'admin-users',
        component: () => import('@/views/admin/AdminUsersView/index.vue'),
        meta: {
          title: 'Admin - Usuarios | Luisa Pita Bejarano',
          description: 'Gestión de usuarios de la academia.',
          canonical: `${SITE}/admin/usuarios`,
          ogTitle: 'Admin - Usuarios | Luisa Pita Bejarano',
          ogDescription: 'Gestión de usuarios de la academia.',
          ogUrl: `${SITE}/admin/usuarios`,
          ogImage: OG_IMAGE,
        } satisfies RouteMeta,
      },
      {
        path: 'pagos',
        name: 'admin-payments',
        component: () => import('@/views/admin/AdminPaymentsView/index.vue'),
        meta: {
          title: 'Admin - Pagos | Luisa Pita Bejarano',
          description: 'Gestión de pagos manuales de la academia.',
          canonical: `${SITE}/admin/pagos`,
          ogTitle: 'Admin - Pagos | Luisa Pita Bejarano',
          ogDescription: 'Gestión de pagos manuales de la academia.',
          ogUrl: `${SITE}/admin/pagos`,
          ogImage: OG_IMAGE,
        } satisfies RouteMeta,
      },
    ],
  },
  {
    path: '/no-permiso',
    name: 'no-permission',
    component: () => import('@/views/admin/NoPermissionView.vue'),
    meta: {
      title: 'Sin permiso | Luisa Pita Bejarano',
      description: 'No tienes permiso para acceder a esta sección.',
      canonical: `${SITE}/no-permiso`,
      ogTitle: 'Sin permiso | Luisa Pita Bejarano',
      ogDescription: 'No tienes permiso para acceder a esta sección.',
      ogUrl: `${SITE}/no-permiso`,
      ogImage: OG_IMAGE,
    } satisfies RouteMeta,
  },
  // 404 → home
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: (to, _from, savedPosition) => {
    if (savedPosition) return savedPosition
    if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth',
        top: 80,
      }
    }
    return { top: 0, behavior: 'instant' }
  },
})

router.beforeEach((to) => {
  const userStore = useUserStore()
  if (to.meta.requiresAuth && !userStore.isAuthenticated) {
    return { name: 'login' }
  }
  if (to.meta.requiresAdmin && userStore.role !== 'admin') {
    return { name: 'no-permission' }
  }
  if (to.meta.requiresActiveAccess && userStore.role !== 'admin' && !userStore.hasActiveAccess) {
    return { name: 'payments' }
  }

  // El home solo es para no-autenticados; si está logueado redirige.
  if (to.name === 'home' && userStore.isAuthenticated) {
    if (userStore.role === 'admin') return { name: 'admin-courses' }
    if (userStore.hasActiveAccess) return { name: 'dashboard' }
    return { name: 'payments' }
  }

  // Los usuarios normales sin acceso activo no deben ver el dashboard /app;
  // se envían a la página de pago dentro de la plataforma.
  if (
    to.name === 'dashboard' &&
    userStore.isAuthenticated &&
    userStore.role !== 'admin' &&
    !userStore.hasActiveAccess
  ) {
    return { name: 'payments' }
  }

  const publicAuthRoutes = ['login', 'register', 'forgot-password', 'reset-password']
  if (publicAuthRoutes.includes(String(to.name)) && userStore.isAuthenticated) {
    if (userStore.role === 'admin') return { name: 'admin-courses' }
    if (userStore.hasActiveAccess) return { name: 'dashboard' }
    return { name: 'payments' }
  }
})

// ── SEO dinámico por ruta ──────────────────────────────────────────────────────
const setMeta = (name: string, content: string) => {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.name = name
    document.head.appendChild(el)
  }
  el.content = content
}

const setOgMeta = (property: string, content: string) => {
  let el = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('property', property)
    document.head.appendChild(el)
  }
  el.content = content
}

const setCanonical = (href: string) => {
  let el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.rel = 'canonical'
    document.head.appendChild(el)
  }
  el.href = href
}

router.afterEach((to) => {
  const meta = to.meta
  document.title = meta.title ?? BRAND_TITLE
  setMeta('description', meta.description ?? BRAND_DESC)
  setOgMeta('og:title', meta.ogTitle ?? meta.title ?? BRAND_TITLE)
  setOgMeta('og:description', meta.ogDescription ?? meta.description ?? BRAND_DESC)
  setOgMeta('og:url', meta.ogUrl ?? SITE)
  setOgMeta('og:image', meta.ogImage ?? OG_IMAGE)
  setOgMeta('twitter:title', meta.ogTitle ?? meta.title ?? BRAND_TITLE)
  setOgMeta('twitter:description', meta.ogDescription ?? meta.description ?? BRAND_DESC)
  setOgMeta('twitter:image', meta.ogImage ?? OG_IMAGE)
  setCanonical(meta.canonical ?? SITE)
})

export default router
