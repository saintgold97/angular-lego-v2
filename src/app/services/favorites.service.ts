import { Injectable } from "@angular/core";
import { SupabaseService } from "../supabase/supabase.service";
import { LegoCharacter } from "../models/characters.model";
import { Observable, map, lastValueFrom } from "rxjs";

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  constructor(private supabase: SupabaseService) { }

  getFavorites(): Observable<LegoCharacter[]> {
    return this.supabase.getFavorites().pipe(
      map(data => data.map((f: { character_data: LegoCharacter; }) => f.character_data || {}))
    );
  }

  async toggleFavorite(character: LegoCharacter): Promise<boolean> {
    const characterId = character.id || '';
    const exists = await this.supabase.isFavorite(characterId);
  
    if (exists) {
      const removeObs = await this.supabase.removeFavorite(characterId);
      if (removeObs) await lastValueFrom(removeObs);
      return false;
    } else {
      const addObs = await this.supabase.addFavorite(character);
      await lastValueFrom(addObs);
      return true;
    }
  }

  async isFavorite(id: string): Promise<boolean> {
    if (!id) return false;
    return await this.supabase.isFavorite(id);
  }
}