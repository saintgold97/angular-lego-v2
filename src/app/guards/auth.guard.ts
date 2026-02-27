import { inject } from "@angular/core"
import { CanActivateFn, Router } from "@angular/router"
import { AuthService } from "../services/supabase/auth.service"

export const AuthGuard: CanActivateFn = async () => {
  const authService = inject(AuthService)
  const router = inject(Router)

  const isLogged = await authService.isLogged()

  if (!isLogged) {
    router.navigate(['/'])
    return false
  }

  return true
}
