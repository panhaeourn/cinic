export function resolveRoleRedirect(roles: string[]) {
  if (roles.length === 1 && roles.includes('PATIENT')) {
    return '/app/patient'
  }

  return '/app'
}
