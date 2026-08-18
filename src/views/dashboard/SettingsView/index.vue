<script setup lang="ts">
import { ref, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { userService } from '@/services/userService'
import ProfilePictureSection from './components/ProfilePictureSection.vue'
import SubscriptionInfo from './components/SubscriptionInfo.vue'
import ProfileForm from './components/ProfileForm.vue'
import PasswordForm from './components/PasswordForm.vue'

const userStore = useUserStore()

const profileError = ref('')
const profileMessage = ref('')
const passwordError = ref('')
const passwordMessage = ref('')
const pictureError = ref('')
const pictureMessage = ref('')
const pictureFile = ref<File | null>(null)
const picturePreview = ref<string | null>(null)
const pictureLoading = ref(false)
const pictureDeleting = ref(false)

const accessUntilLabel = computed(() => {
  if (!userStore.accessUntil) return '—'
  return new Date(userStore.accessUntil).toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' })
})

function onPictureSelect(file: File) {
  pictureError.value = ''
  pictureMessage.value = ''

  if (!file.type.startsWith('image/')) {
    pictureError.value = 'El archivo debe ser una imagen.'
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    pictureError.value = 'La imagen no debe superar los 5 MB.'
    return
  }

  pictureFile.value = file
  picturePreview.value = URL.createObjectURL(file)
}

async function uploadPicture() {
  if (!pictureFile.value) return

  pictureLoading.value = true
  pictureError.value = ''
  pictureMessage.value = ''

  try {
    const { data } = await userService.uploadProfilePicture(pictureFile.value)
    userStore.setUser({ profilePicture: data.data.user.profilePicture })
    pictureFile.value = null
    picturePreview.value = null
    pictureMessage.value = 'Foto de perfil actualizada correctamente.'
  } catch (err: unknown) {
    const e = err as { message?: string }
    pictureError.value = e.message || 'Error al subir la foto de perfil.'
  } finally {
    pictureLoading.value = false
  }
}

async function deletePicture() {
  pictureDeleting.value = true
  pictureError.value = ''
  pictureMessage.value = ''

  try {
    const { data } = await userService.deleteProfilePicture()
    userStore.setUser({ profilePicture: data.data.user.profilePicture })
    pictureMessage.value = 'Foto de perfil eliminada correctamente.'
  } catch (err: unknown) {
    const e = err as { message?: string }
    pictureError.value = e.message || 'Error al eliminar la foto de perfil.'
  } finally {
    pictureDeleting.value = false
  }
}

async function saveProfile(data: { name: string; lastName: string; email: string }) {
  profileMessage.value = ''
  profileError.value = ''

  try {
    const response = await userService.updateProfile(data)
    userStore.setUser({
      name: response.data.data.user.name,
      lastName: response.data.data.user.lastName,
      email: response.data.data.user.email,
    })
    profileMessage.value = 'Perfil actualizado correctamente.'
  } catch (err: unknown) {
    const e = err as { message?: string }
    profileError.value = e.message || 'Error al actualizar el perfil.'
  }
}

async function changePassword(data: { current: string; new: string }) {
  passwordMessage.value = ''
  passwordError.value = ''

  try {
    await userService.changePassword({
      currentPassword: data.current,
      newPassword: data.new,
    })
    passwordMessage.value = 'Contraseña actualizada correctamente.'
  } catch (err: unknown) {
    const e = err as { message?: string }
    passwordError.value = e.message || 'Error al cambiar la contraseña.'
  }
}
</script>

<template>
  <div class="settings">
    <ProfilePictureSection
      :current-picture="userStore.profilePicture"
      :user-name="userStore.name ?? ''"
      :user-last-name="userStore.lastName ?? ''"
      :preview-url="picturePreview"
      :has-file="!!pictureFile"
      :loading="pictureLoading"
      :deleting="pictureDeleting"
      :error="pictureError"
      :message="pictureMessage"
      @select="onPictureSelect"
      @upload="uploadPicture"
      @delete="deletePicture"
    />

    <SubscriptionInfo
      :subscription-status="userStore.effectiveSubscriptionStatus"
      :access-until-label="accessUntilLabel"
      :founding-member="userStore.foundingMember"
    />

    <ProfileForm
      :initial-name="userStore.name ?? ''"
      :initial-last-name="userStore.lastName ?? ''"
      :initial-email="userStore.email ?? ''"
      :error="profileError"
      :message="profileMessage"
      @save="saveProfile"
    />

    <PasswordForm
      :error="passwordError"
      :message="passwordMessage"
      @change="changePassword"
    />
  </div>
</template>

<style lang="scss" scoped>
.settings {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
</style>
