import { Injectable } from "@angular/core";
import { LegoCharacter } from "../models/characters.model";
import { Observable, of, from, map, switchMap } from "rxjs";
import { userRoleEnum } from "../models/profiles.model";
import { SupabaseClientService } from "./supabase.client";
import { ProfilesService } from "./profiles.service";
import { toObservable } from "@angular/core/rxjs-interop";

@Injectable({ providedIn: 'root' })
export class CharactersService {

    constructor(
        private supabaseClient: SupabaseClientService,
        private profilesService: ProfilesService
    ) { }

    // ================= CHARACTERS =================

    getCharacters(
        filter?: { name?: string; gender?: string; project_id?: string }
    ): Observable<LegoCharacter[]> {

        return toObservable(this.supabaseClient.user).pipe(
            switchMap(user => {
                if (!user) return of([]);

                const role = this.profilesService.role();

                let query = this.supabaseClient.supabase
                    .from('characters')
                    .select(`
            *,
            city:cities!characters_city_id_fkey (
              id,
              name,
              country
            ),
            project:projects!characters_project_fkey (
              id,
              name,
              description,
              start_date,
              end_date
            )
          `);

                if (role === userRoleEnum.SUPERVISOR) {
                    query = query.eq('created_by', user.id);
                }

                if (filter?.name) {
                    query = query.ilike('name', `%${filter.name}%`);
                }

                if (filter?.gender) {
                    query = query.eq('gender', filter.gender);
                }

                if (filter?.project_id) {
                    query = query.eq('project_id', filter.project_id);
                }

                return from(query).pipe(
                    map(res => {
                        if (res.error) throw res.error;
                        return res.data as LegoCharacter[];
                    })
                );
            })
        );
    }

    // ================= CRUD =================

    createCharacter(character: LegoCharacter): Observable<any> {
        const user = this.supabaseClient.user();

        const payload = {
            name: character.name,
            lastname: character.lastname,
            email: character.email,
            phone: character.phone,
            picture: character.picture,
            gender: character.gender,
            city_id: character.city_id,
            project_id: character.project_id,
            created_by: user?.id ?? null
        };

        return from(
            this.supabaseClient.supabase
                .from('characters')
                .insert(payload)
                .select()
        );
    }

    editCharacter(
        id: string,
        character: Partial<LegoCharacter>
    ): Observable<any> {
        return from(
            this.supabaseClient.supabase
                .from('characters')
                .update(character)
                .eq('id', id)
                .select()
        );
    }

    deleteCharacter(id: string): Observable<any> {
        return from(
            this.supabaseClient.supabase
                .from('characters')
                .delete()
                .eq('id', id)
        );
    }

    // ================= SINGLE =================

    getCharacterById(id: string): Observable<LegoCharacter | null> {
        return from(
            this.supabaseClient.supabase
                .from('characters')
                .select(`
          *,
          city:cities!characters_city_id_fkey (
            id,
            name,
            country
          ),
          project:projects!characters_project_fkey (
            id,
            name,
            description,
            start_date,
            end_date
          )
        `)
                .eq('id', id)
                .single()
        ).pipe(
            map(res => {
                if (res.error) {
                    console.error('Errore fetching character:', res.error);
                    return null;
                }
                return res.data as LegoCharacter;
            })
        );
    }

    // ================= AVATAR =================

    async uploadCharacterAvatar(file: File): Promise<string | null> {
        try {
            const ext = file.name.split('.').pop();
            const fileName = `char_${Date.now()}.${ext}`;

            const { error } =
                await this.supabaseClient.supabase.storage
                    .from('characters')
                    .upload(fileName, file);

            if (error) throw error;

            const { data } =
                this.supabaseClient.supabase.storage
                    .from('characters')
                    .getPublicUrl(fileName);

            return data.publicUrl;
        } catch (err) {
            console.error('Error uploading character avatar:', err);
            return null;
        }
    }
}
