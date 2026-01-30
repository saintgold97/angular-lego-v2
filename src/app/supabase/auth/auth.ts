import { Component, OnInit } from '@angular/core'
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms'
import { SupabaseService } from '../supabase.service'
import { Router } from '@angular/router'
import { passwordMatchValidator } from '../../utils/authValidators'

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

  constructor(
    private fb: FormBuilder,
    private supabase: SupabaseService,
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

  async onSubmit() {
    if (this.authForm.invalid) {
      this.authForm.markAllAsTouched()
      return
    }

    const { email, password, displayName } = this.authForm.value

    try {
      this.loading = true
      
      const { error } = this.isLogin
        ? await this.supabase.signIn(email, password)
        : await this.supabase.signUp(email, password, displayName)

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('Email or password is incorrect')
          }
    
          throw error
        }
      this.router.navigate(['/home'])
    } catch (err: any) {
      console.error('Authentication error:', err)
      this.errorMessage = err.message ?? 'Authentication error'
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