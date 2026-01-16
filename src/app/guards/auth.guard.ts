import { inject } from "@angular/core"
import { CanActivateFn, Router } from "@angular/router"
import { SupabaseService } from "../supabase/supabase.service"

export const AuthGuard: CanActivateFn = async () => {
  const supabase = inject(SupabaseService)
  const router = inject(Router)

  const isLogged = await supabase.isLogged()

  if (!isLogged) {
    router.navigate(['/'])
    return false
  }

  return true
}
