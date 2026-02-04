import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { SupabaseService } from '../../supabase/supabase.service';
import { DashboardSection, dashboardSectionEnum, UserProfile, userRoleEnum } from '../../models/profiles.model';
import { BehaviorSubject, Observable, combineLatest, from } from 'rxjs';
import { map, shareReplay, switchMap } from 'rxjs/operators';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { passwordMatchValidator } from '../../utils/authValidators';
import { GraphComponent } from '../graph-component/graph.component';
import { FavoriteComponents } from "../favorite-components/favorite.component";
import { AdminPanelComponent } from "../admin-panel-component/admin-panel.component";
import { MonitoringActivitiesComponent } from "../monitoring-activities-component/monitoring-activities.component";

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  imports: [CommonModule, SidebarComponent, ReactiveFormsModule, GraphComponent, FavoriteComponents, AdminPanelComponent, MonitoringActivitiesComponent],
})

export class DashboardComponent implements OnInit {
  private refreshProfile$ = new BehaviorSubject<void>(undefined);
  profileData$: Observable<UserProfile>;
  userRole$: Observable<userRoleEnum>;
  allProfiles$: Observable<UserProfile[]> | null = null;
  loading = false;
  readonly roles = userRoleEnum;
  defaultAvatar = 'img/default-avatar.webp';
  activeSection: DashboardSection = dashboardSectionEnum.PERSONAL_INFO;
  editProfileForm: FormGroup = new FormGroup({});
  stats$: Observable<any> | null = null;
  stackedProjectData$: Observable<any> | null = null;
  polarProjectData$: Observable<any> | null = null;
  recentActivities$: Observable<any> | null = null;
  readonly dashboardSectionEnum = dashboardSectionEnum;

  readonly polarOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: { display: false }
      }
    },
    plugins: {
      legend: { position: 'right' }
    }
  };

  constructor(private supabase: SupabaseService, private fb: FormBuilder, private route: ActivatedRoute, private cd: ChangeDetectorRef) {
    this.initForm();
    this.userRole$ = this.supabase.getProfileRole();

    this.profileData$ = combineLatest([
      this.supabase.user$,
      this.refreshProfile$
    ]).pipe(
      switchMap(([user, _]) => {
        if (!user) return from(Promise.resolve(null));
        return from(
          this.supabase['supabase']
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()
        ).pipe(map(res => res.data));
      }),
      shareReplay(1)
    );
  }

  ngOnInit() {
    // Sidebar control section change
    this.route.fragment.subscribe(fragment => {
      const targetSection = (fragment as DashboardSection) || dashboardSectionEnum.PERSONAL_INFO;
      this.setSection(targetSection);
      this.cd.detectChanges();
    });

    // Edit Profile
    this.profileData$.subscribe(profile => {
      if (profile) {
        this.editProfileForm.patchValue({
          email: profile.email,
          displayName: profile.display_name || '',
        });
      }
    });

    // Admin
    this.userRole$.subscribe(role => {
      if (role === this.roles.ADMIN) {
        this.allProfiles$ = this.supabase.getAllProfiles();
      }
    });

    // Stats
    this.loadStatistics();
  }

  setSection(section: DashboardSection) {
    this.activeSection = section;

    this.profileData$.subscribe(profile => {
      if (profile) {
        this.editProfileForm.patchValue({
          email: profile.email,
          displayName: profile.display_name || '',
          password: '',
          confirmPassword: '',
        });
      }
    });
  }

  async onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert("Please upload a valid image (JPEG, PNG, or WebP).");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      alert("Image size must be less than 15MB.");
      return;
    }

    this.loading = true;

    try {
      const url = await this.supabase.uploadAvatar(file);
      if (url) {
        this.refreshProfile$.next();
      }
    } catch (error) {
      alert("Error uploading image. Check your connection or permissions.");
    } finally {
      this.loading = false;
    }
  }

  private initForm() {
    this.editProfileForm = this.fb.group(
      {
        email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
        displayName: ['', [Validators.minLength(3)]],
        currentPassword: [''],
        password: ['', [Validators.minLength(6)]],
        confirmPassword: [''],
      }, { validators: passwordMatchValidator }
    );

    this.editProfileForm.get('password')?.valueChanges.subscribe(value => {
      const currentPassControl = this.editProfileForm.get('currentPassword');
      if (value) {
        currentPassControl?.setValidators([Validators.required]);
      } else {
        currentPassControl?.clearValidators();
      }
      currentPassControl?.updateValueAndValidity();
    });
  }

  async updateProfile() {
    if (this.editProfileForm.invalid) return;

    this.loading = true;
    const formValue = this.editProfileForm.getRawValue();

    try {
      const result = await this.supabase.updateProfile({
        displayName: formValue.displayName,
        password: formValue.password,
        currentPassword: formValue.currentPassword
      });

      if (result.error) {
        alert("Verification failed: " + result.error);
      } else {
        alert("Profile updated successfully!");
        this.editProfileForm.markAsPristine();
        this.refreshProfile$.next();
        this.editProfileForm.patchValue({
          currentPassword: '',
          password: '',
          confirmPassword: ''
        });
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      this.loading = false;
    }
  }

  private loadStatistics() {
    this.stats$ = this.refreshProfile$.pipe(
      switchMap(() => this.supabase.getGlobalDashboardStats()),
      shareReplay(1)
    );

    this.stackedProjectData$ = this.stats$.pipe(
      map(stats => {
        if (!stats || !stats.projects.detailed) return null;

        return {
          labels: stats.projects.detailed.map((p: any) => p.name),
          datasets: [
            {
              label: 'Males',
              data: stats.projects.detailed.map((p: any) => p.males),
              backgroundColor: '#42A5F5'
            },
            {
              label: 'Females',
              data: stats.projects.detailed.map((p: any) => p.females),
              backgroundColor: '#FF4081'
            }
          ]
        };
      })
    );

    this.polarProjectData$ = this.stats$.pipe(
      map(stats => {
        if (!stats) return null;
        return {
          labels: stats.projects.labels,
          datasets: [{
            data: stats.projects.data,
            backgroundColor: [
              '#E3000B',
              '#0055BF',
              '#FFD500',
              '#00843D',
              '#A5A5A5'
            ],
            borderColor: '#ffffff',
            borderWidth: 2
          }]
        };
      })
    );

    this.recentActivities$ = this.refreshProfile$.pipe(
      switchMap(() => from(this.supabase.getRecentCharactersActivity())),
      map(res => res.data),
      shareReplay(1)
    );
  }
}