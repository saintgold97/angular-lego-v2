import { Injectable, signal } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../environments/environments';
import { toObservable } from '@angular/core/rxjs-interop';

@Injectable({ providedIn: 'root' })
export class SupabaseClientService {
  private client: SupabaseClient;
  user = signal<User | null>(null);
  user$ = toObservable(this.user);

  constructor() {
    this.client = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );

    this.client.auth.onAuthStateChange((_event, session) => {
      this.user.set(session?.user ?? null);
    });
  }

  get supabase(): SupabaseClient {
    return this.client;
  }

  async signOut(): Promise<void> {
    this.user.set(null);
    await this.client.auth.signOut();
  }
}
