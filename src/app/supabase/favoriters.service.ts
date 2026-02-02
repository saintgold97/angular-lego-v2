import { Injectable, effect, signal } from "@angular/core";
import { SupabaseClientService } from "./supabase.client";
import { LegoCharacter } from "../models/characters.model";

@Injectable({ providedIn: 'root' })
export class FavoritesService {
    favorites = signal<LegoCharacter[]>([]);

    constructor(private supabaseClient: SupabaseClientService) {
        effect(() => {
            const user = this.supabaseClient.user();
            if (!user) {
                this.favorites.set([]);
                return;
            }

            this.loadFavorites();
        });
    }

    // ================= GET FAVORITES =================
    async loadFavorites() {
        const user = this.supabaseClient.user();
        if (!user) {
            this.favorites.set([]);
            return;
        }

        try {
            const { data, error } = await this.supabaseClient.supabase
                .from("favorites")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (error) throw error;

            const favs = (data || []).map((f: any) => f.character_data as LegoCharacter);
            this.favorites.set(favs);
        } catch (err) {
            console.error("Errore caricamento favorites:", err);
            this.favorites.set([]);
        }
    }

    // ================= TOGGLE FAVORITE =================
    async toggleFavorite(character: LegoCharacter): Promise<boolean> {
        const user = this.supabaseClient.user();
        if (!user) throw new Error("User not authenticated");

        const characterId = character.id;
        if (!characterId) return false;

        const exists = this.favorites().some(f => f.id === characterId);

        if (exists) {
            // remove favorite
            const { error } = await this.supabaseClient.supabase
                .from("favorites")
                .delete()
                .eq("character_id", characterId)
                .eq("user_id", user.id);

            if (error) throw error;

            this.favorites.update(list => list.filter(f => f.id !== characterId));
            return false;
        } else {
            // add favorite
            const { error } = await this.supabaseClient.supabase
                .from("favorites")
                .insert({
                    character_id: characterId,
                    character_data: character,
                    user_id: user.id
                });

            if (error) throw error;

            this.favorites.update(list => [character, ...list]);
            return true;
        }
    }

    // ================= CHECK IF FAVORITE =================
    isFavorite(characterId: string): boolean {
        return this.favorites().some(f => f.id === characterId);
    }
}
