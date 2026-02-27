import { inject, Injectable } from "@angular/core";
import { Observable, from, map, catchError, of, switchMap, shareReplay } from "rxjs";
import { UserProfile, userRoleEnum } from "../../models/profiles.model";
import { SupabaseClientService } from "./supabase.client";

@Injectable({ providedIn: 'root' })
export class ProfileService {
    private supabaseClient = inject(SupabaseClientService);
    public roleCache$: Observable<userRoleEnum> | null = null;

    constructor() { }

    getAllProfiles(roleFilter?: string): Observable<UserProfile[]> {
        let query = this.supabaseClient.supabase.from('profiles').select('*').order('email', { ascending: true });

        if (roleFilter) {
            query = query.eq('role', roleFilter);
        }

        return from(query).pipe(
            map(res => res.data || []),
            catchError(() => of([]))
        );
    }

    getProfileById(id: string): Observable<UserProfile | null> {
        return from(
            this.supabaseClient.supabase
                .from('profiles')
                .select('*')
                .eq('id', id)
                .single()
        ).pipe(
            map(res => {
                if (res.error) throw res.error;
                return res.data || null;
            })
        );
    }

    async updateProfile(formData: any) {
        const { data: { user } } = await this.supabaseClient.supabase.auth.getUser();
        if (!user) throw new Error('No user found');

        if (formData.password && formData.password.trim() !== '') {
            if (!formData.currentPassword) {
                throw new Error('Current password is required to set a new one');
            }

            const { error: signInError } = await this.supabaseClient.supabase.auth.signInWithPassword({
                email: user.email!,
                password: formData.currentPassword,
            });

            if (signInError) {
                throw new Error('Current password is incorrect');
            }
        }

        const { error: profileError } = await this.supabaseClient.supabase
            .from('profiles')
            .update({
                display_name: formData.displayName,
            })
            .eq('id', user.id);

        if (profileError) throw profileError;

        const updateData: any = {
            data: { display_name: formData.displayName }
        };

        if (formData.password && formData.password.trim() !== '') {
            updateData.password = formData.password;
        }

        const { data: authData, error: authError } = await this.supabaseClient.supabase.auth.updateUser(updateData);

        if (authError) throw authError;

        return { data: authData, error: null };
    }

    async uploadAvatar(file: File): Promise<string | null> {
        try {
            const { data: { user } } = await this.supabaseClient.supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}.${fileExt}`;

            const { error: uploadError } = await this.supabaseClient.supabase.storage
                .from('avatars')
                .upload(fileName, file, {
                    upsert: true,
                    cacheControl: '0',
                });

            if (uploadError) throw uploadError;

            const { data } = this.supabaseClient.supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            const finalUrl = `${data.publicUrl}?t=${new Date().getTime()}`;

            const { error: updateError } = await this.supabaseClient.supabase
                .from('profiles')
                .update({ avatar_url: finalUrl })
                .eq('id', user.id);

            if (updateError) throw updateError;

            return finalUrl;
        } catch (error) {
            console.error('Error uploading avatar:', error);
            return null;
        }
    }

    getProfileRole(): Observable<userRoleEnum> {
        if (!this.roleCache$) {
            this.roleCache$ = this.supabaseClient.user$.pipe(
                switchMap(user => {
                    if (!user) return of(userRoleEnum.USER);
                    return from(
                        this.supabaseClient.supabase
                            .from('profiles')
                            .select('role')
                            .eq('id', user.id)
                            .single()
                    ).pipe(
                        map(res => (res.data?.role as userRoleEnum) || userRoleEnum.USER),
                        catchError(() => of(userRoleEnum.USER))
                    );
                }),
                shareReplay(1)
            );
        }
        return this.roleCache$;
    }
}