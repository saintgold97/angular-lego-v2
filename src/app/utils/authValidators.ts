import { AbstractControl, FormControl, ValidationErrors } from "@angular/forms";

const matchPwdValidator = (control: FormControl): 
{ [s: string]: boolean } | null => {

  // ? prendo il valore del FormControl 'pwd' che sta nel parent del control
  const pwdValue = control.parent?.get('pwd')?.value;

  if (control.value !== pwdValue) {

    return { "password doesn't match": true };
  }
  return null
}

export default matchPwdValidator;


export function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value
  const confirmPassword = control.get('confirmPassword')?.value

  if (!password || !confirmPassword) return null
  return password === confirmPassword ? null : { passwordMismatch: true }
}