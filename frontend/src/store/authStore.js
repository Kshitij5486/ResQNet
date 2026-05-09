import { create } from 'zustand'

const useAuthStore = create((set) => ({
  token: localStorage.getItem('token') || null,
  userId: localStorage.getItem('userId') || null,
  user: null,

  setAuth: (token, userId) => {
    localStorage.setItem('token', token)
    localStorage.setItem('userId', userId)
    set({ token, userId })
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    set({ token: null, userId: null, user: null })
  },

  isAuthenticated: () => !!localStorage.getItem('token'),
}))

export default useAuthStore