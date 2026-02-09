import { Injectable } from '@angular/core'
import { createClient, SupabaseClient, User } from '@supabase/supabase-js'
import { environment } from '../environments/environments'
import { City, GenderEnum, LegoCharacter, Project } from '../models/characters.model'
import { BehaviorSubject, from, Observable, map, switchMap, of, shareReplay, catchError } from 'rxjs';
import { UserProfile, userRoleEnum } from '../models/profiles.model';
import { Activity } from '../models/activities.model';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private supabase: SupabaseClient
  private userSubject = new BehaviorSubject<User | null>(null)
  user$ = this.userSubject.asObservable()
  private roleCache$: Observable<userRoleEnum> | null = null;
  private citiesCache$: Observable<City[]> | null = null;
  private projectsCache$: Observable<Project[]> | null = null;

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    )

    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.userSubject.next(session?.user ?? null)
    })
  }

  // ================= AUTH =================

  signUp(email: string, password: string, display_name: string) {
    return this.supabase.auth.signUp({ email, password, options: { data: { display_name: display_name } }, })
  }

  signIn(email: string, password: string) {
    return this.supabase.auth.signInWithPassword({ email, password })
  }

  signOut() {
    this.roleCache$ = null;
    this.citiesCache$ = null;
    this.projectsCache$ = null;
    return this.supabase.auth.signOut()
  }

  async isLogged(): Promise<boolean> {
    const { data } = await this.supabase.auth.getSession()
    return !!data.session
  }

  get currentUserValue(): User | null {
    return this.userSubject.value;
  }

  // ================= PROFILES =================

  getAllProfiles(roleFilter?: string): Observable<UserProfile[]> {
    let query = this.supabase.from('profiles').select('*').order('email', { ascending: true });

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
      this.supabase
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
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('No user found');

    if (formData.password && formData.password.trim() !== '') {
      if (!formData.currentPassword) {
        throw new Error('Current password is required to set a new one');
      }

      const { error: signInError } = await this.supabase.auth.signInWithPassword({
        email: user.email!,
        password: formData.currentPassword,
      });

      if (signInError) {
        throw new Error('Current password is incorrect');
      }
    }

    const { error: profileError } = await this.supabase
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

    const { data: authData, error: authError } = await this.supabase.auth.updateUser(updateData);

    if (authError) throw authError;

    return { data: authData, error: null };
  }

  async uploadAvatar(file: File): Promise<string | null> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}.${fileExt}`;

      const { error: uploadError } = await this.supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          upsert: true,
          cacheControl: '0',
        });

      if (uploadError) throw uploadError;

      const { data } = this.supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const finalUrl = `${data.publicUrl}?t=${new Date().getTime()}`;

      const { error: updateError } = await this.supabase
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
      this.roleCache$ = this.user$.pipe(
        switchMap(user => {
          if (!user) return of(userRoleEnum.USER);
          return from(
            this.supabase
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

  // ================= CHARACTERS =================
  getCharacters(filter?: { name?: string; gender?: string, project_id?: string }): Observable<LegoCharacter[]> {
    return this.user$.pipe(
      switchMap(user => {
        if (!user) return of(null);
        return from(this.getProfileRole()).pipe(
          map(role => ({ user, role }))
        );
      }),
      switchMap(authData => {
        if (!authData) return of([]);

        const { user, role } = authData;

        let query = this.supabase
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
          end_date),
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
      city_id: character.city_id,
      project_id: character.project_id,
      created_by: this.currentUserValue?.id ?? null
    };

    return from(this.supabase.from('characters').insert(payload).select());
  }

  editCharacter(id: string, character: Partial<LegoCharacter>): Observable<any> {
    return from(this.supabase.from('characters').update(character).eq('id', id).select());
  }

  deleteCharacter(id: string): Observable<any> {
    return from(this.supabase.from('characters').delete().eq('id', id));
  }

  getCharacterById(id: string): Observable<LegoCharacter | null> {
    const query = this.supabase
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

      const { error: uploadError } = await this.supabase.storage
        .from('characters')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = this.supabase.storage
        .from('characters')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading character avatar:', error);
      return null;
    }
  }

  // ================= FAVORITES =================

  getFavorites(): Observable<any[]> {
    return this.user$.pipe(
      switchMap(user => {
        if (!user?.id) return of([]);

        const query = this.supabase
          .from('favorites')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        return from(query).pipe(
          map(res => res.data || [])
        );
      })
    );
  }

  addFavorite(character: LegoCharacter): Observable<any> {
    const userId = this.currentUserValue?.id;
    if (!userId) throw new Error("You must be logged in to add favorites");

    const query = this.supabase.from('favorites').insert({
      character_id: character.id,
      character_data: character,
      user_id: userId
    });

    return from(query);
  }

  removeFavorite(characterId: string): Observable<any> {
    const userId = this.currentUserValue?.id;

    if (!userId) {
      throw new Error("You must be logged in to remove favorites");
    }

    const query = this.supabase
      .from('favorites')
      .delete()
      .eq('character_id', characterId)

    return from(query);
  }

  async isFavorite(characterId: string): Promise<boolean> {
    const userId = this.currentUserValue?.id;
    if (!userId) return false;

    const { data, error } = await this.supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('character_id', characterId)
      .maybeSingle();

    if (error) {
      console.error("Errore query isFavorite:", error.message);
      return false;
    }

    return !!data;
  }

  // ================= CITIES =================
  getCities(): Observable<City[]> {
    if (!this.citiesCache$) {
      this.citiesCache$ = from(this.supabase.from('cities').select('*').order('name')).pipe(
        map(res => {
          if (res.error) throw res.error;
          return res.data as City[];
        }),
        shareReplay(1)
      );
    }
    return this.citiesCache$;
  }

  // ================= PROJECTS =================
  getProjects(): Observable<Project[]> {
    if (!this.projectsCache$) {
      this.projectsCache$ = from(this.supabase.from('projects').select(`*, members:characters(count)`).order('name')).pipe(
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

    return from(this.supabase.from('projects').insert(payload).select());
  }

  editProject(id: string, project: Partial<Project>): Observable<any> {
    return from(this.supabase.from('projects').update(project).eq('id', id).select());
  }

  getProjectById(id: string): Observable<Project | null> {
    const query = this.supabase.from('projects').select('*, members:characters(count)').eq('id', id).single();

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
      const { error: clearError } = await this.supabase
        .from('characters')
        .update({ project_id: null })
        .eq('project_id', projectId);

      if (clearError) throw clearError;

      if (memberIds && memberIds.length > 0) {
        const { error: updateError } = await this.supabase
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

  // ================= DASHBOARD STATISTICS CHARACTERS =================
  getGlobalDashboardStats(): Observable<any> {
    return this.user$.pipe(
      switchMap(user => {
        if (!user) return of(null);
        return from(this.getProfileRole()).pipe(map(role => ({ user, role })));
      }),
      switchMap(authData => {
        if (!authData) return of(null);

        let query = this.supabase
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

        if (authData.role === userRoleEnum.SUPERVISOR) {
          query = query.eq('created_by', authData.user.id);
        }

        return from(query).pipe(
          map(res => {
            if (res.error) throw res.error;

            const genderStats = { labels: [GenderEnum.MALE, GenderEnum.FEMALE], data: [0, 0] };
            const cityMap: { [key: string]: number } = {};
            const projectDetailedMap: { [key: string]: Project } = {};

            res.data.forEach((char: any) => {
              // Gender Stats
              if (char.gender === GenderEnum.MALE) genderStats.data[0]++;
              else if (char.gender === GenderEnum.FEMALE) genderStats.data[1]++;

              // City Stats
              const cityName = char.city?.name || 'Unknown City';
              cityMap[cityName] = (cityMap[cityName] || 0) + 1;

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

            return {
              total: res.data.length,
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
          })
        );
      })
    );
  }

  // ================= RECENT CHAR ACTIVITY =================
  async getRecentCharactersActivity(): Promise<any> {
    const { data, error } = await this.supabase
      .from('characters')
      .select('name, lastname, created_at, projects(name), profiles!created_by(email)')
      .order('created_at', { ascending: false })
      .limit(5);

    return { data, error };
  }

  // ================= ACTIVITY =================
  getActivities(userId?: string, projectId?: string, date?: string): Observable<any[]> {
    let query = this.supabase
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
    return from(this.supabase.from('activities').insert(activity));
  }

  updateActivity(id: string, activity: Partial<Activity>): Observable<any> {
    return from(
      this.supabase
        .from('activities')
        .update(activity)
        .eq('id', id)
        .select()
    );
  }

  deleteActivity(id: string): Observable<any> {
    return from(
      this.supabase
        .from('activities')
        .delete()
        .eq('id', id)
    );
  }

  // ================ DASHBOARD STATISTICS TIME LOGS ================
  async getTimeLogs() {
    const { data, error } = await this.supabase
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