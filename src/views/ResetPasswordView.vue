<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { authService } from '@/services/authService'
import AuthLayout from '@/components/auth/AuthLayout.vue'
import AuthInput from '@/components/auth/AuthInput.vue'
import AuthSubmit from '@/components/auth/AuthSubmit.vue'
import AuthError from '@/components/auth/AuthError.vue'

const route = useRoute()
const router = useRouter()

const token = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref('')
const success = ref(false)

/** Enlace de bienvenida del checkout sin login: la alumna crea su primera contraseña. */
const isWelcome = computed(() => route.query.bienvenida === '1')

onMounted(() => {
  const t = route.query.token
  token.value = typeof t === 'string' ? t : ''
})

const onSubmit = async () => {
  error.value = ''

  if (newPassword.value.length < 6) {
    error.value = 'La contraseña debe tener al menos 6 caracteres.'
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    error.value = 'Las contraseñas no coinciden.'
    return
  }

  loading.value = true
  try {
    await authService.resetPassword(token.value, newPassword.value)
    success.value = true
    setTimeout(() => {
      router.push({ name: 'login' })
    }, 2500)
  } catch (err: unknown) {
    const e = err as { message?: string }
    error.value = e.message || 'Error al restablecer la contraseña. El enlace puede haber expirado.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthLayout
    :title="isWelcome ? 'Crea tu contraseña' : 'Nueva contraseña'"
    :subtitle="
      isWelcome
        ? 'Tu suscripción está activa. Elige la contraseña con la que entrarás a la academia.'
        : 'Crea una contraseña segura para tu cuenta.'
    "
  >
    <div v-if="success" class="auth-success">
      <p>Contraseña actualizada. Serás redirigida al inicio de sesión...</p>
    </div>
    <form v-else class="auth-form" @submit.prevent="onSubmit">
      <AuthError :message="error" />
      <AuthInput
        id="new-password"
        label="Nueva contraseña"
        type="password"
        v-model="newPassword"
        placeholder="••••••••"
        autocomplete="new-password"
      />
      <AuthInput
        id="confirm-password"
        label="Confirmar contraseña"
        type="password"
        v-model="confirmPassword"
        placeholder="••••••••"
        autocomplete="new-password"
      />
      <AuthSubmit :loading="loading">Guardar contraseña</AuthSubmit>
    </form>
  </AuthLayout>
</template>

<style lang="scss" scoped>
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.auth-success {
  font-family: $font-sans;
  font-size: 0.95rem;
  line-height: 1.5;
  color: $lpb-graphite;
  background: $alert-success-bg;
  border: 1px solid rgba($alert-success, 0.15);
  border-radius: 0.75rem;
  padding: 1rem;
  margin-bottom: 1rem;

  p {
    margin: 0;
  }
}
</style>
