import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AuthService } from "../../auth/services/auth-service/auth.service";
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthInputComponent } from 'src/app/auth/shared/auth-input/auth-input.component';
import { AuthButtonComponent } from 'src/app/auth/shared/auth-button/auth-button.component';
import { NavbarComponent } from '../shared/navbar/navbar.component';
import { passwordMatchValidator } from 'src/app/auth/shared/validators/password-match.validator';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { SnackBarService } from 'src/app/services/snack-bar.service';
import { Router } from '@angular/router';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AuthInputComponent, AuthButtonComponent, FormsModule, NavbarComponent]
})
export class ProfileComponent implements OnInit {
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  currentUser: any;
  genderOptions = ['Male', 'Female', 'Other', 'Prefer not to say'];
  showPasswordSection = false;
  errorMessage = '';

  constructor(private authService: AuthService, private fb: FormBuilder, private snackBarService: SnackBarService, private router: Router, private userService: UserService,
  ) { }



  ngOnInit() {
    this.userService.getUserData().subscribe({
      next: (data) => {
        this.currentUser = data;
        this.profileForm.patchValue({
          name: this.currentUser.name,
          email: this.currentUser.email,
          age: this.currentUser.age,
          gender: this.currentUser.gender
        });

      },
      error: (error) => {
        console.error('Error fetching user data:', error);
      }
    });

    this.profileForm = this.fb.group({
      name: [this.currentUser?.name || '', Validators.required],
      email: [{ value: this.currentUser?.email || '', disabled: true }, [Validators.required, Validators.email]],
      age: [this.currentUser?.age ?? null, [Validators.min(1), Validators.max(80)]],      // make age optional
      gender: [this.currentUser?.gender ?? null] // make gender optional
    });




    this.passwordForm = this.fb.group({
      oldPassword: [''],
      password: ['', [Validators.minLength(6)]],
      confirmPassword: ['']
    }, { validators: passwordMatchValidator });
  }

  get genderControl(): FormControl {
    return this.profileForm.get('gender') as FormControl;
  }

  getInitials(): string {
    const name = this.currentUser?.name?.trim();
    if (!name) return 'U';
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((w: string) => w[0])
      .join('')
      .toUpperCase();
  }

  togglePasswordSection() {
    this.showPasswordSection = !this.showPasswordSection;
    if (this.showPasswordSection) {
      this.passwordForm.get('oldPassword')?.setValidators([Validators.required]);
      this.passwordForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
      this.passwordForm.get('confirmPassword')?.setValidators([Validators.required]);
    } else {
      this.passwordForm.reset(); // optionally: clear validators
      this.passwordForm.get('oldPassword')?.clearValidators();
      this.passwordForm.get('password')?.clearValidators();
      this.passwordForm.get('confirmPassword')?.clearValidators();
    }
    this.passwordForm.updateValueAndValidity();
  }


  onUpdateProfile() {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    // If user chose to change password, validate the password form
    if (this.showPasswordSection) {
      if (this.passwordForm.invalid) {
        this.passwordForm.markAllAsTouched();
        return;
      }
    }

    const payload: any = {
      name: this.profileForm.get('name')?.value,
      age: this.profileForm.get('age')?.value || null,
      gender: this.profileForm.get('gender')?.value || null
    };

    // Conditionally add password to payload if password change is requested
    if (this.showPasswordSection) {
      payload.oldPassword = this.passwordForm.get('oldPassword')?.value;
      payload.newPassword = this.passwordForm.get('confirmPassword')?.value;
    }

    // Call the service to update profile
    this.authService.updateProfile(payload).subscribe({
      next: (response) => {
        // success handling (e.g., toast, UI update)
        if (response.success) {
          this.snackBarService.showSuccess('✅ Profile updated!');
          setTimeout(() => {
            this.router.navigate(['/']);
          }, 500);
        }
      },
      error: (err) => {
        // error handling (e.g., show message)
        console.log(err);
        this.errorMessage = err.error?.error || 'Update failed. Please try again.';
        this.snackBarService.showError(`❌ ${this.errorMessage}`);
        console.log(err.error.error);

      }
    });
  }

}
