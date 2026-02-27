import { inject, Injectable } from "@angular/core";
import { Observable, switchMap, of, from, map } from "rxjs";
import { LegoCharacter } from "../../models/characters.model";
import { SupabaseClientService } from "./supabase.client";
import { AuthService } from "./auth.service";

@Injectable({ providedIn: "root" })
export class FavoriteSupabaseService {
    private supabaseClient = inject(SupabaseClientService);
    private authService = inject(AuthService);

    getFavorites(): Observable<any[]> {
        return this.supabaseClient.user$.pipe(
            switchMap(user => {
                if (!user?.id) return of([]);

                const query = this.supabaseClient.supabase
                    .from('favorites')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                return from(query).pipe(
                    map(res => res.data || [])
                );
            })
        );
    }

    addFavorite(character: LegoCharacter): Observable<any> {
        const userId = this.authService.currentUserValue?.id;
        if (!userId) throw new Error("You must be logged in to add favorites");

        const query = this.supabaseClient.supabase.from('favorites').insert({
            character_id: character.id,
            character_data: character,
            user_id: userId
        });

        return from(query);
    }

    removeFavorite(characterId: string): Observable<any> {
        const userId = this.authService.currentUserValue?.id;

        if (!userId) {
            throw new Error("You must be logged in to remove favorites");
        }

        const query = this.supabaseClient.supabase
            .from('favorites')
            .delete()
            .eq('character_id', characterId)

        return from(query);
    }

    async isFavorite(characterId: string): Promise<boolean> {
        const userId = this.authService.currentUserValue?.id;
        if (!userId) return false;

        const { data, error } = await this.supabaseClient.supabase
            .from('favorites')
            .select('id')
            .eq('user_id', userId)
            .eq('character_id', characterId)
            .maybeSingle();

        if (error) {
            console.error("Errore query isFavorite:", error.message);
            return false;
        }

        return !!data;
    }
}