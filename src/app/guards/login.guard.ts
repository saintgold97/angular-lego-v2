import { inject } from "@angular/core"
import { CanActivateFn, Router } from "@angular/router"
import { SupabaseService } from "../supabase/supabase.service"

export const LoginGuard: CanActivateFn = async () => {
  const supabase = inject(SupabaseService)
  const router = inject(Router)

  const isLogged = await supabase.isLogged()

  if (isLogged) {
    router.navigate(['/home'])
    return false
  }

  return true
}
