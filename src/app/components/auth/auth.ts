import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core'
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms'
import { Router } from '@angular/router'
import { passwordMatchValidator } from '../../utils/authValidators'
import { AuthService } from '../../services/supabase/auth.service'

@Component({
  selector: 'app-auth',
  templateUrl: './auth.html',
  styleUrls: ['./auth.scss'],
  imports: [ReactiveFormsModule],
})
export class AuthComponent implements OnInit {
  authForm!: FormGroup
  isLogin = true
  loading = false
  errorMessage = ''
  private cdr = inject(ChangeDetectorRef);
  loadingGuest = false

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.buildForm()
  }

  private buildForm() {
    this.authForm = this.fb.group(
      {
        email: ['', [Validators.required, Validators.email]],
        displayName: [''],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: [''],
      },
      {
        validators: this.isLogin ? null : passwordMatchValidator
      }
    )
  }

  toggleMode() {
    this.isLogin = !this.isLogin
    this.errorMessage = ''
    this.buildForm()
  }

  async loginAsGuest() {
    // Configura qui l'utente demo creato precedentemente su Supabase
    const GUEST_EMAIL = 'demo.lego@portfolio.com'; 
    const GUEST_PASSWORD = 'LegoDemoUser2026!'; 

    try {
      this.loading = true;
      this.loadingGuest = true;
      this.errorMessage = '';

      const { error } = await this.authService.signIn(GUEST_EMAIL, GUEST_PASSWORD);

      if (error) throw error;

      this.cdr.detectChanges();
      this.router.navigate(['/home']);
    } catch (err: any) {
      console.error('Guest authentication error:', err);
      this.errorMessage = "We're unable to access the demo at the moment. Please try again later.";
      this.loading = false;
      this.loadingGuest = false;
      this.cdr.detectChanges();
    }
  }

  async onSubmit() {
    if (this.authForm.invalid) {
      this.authForm.markAllAsTouched()
      return
    }

    const { email, password, displayName } = this.authForm.value

    try {
      this.loading = true

      const { error } = this.isLogin
        ? await this.authService.signIn(email, password)
        : await this.authService.signUp(email, password, displayName)

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Email or password is incorrect')
        }

        throw error
      }

      this.loading = false;
      this.cdr.detectChanges();
      this.router.navigate(['/home'])
    } catch (err: any) {
      console.error('Authentication error:', err)
      this.errorMessage = err.message ?? 'Authentication error'
      this.cdr.detectChanges();
    } finally {
      this.loading = false
    }
  }

  get passwordMismatch(): boolean {
    return (
      !this.isLogin &&
      this.authForm.errors?.['passwordMismatch'] &&
      this.authForm.get('confirmPassword')?.touched
    )
  }
}