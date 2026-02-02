import { Injectable } from "@angular/core";
import { SupabaseClientService } from "./supabase.client";
import { User } from "@supabase/supabase-js";

@Injectable({ providedIn: 'root' })
export class AuthService {

    constructor(private supabaseClient: SupabaseClientService) { }

    signUp(email: string, password: string, displayName: string) {
        return this.supabaseClient.supabase.auth.signUp({
            email,
            password,
            options: {
                data: { display_name: displayName }
            }
        });
    }

    signIn(email: string, password: string) {
        return this.supabaseClient.supabase.auth.signInWithPassword({
            email,
            password
        });
    }

    signOut() {
        return this.supabaseClient.signOut();
    }

    isLogged(): boolean {
        return !!this.supabaseClient.user();
    }

    // ================= USER =================

    get currentUser(): User | null {
        return this.supabaseClient.user();
    }
}
