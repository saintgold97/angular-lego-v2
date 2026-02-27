import { inject, Injectable } from "@angular/core";
import { Observable, switchMap, of, from, map } from "rxjs";
import { GenderEnum, Project } from "../../models/characters.model";
import { userRoleEnum } from "../../models/profiles.model";
import { ProfileService } from "./profile.service";
import { SupabaseClientService } from "./supabase.client";

@Injectable({ providedIn: 'root' })
export class DashboardService {
    private supabaseClient = inject(SupabaseClientService);
    private profileService = inject(ProfileService);

    // STATISTICS CHARACTERS 
    getGlobalDashboardStats(): Observable<any> {
        return this.supabaseClient.user$.pipe(
            switchMap(user => {
                if (!user) return of(null);
                return from(this.profileService.getProfileRole()).pipe(map(role => ({ user, role })));
            }),
            switchMap(authData => {
                if (!authData) return of(null);

                let query = this.supabaseClient.supabase
                    .from('characters')
                    .select(`
                        city_name,
                        gender, 
                        project:projects!characters_project_fkey (
                        id, name, description, start_date, end_date
                        )
                    `);

                if (authData.role === userRoleEnum.SUPERVISOR) {
                    query = query.eq('created_by', authData.user.id);
                }

                return from(query).pipe(
                    map((res: any) => {
                        if (res.error) throw res.error;

                        const genderStats = { labels: [GenderEnum.MALE, GenderEnum.FEMALE], data: [0, 0] };
                        const cityMap: { [key: string]: number } = {};
                        const projectDetailedMap: { [key: string]: Project } = {};

                        res.data.forEach((char: any) => {
                            // Gender Stats
                            if (char.gender === GenderEnum.MALE) genderStats.data[0]++;
                            else if (char.gender === GenderEnum.FEMALE) genderStats.data[1]++;

                            // City Stats
                            let label = 'Unknown City';

                            if (char.city_name) {
                                if (typeof char.city_name === 'string') {
                                    label = char.city_name;
                                }
                            }

                            cityMap[label] = (cityMap[label] || 0) + 1;

                            // 3. Project Stats
                            if (char.project) {
                                const p = char.project;
                                if (!projectDetailedMap[p.id]) {
                                    projectDetailedMap[p.id] = {
                                        id: p.id,
                                        name: p.name,
                                        description: p.description || '',
                                        start_date: p.start_date,
                                        end_date: p.end_date,
                                        males: 0, females: 0, totalMembers: 0
                                    };
                                }

                                if (char.gender === 'male') projectDetailedMap[p.id].males!++;
                                else if (char.gender === 'female') projectDetailedMap[p.id].females!++;
                                projectDetailedMap[p.id].totalMembers!++;
                            }
                        });
                        const projectsArray = Object.values(projectDetailedMap);

                        // City Stats
                        const sortedCities = Object.entries(cityMap)
                            .sort((a, b) => b[1] - a[1]);

                        const topCities = sortedCities.slice(0, 8);
                        const otherCount = sortedCities.slice(8).reduce((sum, current) => sum + current[1], 0);

                        if (otherCount > 0) {
                            topCities.push(['Others', otherCount]);
                        }

                        return {
                            total: res.data.length,
                            gender: genderStats,
                            cities: {
                                labels: topCities.map(c => c[0]),
                                data: topCities.map(c => c[1])
                            },
                            projects: {
                                detailed: projectsArray,
                                labels: projectsArray.map(p => p.name),
                                data: projectsArray.map(p => p.totalMembers)
                            },
                        };
                    })
                );
            })
        );
    }

    // RECENT CHAR ACTIVITY 
    async getRecentCharactersActivity(): Promise<any> {
        const { data, error } = await this.supabaseClient.supabase
            .from('characters')
            .select('name, lastname, created_at, projects(name), profiles!created_by(email)')
            .order('created_at', { ascending: false })
            .limit(5);

        return { data, error };
    }

    // STATISTICS TIME LOGS
    async getTimeLogs() {
        const { data, error } = await this.supabaseClient.supabase
            .from('activities')
            .select(`
                working_hours,
                projects ( name ),
                profiles ( email ),
                activity_date
            `);

        if (error) {
            console.error("Error fetching time logs:", error);
            return [];
        }

        return data.map(log => ({
            hours: Number(log.working_hours) || 0,
            project_name: (log.projects as any)?.name || 'Unknown Project',
            profile_email: (log.profiles as any)?.email || 'Unknown Email',
            date: log.activity_date,
        }));
    }
}