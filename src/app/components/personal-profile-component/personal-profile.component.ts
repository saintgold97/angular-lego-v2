import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { BehaviorSubject, combineLatest, filter, from, Observable, of, shareReplay, switchMap, take } from "rxjs";
import { UserProfile, userRoleEnum } from "../../models/profiles.model";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { passwordMatchValidator } from "../../utils/authValidators";
import { NotificationService, ToastType } from "../../services/notification.service";
import { ToastComponent } from "../toast-component/toast.component";
import { ProfileService } from "../../services/supabase/profile.service";
import { SupabaseClientService } from "../../services/supabase/supabase.client";

@Component({
    selector: "app-personal-profile",
    templateUrl: "./personal-profile.component.html",
    styleUrls: ["./personal-profile.component.scss"],
    imports: [CommonModule, ReactiveFormsModule, ToastComponent],
})
export class PersonalProfileComponent implements OnInit {
    private refreshProfile$ = new BehaviorSubject<void>(undefined);
    profileData$: Observable<UserProfile | null>;
    userRole$: Observable<userRoleEnum>;

    readonly roles = userRoleEnum;
    defaultAvatar = 'img/default-avatar.webp';
    loading = false;
    editProfileForm!: FormGroup;

    constructor(
        private supabaseClientService: SupabaseClientService, 
        private profileService: ProfileService, 
        private fb: FormBuilder, 
        private notify: NotificationService
    ) {
        this.initForm();
        this.userRole$ = this.profileService.getProfileRole();

        this.profileData$ = combineLatest([
            this.supabaseClientService.user$,
            this.refreshProfile$
        ]).pipe(
            switchMap(([user, _]) => {
                if (!user) return of(null);
                return from(this.profileService.getProfileById(user.id));
            }),
            shareReplay(1)
        );
    }

    ngOnInit() {
        this.profileData$.pipe(
            filter(profile => !!profile),
            take(1)
        ).subscribe(profile => {
            this.editProfileForm.patchValue({
                email: profile!.email,
                displayName: profile!.display_name || '',
            });
        });
    }

    async onFileSelected(event: any) {
        const file: File = event.target.files[0];
        if (!file) return;

        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            this.notify.show("Please upload a valid image (JPEG, PNG, or WebP).", ToastType.ERROR);
            return;
        }

        if (file.size > 15 * 1024 * 1024) {
            this.notify.show("Please upload an image smaller than 15MB.", ToastType.ERROR);
            return;
        }

        this.loading = true;

        try {
            const url = await this.profileService.uploadAvatar(file);
            if (url) {
                this.refreshProfile$.next();
            }
        } catch (error) {
            this.notify.show("Error uploading image. Check your connection or permissions.", ToastType.ERROR);
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
            const result = await this.profileService.updateProfile({
                displayName: formValue.displayName,
                password: formValue.password,
                currentPassword: formValue.currentPassword
            });

            if (result.error) {
                this.notify.show(result.error, ToastType.ERROR);
            } else {
                this.notify.show("Profile updated successfully!", ToastType.SUCCESS);
                this.editProfileForm.markAsPristine();
                this.refreshProfile$.next();
                this.editProfileForm.patchValue({
                    currentPassword: '',
                    password: '',
                    confirmPassword: ''
                });
            }
        } catch (err: any) {
            console.error('Error updating profile:', err);
            this.notify.show("Error updating profile. Check your connection or permissions.", ToastType.ERROR);
        } finally {
            this.loading = false;
        }
    }
}