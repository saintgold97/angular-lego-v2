import { inject, Injectable } from "@angular/core";
import { User } from "@supabase/supabase-js";
import { ProfileService } from "./profile.service";
import { SupabaseClientService } from "./supabase.client";
import { ProjectsService } from "./projects.service";

@Injectable({ providedIn: "root" })
export class AuthService {
    private supabaseClient = inject(SupabaseClientService);
    private profileService = inject(ProfileService);
    private projectsService = inject(ProjectsService);

    signUp(email: string, password: string, display_name: string) {
        return this.supabaseClient.supabase.auth.signUp({ email, password, options: { data: { display_name: display_name } }, })
    }

    signIn(email: string, password: string) {
        return this.supabaseClient.supabase.auth.signInWithPassword({ email, password })
    }

    signOut() {
        this.profileService.roleCache$ = null;
        this.projectsService.projectsCache$ = null;
        return this.supabaseClient.supabase.auth.signOut()
    }

    async isLogged(): Promise<boolean> {
        const { data } = await this.supabaseClient.supabase.auth.getSession()
        return !!data.session
    }

    get currentUserValue(): User | null {
        return this.supabaseClient.user();
    }

}