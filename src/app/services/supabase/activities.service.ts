import { inject, Injectable } from "@angular/core";
import { Observable, from, map } from "rxjs";
import { Activity } from "../../models/activities.model";
import { SupabaseClientService } from "./supabase.client";

@Injectable({ providedIn: "root" })
export class ActivitiesService {
    private supabaseClient = inject(SupabaseClientService);

    getActivities(userId?: string, projectId?: string, date?: string): Observable<any[]> {
        let query = this.supabaseClient.supabase
            .from('activities')
            .select(`
            *,
            project:projects(id, name),
            profile:profiles!activities_created_by_fkey(email, display_name, avatar_url)
            `)
            .order('created_at', { ascending: false });

        if (userId) {
            query = query.eq('created_by', userId);
        }

        if (projectId) {
            query = query.eq('project_id', projectId);
        }

        if (date) {
            query = query.eq('activity_date', date);
        }

        return from(query).pipe(
            map(res => {
                if (res.error) throw res.error;
                return res.data || [];
            })
        );
    }

    createActivity(activity: Activity): Observable<any> {
        return from(this.supabaseClient.supabase.from('activities').insert(activity));
    }

    updateActivity(id: string, activity: Partial<Activity>): Observable<any> {
        return from(
            this.supabaseClient.supabase
                .from('activities')
                .update(activity)
                .eq('id', id)
                .select()
        );
    }

    deleteActivity(id: string): Observable<any> {
        return from(
            this.supabaseClient.supabase
                .from('activities')
                .delete()
                .eq('id', id)
        );
    }
}