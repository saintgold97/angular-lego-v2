import { inject, Injectable } from "@angular/core";
import { Observable, from, map, shareReplay } from "rxjs";
import { Project } from "../../models/characters.model";
import { SupabaseClientService } from "./supabase.client";

@Injectable({ providedIn: "root" })
export class ProjectsService {
    private supabaseClient = inject(SupabaseClientService);
    public projectsCache$: Observable<Project[]> | null = null;

    getProjects(): Observable<Project[]> {
        if (!this.projectsCache$) {
            this.projectsCache$ = from(this.supabaseClient.supabase.from('projects').select(`*, members:characters(count)`).order('name')).pipe(
                map(res => {
                    if (res.error) throw res.error;
                    return (res.data as Project[]).map(p => ({
                        ...p,
                        totalMembers: p.members?.[0]?.count || 0
                    }));
                }), shareReplay(1));
        }
        return this.projectsCache$
    }

    createProject(project: Project): Observable<any> {
        const payload = {
            name: project.name,
            description: project.description,
            start_date: project.start_date,
            end_date: project.end_date || null,
        };

        this.projectsCache$ = null;

        return from(this.supabaseClient.supabase.from('projects').insert(payload).select());
    }

    editProject(id: string, project: Partial<Project>): Observable<any> {
        return from(this.supabaseClient.supabase.from('projects').update(project).eq('id', id).select());
    }

    getProjectById(id: string): Observable<Project | null> {
        const query = this.supabaseClient.supabase.from('projects').select('*, members:characters(count)').eq('id', id).single();

        return from(query).pipe(
            map(res => {
                if (res.error) {
                    console.error('Errore fetching character:', res.error);
                    return null;
                }

                const p = res.data as any;
                return {
                    ...p,
                    totalMembers: p.members?.[0]?.count || 0
                } as Project;
            })
        );
    }

    async assignMembersToProject(projectId: string, memberIds: string[]): Promise<any> {
        if (!projectId) {
            console.error("Error: projectId is required to assign members.");
            return;
        }

        try {
            const { error: clearError } = await this.supabaseClient.supabase
                .from('characters')
                .update({ project_id: null })
                .eq('project_id', projectId);

            if (clearError) throw clearError;

            if (memberIds && memberIds.length > 0) {
                const { error: updateError } = await this.supabaseClient.supabase
                    .from('characters')
                    .update({ project_id: projectId })
                    .in('id', memberIds);

                if (updateError) throw updateError;
            }
        } catch (err) {
            console.error("Error assigning members to project:", err);
            throw err;
        }
    }
}