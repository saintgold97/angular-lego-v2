import { inject } from "@angular/core"
import { CanActivateFn, Router } from "@angular/router"
import { AuthService } from "../services/supabase/auth.service"

export const LoginGuard: CanActivateFn = async () => {
  const supabase = inject(AuthService)
  const router = inject(Router)

  const isLogged = await supabase.isLogged()

  if (isLogged) {
    router.navigate(['/home'])
    return false
  }

  return true
}
