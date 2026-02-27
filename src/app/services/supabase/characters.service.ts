import { inject, Injectable } from "@angular/core";
import { Observable, switchMap, of, from, map } from "rxjs";
import { LegoCharacter } from "../../models/characters.model";
import { userRoleEnum } from "../../models/profiles.model";
import { SupabaseClientService } from "./supabase.client";
import { ProfileService } from "./profile.service";
import { AuthService } from "./auth.service";

@Injectable({ providedIn: "root" })
export class CharactersService {
    private supabaseClient = inject(SupabaseClientService);
    private profileService = inject(ProfileService);
    private authService = inject(AuthService);

    getCharacters(filter?: { name?: string; gender?: string, project_id?: string }): Observable<LegoCharacter[]> {
        return this.supabaseClient.user$.pipe(
            switchMap(user => {
                if (!user) return of(null);
                return from(this.profileService.getProfileRole()).pipe(
                    map(role => ({ user, role }))
                );
            }),
            switchMap(authData => {
                if (!authData) return of([]);

                const { user, role } = authData;

                let query = this.supabaseClient.supabase
                    .from('characters')
                    .select(`
                        *,
                        project:projects!characters_project_fkey (
                        id, name, description, start_date, end_date
                        ),
                        author:profiles!created_by (email)
                    `).order('created_at', { ascending: false });

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

    createCharacter(character: LegoCharacter): Observable<any> {
        const payload = {
            name: character.name,
            lastname: character.lastname,
            email: character.email,
            phone: character.phone,
            picture: character.picture,
            gender: character.gender,
            city_name: character.city_name,
            project_id: character.project_id,
            created_by: this.authService.currentUserValue?.id ?? null
        };

        return from(this.supabaseClient.supabase.from('characters').insert(payload).select());
    }

    editCharacter(id: string, character: Partial<LegoCharacter>): Observable<any> {
        return from(this.supabaseClient.supabase.from('characters').update(character).eq('id', id).select());
    }

    deleteCharacter(id: string): Observable<any> {
        return from(this.supabaseClient.supabase.from('characters').delete().eq('id', id));
    }

    getCharacterById(id: string): Observable<LegoCharacter | null> {
        const query = this.supabaseClient.supabase
            .from('characters')
            .select(`
            *,
            project:projects!characters_project_fkey (
            id, name, description, start_date, end_date
            ),
            author:profiles!created_by (email)
            `)
            .eq('id', id)
            .single();

        return from(query).pipe(
            map(res => {
                if (res.error) {
                    console.error('Errore fetching character:', res.error);
                    return null;
                }
                return res.data as LegoCharacter;
            })
        );
    }

    async uploadCharacterAvatar(file: File): Promise<string | null> {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `char_${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await this.supabaseClient.supabase.storage
                .from('characters')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = this.supabaseClient.supabase.storage
                .from('characters')
                .getPublicUrl(filePath);

            return data.publicUrl;
        } catch (error) {
            console.error('Error uploading character avatar:', error);
            return null;
        }
    }
}