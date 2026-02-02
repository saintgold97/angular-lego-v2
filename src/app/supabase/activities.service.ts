import { Injectable } from "@angular/core";
import { SupabaseClientService } from "./supabase.client";
import { Activity } from "../models/activities.model";

@Injectable({ providedIn: 'root' })
export class ActivityService {

    constructor(private supabaseClient: SupabaseClientService) { }

    // ================= GET ACTIVITIES =================
    async getActivities(userId?: string): Promise<Activity[]> {
        try {
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

            const { data, error } = await query;
            if (error) throw error;

            return data || [];
        } catch (err) {
            console.error("Errore fetching activities:", err);
            return [];
        }
    }

    // ================= CREATE ACTIVITY =================
    async createActivity(activity: Activity): Promise<Activity | null> {
        try {
            const { data, error } = await this.supabaseClient.supabase
                .from('activities')
                .insert(activity)
                .select()
                .single();

            if (error) throw error;
            return data as Activity;
        } catch (err) {
            console.error("Errore creating activity:", err);
            return null;
        }
    }

    // ================= UPDATE ACTIVITY =================
    async updateActivity(id: string, activity: Partial<Activity>): Promise<Activity | null> {
        try {
            const { data, error } = await this.supabaseClient.supabase
                .from('activities')
                .update(activity)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data as Activity;
        } catch (err) {
            console.error("Errore updating activity:", err);
            return null;
        }
    }

    // ================= DELETE ACTIVITY =================
    async deleteActivity(id: string): Promise<boolean> {
        try {
            const { error } = await this.supabaseClient.supabase
                .from('activities')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return true;
        } catch (err) {
            console.error("Errore deleting activity:", err);
            return false;
        }
    }
}
