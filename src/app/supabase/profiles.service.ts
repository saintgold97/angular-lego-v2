import { Injectable, effect, signal } from '@angular/core';
import { from, Observable, map } from 'rxjs';
import { userRoleEnum, UserProfile } from '../models/profiles.model';
import { SupabaseClientService } from './supabase.client';

@Injectable({ providedIn: 'root' })
export class ProfilesService {
    role = signal<userRoleEnum>(userRoleEnum.USER);

    constructor(private supabaseClient: SupabaseClientService) {
        effect(() => {
            const user = this.supabaseClient.user();

            if (!user) {
                this.role.set(userRoleEnum.USER);
                return;
            }

            from(
                this.supabaseClient.supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single()
            ).subscribe({
                next: res =>
                    this.role.set(
                        (res.data?.role as userRoleEnum) ?? userRoleEnum.USER
                    ),
                error: () =>
                    this.role.set(userRoleEnum.USER)
            });
        });
    }

    // ================= PROFILES =================

    getAllProfiles(): Observable<UserProfile[]> {
        return from(
            this.supabaseClient.supabase
                .from('profiles')
                .select('*')
                .order('email', { ascending: true })
        ).pipe(
            map(res => {
                if (res.error) throw res.error;
                return res.data ?? [];
            })
        );
    }

    // ================= UPDATE PROFILE =================

    async updateProfile(formData: any) {
        const user = this.supabaseClient.user();
        if (!user) throw new Error('No user found');

        if (formData.password?.trim()) {
            if (!formData.currentPassword) {
                throw new Error('Current password is required');
            }

            const { error } =
                await this.supabaseClient.supabase.auth.signInWithPassword({
                    email: user.email!,
                    password: formData.currentPassword
                });

            if (error) {
                throw new Error('Current password is incorrect');
            }
        }

        const { error: profileError } =
            await this.supabaseClient.supabase
                .from('profiles')
                .update({ display_name: formData.displayName })
                .eq('id', user.id);

        if (profileError) throw profileError;

        const updateData: any = {
            data: { display_name: formData.displayName }
        };

        if (formData.password?.trim()) {
            updateData.password = formData.password;
        }

        const { data, error } =
            await this.supabaseClient.supabase.auth.updateUser(updateData);

        if (error) throw error;

        return data;
    }

    // ================= AVATAR =================

    async uploadAvatar(file: File): Promise<string | null> {
        try {
            const user = this.supabaseClient.user();
            if (!user) throw new Error('User not authenticated');

            const ext = file.name.split('.').pop();
            const fileName = `${user.id}.${ext}`;

            const { error } =
                await this.supabaseClient.supabase.storage
                    .from('avatars')
                    .upload(fileName, file, {
                        upsert: true,
                        cacheControl: '0'
                    });

            if (error) throw error;

            const { data } =
                this.supabaseClient.supabase.storage
                    .from('avatars')
                    .getPublicUrl(fileName);

            const finalUrl = `${data.publicUrl}?t=${Date.now()}`;

            const { error: updateError } =
                await this.supabaseClient.supabase
                    .from('profiles')
                    .update({ avatar_url: finalUrl })
                    .eq('id', user.id);

            if (updateError) throw updateError;

            return finalUrl;
        } catch (err) {
            console.error('Error uploading avatar:', err);
            return null;
        }
    }

    // ================= ROLE =================

    getProfileRole(): userRoleEnum {
        return this.role();
    }
}
