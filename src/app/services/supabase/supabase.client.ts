import { Injectable, signal } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../environments/environments';
import { toObservable } from '@angular/core/rxjs-interop';

@Injectable({ providedIn: 'root' })
export class SupabaseClientService {
    public supabase: SupabaseClient;
    public user = signal<User | null>(null);
    public user$ = toObservable(this.user);

    constructor() {
        this.supabase = createClient(
            environment.supabaseUrl,
            environment.supabaseKey
        );

        this.supabase.auth.onAuthStateChange((_event, session) => {
            this.user.set(session?.user ?? null);
        });
    }
}