import { Injectable, signal } from "@angular/core";
import { SupabaseClientService } from "./supabase.client";
import { userRoleEnum } from "../models/profiles.model";
import { GenderEnum, Project } from "../models/characters.model";

@Injectable({ providedIn: 'root' })
export class DashboardService {

    constructor(private supabaseClient: SupabaseClientService) { }

    // ================= GLOBAL STATS =================
    async getGlobalDashboardStats(): Promise<any> {
        const user = this.supabaseClient.user();
        if (!user) return null;

        // ruolo utente
        let role: userRoleEnum = userRoleEnum.USER;
        try {
            const { data, error } = await this.supabaseClient.supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (!error && data?.role) role = data.role as userRoleEnum;
        } catch (err) {
            console.error("Errore fetching user role:", err);
        }

        // fetch characters
        try {
            let query = this.supabaseClient.supabase
                .from('characters')
                .select(`
          gender, 
          project:projects!characters_project_fkey (
            id, 
            name, 
            description, 
            start_date, 
            end_date
          ),
          city:cities!characters_city_id_fkey (
            id,
            name,
            country
          )
        `);

            if (role === userRoleEnum.SUPERVISOR) {
                query = query.eq('created_by', user.id);
            }

            const { data: chars, error: charsError } = await query;
            if (charsError) throw charsError;

            const genderStats = { labels: [GenderEnum.MALE, GenderEnum.FEMALE], data: [0, 0] };
            const cityMap: Record<string, number> = {};
            const projectDetailedMap: Record<string, Project & { males: number; females: number; totalMembers: number }> = {};

            (chars || []).forEach((char: any) => {
                // Gender stats
                if (char.gender === GenderEnum.MALE) genderStats.data[0]++;
                else if (char.gender === GenderEnum.FEMALE) genderStats.data[1]++;

                // City stats
                const cityName = char.city?.name || 'Unknown City';
                cityMap[cityName] = (cityMap[cityName] || 0) + 1;

                // Project stats
                if (char.project) {
                    const p = char.project;
                    if (!projectDetailedMap[p.id]) {
                        projectDetailedMap[p.id] = {
                            ...p,
                            males: 0,
                            females: 0,
                            totalMembers: 0
                        };
                    }

                    if (char.gender === GenderEnum.MALE) projectDetailedMap[p.id].males++;
                    else if (char.gender === GenderEnum.FEMALE) projectDetailedMap[p.id].females++;
                    projectDetailedMap[p.id].totalMembers++;
                }
            });

            const projectsArray = Object.values(projectDetailedMap);

            return {
                total: chars?.length || 0,
                gender: genderStats,
                cities: {
                    labels: Object.keys(cityMap),
                    data: Object.values(cityMap)
                },
                projects: {
                    detailed: projectsArray,
                    labels: projectsArray.map(p => p.name),
                    data: projectsArray.map(p => p.totalMembers)
                },
            };

        } catch (err) {
            console.error("Errore fetching dashboard stats:", err);
            return null;
        }
    }

    // ================= RECENT CHARACTER ACTIVITY =================
    async getRecentCharactersActivity(limit = 5): Promise<any> {
        try {
            const { data, error } = await this.supabaseClient.supabase
                .from('characters')
                .select('name, lastname, created_at, projects(name)')
                .order('created_at', { ascending: false })
                .limit(limit);

            return { data: data || [], error };
        } catch (err) {
            console.error("Errore fetching recent characters:", err);
            return { data: [], error: err };
        }
    }
}
