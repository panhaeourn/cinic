const ACCESS_TOKEN_KEY = 'clinic_access_token'
const REFRESH_TOKEN_KEY = 'clinic_refresh_token'

export const tokenStorage = {
  getAccessToken() {
    return window.localStorage.getItem(ACCESS_TOKEN_KEY)
  },
  getRefreshToken() {
    return window.localStorage.getItem(REFRESH_TOKEN_KEY)
  },
  save(accessToken: string, refreshToken: string) {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
    window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  },
  clear() {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY)
    window.localStorage.removeItem(REFRESH_TOKEN_KEY)
  },
}
