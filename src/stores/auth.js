import { ref } from 'vue'
import { defineStore } from 'pinia'
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import { auth, googleProvider } from '@/plugins/firebase.js'
import { db as dexie } from '@/db/index.js'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const ready = ref(false)

  // Resolves once Firebase has determined the initial auth state from its cache.
  // This is the key fix — we need to wait for this before the router guard acts.
  let _resolveReady
  const _readyPromise = new Promise(resolve => { _resolveReady = resolve })

  // Set up listener immediately at store creation — NOT lazily on initAuth()
  onAuthStateChanged(auth, u => {
    user.value = u
    if (!ready.value) {
      ready.value = true
      _resolveReady(u)
    }
  })

  // Await this in the router guard and main.js to block until auth is known
  function waitForReady() {
    return _readyPromise
  }

  async function signInWithGoogle() {
    await signInWithPopup(auth, googleProvider)
  }

  async function logout() {
    // Wipe local DB so the next user doesn't see this user's data
    await dexie.transaction('rw', [dexie.categories, dexie.chores, dexie.choreInstances], async () => {
      await dexie.categories.clear()
      await dexie.chores.clear()
      await dexie.choreInstances.clear()
    })
    localStorage.removeItem('activeUid')
    await signOut(auth)
  }

  return { user, ready, waitForReady, signInWithGoogle, logout }
})
