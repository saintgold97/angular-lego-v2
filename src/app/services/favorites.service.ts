import { Injectable } from "@angular/core";
import { LegoCharacter } from "../models/characters.model";
import { Observable, map, lastValueFrom } from "rxjs";
import { FavoriteSupabaseService } from "./supabase/favorite-supabase.service";

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  constructor(private favoritesSupabase: FavoriteSupabaseService) { }

  getFavorites(): Observable<LegoCharacter[]> {
    return this.favoritesSupabase.getFavorites().pipe(
      map(data => data.map((f: { character_data: LegoCharacter; }) => f.character_data || {}))
    );
  }

  async toggleFavorite(character: LegoCharacter): Promise<boolean> {
    const characterId = character.id || '';
    const exists = await this.favoritesSupabase.isFavorite(characterId);
  
    if (exists) {
      const removeObs = this.favoritesSupabase.removeFavorite(characterId);
      if (removeObs) await lastValueFrom(removeObs);
      return false;
    } else {
      const addObs = this.favoritesSupabase.addFavorite(character);
      await lastValueFrom(addObs);
      return true;
    }
  }

  async isFavorite(id: string): Promise<boolean> {
    if (!id) return false;
    return await this.favoritesSupabase.isFavorite(id);
  }
}