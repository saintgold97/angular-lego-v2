import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { BehaviorSubject, combineLatest, filter, from, Observable, of, shareReplay, switchMap, take } from "rxjs";
import { UserProfile, userRoleEnum } from "../../models/profiles.model";
import { SupabaseService } from "../../supabase/supabase.service";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { passwordMatchValidator } from "../../utils/authValidators";

@Component({
    selector: "app-personal-profile",
    templateUrl: "./personal-profile.component.html",
    styleUrls: ["./personal-profile.component.scss"],
    imports: [CommonModule, ReactiveFormsModule],
})
export class PersonalProfileComponent implements OnInit {
    private refreshProfile$ = new BehaviorSubject<void>(undefined);
    profileData$: Observable<UserProfile | null>;;
    userRole$: Observable<userRoleEnum>;

    readonly roles = userRoleEnum;
    defaultAvatar = 'img/default-avatar.webp';
    loading = false;
    editProfileForm!: FormGroup;

    constructor(private supabase: SupabaseService, private fb: FormBuilder) {
        this.initForm();
        this.userRole$ = this.supabase.getProfileRole();

        this.profileData$ = combineLatest([
            this.supabase.user$,
            this.refreshProfile$
        ]).pipe(
            switchMap(([user, _]) => {
                if (!user) return of(null);
                return from(this.supabase.getProfileById(user.id));
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
}