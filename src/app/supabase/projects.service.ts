import { Injectable, signal } from "@angular/core";
import { SupabaseClientService } from "./supabase.client";
import { Project } from "../models/characters.model";

@Injectable({ providedIn: 'root' })
export class ProjectsService {

    private projectsSignal = signal<Project[]>([]);

    constructor(private supabaseClient: SupabaseClientService) { }

    // ================= GET PROJECTS =================
    async loadProjects(): Promise<Project[]> {
        if (this.projectsSignal().length) {
            return this.projectsSignal();
        }

        try {
            const { data, error } = await this.supabaseClient.supabase
                .from("projects")
                .select(`*, members:characters(count)`)
                .order("name");

            if (error) throw error;

            const projects = (data || []).map((p: any) => ({
                ...p,
                totalMembers: p.members?.[0]?.count || 0
            }));

            this.projectsSignal.set(projects);
            return projects;
        } catch (err) {
            console.error("Errore fetching projects:", err);
            this.projectsSignal.set([]);
            return [];
        }
    }

    // ================= SIGNAL ACCESSOR =================
    get projects(): Project[] {
        return this.projectsSignal();
    }

    // ================= GET SINGLE PROJECT =================
    async getProjectById(id: string): Promise<Project | null> {
        try {
            const { data, error } = await this.supabaseClient.supabase
                .from("projects")
                .select(`*, members:characters(count)`)
                .eq("id", id)
                .single();

            if (error) throw error;

            const p = data as any;
            return {
                ...p,
                totalMembers: p.members?.[0]?.count || 0
            } as Project;

        } catch (err) {
            console.error("Errore fetching project:", err);
            return null;
        }
    }

    // ================= CREATE PROJECT =================
    async createProject(project: Project): Promise<Project | null> {
        try {
            const payload = {
                name: project.name,
                description: project.description,
                start_date: project.start_date,
                end_date: project.end_date || null,
            };

            const { data, error } = await this.supabaseClient.supabase
                .from("projects")
                .insert(payload)
                .select()
                .single();

            if (error) throw error;

            await this.loadProjects();
            return data as Project;

        } catch (err) {
            console.error("Errore creando progetto:", err);
            return null;
        }
    }

    // ================= EDIT PROJECT =================
    async editProject(id: string, project: Partial<Project>): Promise<Project | null> {
        try {
            const { data, error } = await this.supabaseClient.supabase
                .from("projects")
                .update(project)
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;

            await this.loadProjects();
            return data as Project;

        } catch (err) {
            console.error("Errore modificando progetto:", err);
            return null;
        }
    }

    // ================= ASSIGN MEMBERS =================
    async assignMembersToProject(projectId: string, memberIds: string[]): Promise<void> {
        if (!projectId) {
            console.error("Error: projectId is required");
            return;
        }

        try {
            const { error: clearError } = await this.supabaseClient.supabase
                .from("characters")
                .update({ project_id: null })
                .eq("project_id", projectId);

            if (clearError) throw clearError;

            if (memberIds?.length) {
                const { error: updateError } = await this.supabaseClient.supabase
                    .from("characters")
                    .update({ project_id: projectId })
                    .in("id", memberIds);

                if (updateError) throw updateError;
            }

            await this.loadProjects();

        } catch (err) {
            console.error("Error assigning members to project:", err);
            throw err;
        }
    }
}
