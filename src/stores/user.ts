import { defineStore } from 'pinia'
import { authService } from '@/services/authService'

export interface UserState {
  id: string | null
  name: string | null
  lastName: string | null
  email: string | null
  profilePicture: string | null
  role: 'user' | 'admin' | null
  isVerified: boolean
  subscriptionStatus: 'none' | 'pending' | 'active' | 'canceled'
  accessUntil: string | null
  foundingMember: boolean
  isAuthenticated: boolean
}

const STORAGE_KEYS = {
  token: 'access_token',
  id: 'user_id',
  name: 'user_name',
  lastName: 'user_lastName',
  email: 'user_email',
  profilePicture: 'user_profilePicture',
  role: 'user_role',
  isVerified: 'user_isVerified',
  subscriptionStatus: 'user_subscriptionStatus',
  accessUntil: 'user_accessUntil',
  foundingMember: 'user_foundingMember',
} as const

function getItem(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function setItem(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {}
}

function removeItem(key: string) {
  try {
    localStorage.removeItem(key)
  } catch {}
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    id: null,
    name: null,
    lastName: null,
    email: null,
    profilePicture: null,
    role: null,
    isVerified: false,
    subscriptionStatus: 'none',
    accessUntil: null,
    foundingMember: false,
    isAuthenticated: false,
  }),

  getters: {
    fullName: (state): string => {
      if (!state.name && !state.lastName) return 'Usuario'
      return [state.name, state.lastName].filter(Boolean).join(' ')
    },
    initials: (state): string => {
      const first = state.name?.[0] ?? ''
      const last = state.lastName?.[0] ?? ''
      return (first + last).toUpperCase() || 'U'
    },
    hasActiveAccess: (state): boolean => {
      if (state.subscriptionStatus !== 'active') return false
      if (!state.accessUntil) return true
      return new Date(state.accessUntil).getTime() > Date.now()
    },
    /** Tenía suscripción activa pero ya pasó la fecha de acceso. */
    accessExpired: (state): boolean => {
      if (state.subscriptionStatus !== 'active' || !state.accessUntil) return false
      return new Date(state.accessUntil).getTime() <= Date.now()
    },
    /**
     * Estado real para mostrar en pantalla. El backend deja subscriptionStatus
     * en 'active' aunque accessUntil ya pasó, así que sin esto la UI dice que
     * la suscripción sigue viva mientras el guard manda a pagar.
     */
    effectiveSubscriptionStatus(state): 'none' | 'pending' | 'active' | 'canceled' | 'expired' {
      if (state.subscriptionStatus !== 'active' || !state.accessUntil) {
        return state.subscriptionStatus
      }
      return new Date(state.accessUntil).getTime() > Date.now() ? 'active' : 'expired'
    },
  },

  actions: {
    hydrate() {
      const token = getItem(STORAGE_KEYS.token)
      if (!token) {
        this.clear()
        return
      }

      this.isAuthenticated = true
      this.id = getItem(STORAGE_KEYS.id)
      this.name = getItem(STORAGE_KEYS.name)
      this.lastName = getItem(STORAGE_KEYS.lastName)
      this.email = getItem(STORAGE_KEYS.email)
      this.profilePicture = getItem(STORAGE_KEYS.profilePicture)
      this.role = (getItem(STORAGE_KEYS.role) as UserState['role']) || 'user'
      this.isVerified = getItem(STORAGE_KEYS.isVerified) === 'true'
      this.subscriptionStatus = (getItem(STORAGE_KEYS.subscriptionStatus) as UserState['subscriptionStatus']) || 'none'
      this.accessUntil = getItem(STORAGE_KEYS.accessUntil)
      this.foundingMember = getItem(STORAGE_KEYS.foundingMember) === 'true'
    },

    async validateSession() {
      if (!this.isAuthenticated) return false
      try {
        const response = await authService.me()
        this.setUser(response.data.data.user)
        return true
      } catch {
        this.clear()
        return false
      }
    },

    setUser(payload: {
      id?: string
      name?: string
      lastName?: string
      email?: string
      profilePicture?: string | null
    role?: 'user' | 'admin'
     isVerified?: boolean
     subscriptionStatus?: 'none' | 'pending' | 'active' | 'canceled'
     accessUntil?: string | null
     foundingMember?: boolean
   }) {
      if (payload.id !== undefined) {
        this.id = payload.id
        setItem(STORAGE_KEYS.id, payload.id)
      }
      if (payload.name !== undefined) {
        this.name = payload.name
        setItem(STORAGE_KEYS.name, payload.name)
      }
      if (payload.lastName !== undefined) {
        this.lastName = payload.lastName
        setItem(STORAGE_KEYS.lastName, payload.lastName)
      }
      if (payload.email !== undefined) {
        this.email = payload.email
        setItem(STORAGE_KEYS.email, payload.email)
      }
      if (payload.profilePicture !== undefined) {
        this.profilePicture = payload.profilePicture
        if (payload.profilePicture) {
          setItem(STORAGE_KEYS.profilePicture, payload.profilePicture)
        } else {
          removeItem(STORAGE_KEYS.profilePicture)
        }
      }
      if (payload.role !== undefined) {
        this.role = payload.role
        setItem(STORAGE_KEYS.role, payload.role)
      }
      if (payload.isVerified !== undefined) {
        this.isVerified = payload.isVerified
        setItem(STORAGE_KEYS.isVerified, String(payload.isVerified))
      }
      if (payload.subscriptionStatus !== undefined) {
        this.subscriptionStatus = payload.subscriptionStatus
        setItem(STORAGE_KEYS.subscriptionStatus, payload.subscriptionStatus)
      }
      if (payload.accessUntil !== undefined) {
        this.accessUntil = payload.accessUntil
        if (payload.accessUntil) {
          setItem(STORAGE_KEYS.accessUntil, payload.accessUntil)
        } else {
          removeItem(STORAGE_KEYS.accessUntil)
        }
      }
      if (payload.foundingMember !== undefined) {
        this.foundingMember = payload.foundingMember
        setItem(STORAGE_KEYS.foundingMember, String(payload.foundingMember))
      }
      this.isAuthenticated = true
    },

    updateProfile(payload: { name?: string; lastName?: string; email?: string }) {
      this.setUser(payload)
    },

    setToken(token: string) {
      setItem(STORAGE_KEYS.token, token)
      this.isAuthenticated = true
    },

    logout() {
      this.clear()
    },

    clear() {
      this.id = null
      this.name = null
      this.lastName = null
      this.email = null
      this.role = null
      this.isVerified = false
      this.subscriptionStatus = 'none'
      this.accessUntil = null
      this.foundingMember = false
      this.isAuthenticated = false
      Object.values(STORAGE_KEYS).forEach(removeItem)
    },
  },
})
