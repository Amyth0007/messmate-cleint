

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../../auth/services/auth-service/auth.service';
import { UserService } from '../../../../services/user.service';
import { MessService } from '../../../../services/mess.service';
import { SnackBarService } from '../../../../services/snack-bar.service';
import { passwordMatchValidator } from '../../../../auth/shared/validators/password-match.validator';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthInputComponent } from '../../../../auth/shared/auth-input/auth-input.component';
import { AuthButtonComponent } from '../../../../auth/shared/auth-button/auth-button.component';
import { NavbarComponent } from '../../../shared/navbar/navbar.component';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';
@Component({
  selector: 'app-mess-onwer-user-profile',
  templateUrl: './mess-onwer-user-profile.component.html',
  styleUrls: ['./mess-onwer-user-profile.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AuthInputComponent,
    AuthButtonComponent,
  ]
})
export class MessOnwerUserProfileComponent implements OnInit {
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  messForm!: FormGroup;
  currentUser: any;
  currentMess: any;
  genderOptions = ['Male', 'Female', 'Other', 'Prefer not to say'];
  showPasswordSection = false;
  errorMessage = '';
  selectedImage: File | null = null;
  selectedImageName = '';
  address = '';
  activeTab: 'user' | 'mess' = 'user';
  selectedImagePreview: string = '';
  messTypes: any;
  imageUrl: any = null;
  imageUploading: boolean = true;
  submitted = false;
  registering = false;
  lat: number | null = null;
  lng: number | null = null;
  addressLoading: boolean = false;
  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private snackBarService: SnackBarService,
    private userService: UserService,
    private messService: MessService,
    private http: HttpClient,
    private router: Router
  ) { }

  ngOnInit() {
    this.loadUserData();
    this.loadMessData();

    this.initializeForms();
  }

  loadUserData() {
    this.userService.getUserData().subscribe({
      next: (data: any) => {
        this.currentUser = data;
        this.profileForm.patchValue({
          name: this.currentUser.name,
          email: this.currentUser.email,
          age: this.currentUser.age,
          gender: this.currentUser.gender
        });
      },
      error: (error: any) => {
        console.error('Error fetching user data:', error);
      }
    });
  }

  loadMessData() {
    this.messService.getMessDetails().subscribe({
      next: (data: any) => {
        this.currentMess = data;
        this.messForm.patchValue({
          name: this.currentMess.name,
          description: this.currentMess.description,
          type: this.currentMess.type,
          city: this.currentMess.city,
          image: this.currentMess.image
        });
        this.address = this.currentMess.address;
      },
      error: (error: any) => {
        console.error('Error fetching mess data:', error);
      }
    });
  }

  initializeForms() {
    // User Profile Form
    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
      age: [null, [Validators.min(1), Validators.max(80)]],
      gender: [null]
    });

    // Password Form
    this.passwordForm = this.fb.group({
      oldPassword: [''],
      password: ['', [Validators.minLength(6)]],
      confirmPassword: ['']
    }, { validators: passwordMatchValidator });

    // Mess Form
    this.messForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      type: ['both', Validators.required],
      city: ['', Validators.required],
      location: [''],
      address: [''],
      image: ['']
    });
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
      this.passwordForm.reset();
      this.passwordForm.get('oldPassword')?.clearValidators();
      this.passwordForm.get('password')?.clearValidators();
      this.passwordForm.get('confirmPassword')?.clearValidators();
    }
    this.passwordForm.updateValueAndValidity();
  }


  uploadImageToCloudinary(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'mess_owner');
    return this.http.post<any>('https://api.cloudinary.com/v1_1/dd8oitnyu/image/upload', formData)
      .pipe(
        map((response: any) => response.url)
      );
  }

  onUploadImage(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedImageName = file.name;
      this.imageUploading = false;

      this.uploadImageToCloudinary(file).subscribe({
        next: (url: any) => {
          this.imageUrl = url;
          this.messForm.patchValue({
            image: this.imageUrl
          });
          this.imageUploading = true;
          this.currentMess.image = this.imageUrl
        },
        error: () => {
          alert('Image upload failed.');
          this.imageUploading = false;
        }
      });
    }
  }

  async onDetectLocation() {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    this.addressLoading = true;

    try {
      const position = await this.getCurrentPosition();
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      this.lat = lat;
      this.lng = lng;

      const address = await this.reverseGeocode(lat, lng);
      this.address = address || 'Address not found';

      this.messForm.patchValue({ location: this.address });
    } catch (error) {
      console.error('Location detection failed:', error);
      alert('Unable to retrieve your location.');
      this.address = 'Address not found';
    } finally {
      this.addressLoading = false;
    }
  }

  private getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
    });
  }

  private async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        }
      });
      const data = await response.json();
      return data?.display_name ?? null;
    } catch (err) {
      console.error('Reverse geocoding failed:', err);
      return null;
    }
  }

  onUpdateProfile() {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    if (this.showPasswordSection && this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const payload: any = {
      name: this.profileForm.get('name')?.value,
      age: this.profileForm.get('age')?.value || null,
      gender: this.profileForm.get('gender')?.value || null
    };

    if (this.showPasswordSection) {
      payload.oldPassword = this.passwordForm.get('oldPassword')?.value;
      payload.newPassword = this.passwordForm.get('confirmPassword')?.value;
    }

    this.authService.updateProfile(payload).subscribe({
      next: (response) => {
        if (response.success) {
          this.snackBarService.showSuccess('✅ Profile updated!');
          // this.loadUserData();
          setTimeout(() => {
            this.router.navigate(['/mess-owner/setup/my-thalis'])
          }, 500);
        }
      },
      error: (err) => {
        this.errorMessage = err.error?.error || 'Update failed. Please try again.';
        this.snackBarService.showError(`❌ ${this.errorMessage}`);
      }
    });
  }

  onUpdateMess() {
    if (this.messForm.invalid) {
      this.messForm.markAllAsTouched();
      return;
    }

    const formData = new FormData();
    formData.append('name', this.messForm.get('name')?.value);
    formData.append('description', this.messForm.get('description')?.value);
    formData.append('type', this.messForm.get('type')?.value);
    formData.append('city', this.messForm.get('city')?.value);
    formData.append('address', this.address);
    if (this.selectedImage) {
      formData.append('image', this.selectedImage);
    }
    const payload: any = {
      name: this.messForm.get('name')?.value,
      description: this.messForm.get('description')?.value || null,
      type: this.messForm.get('type')?.value || null,
      city: this.messForm.get('city')?.value,
      adress: this.address || this.currentMess.address,
      image: this.imageUrl || this.currentMess.image
    };

    this.messService.updateMess(payload).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.snackBarService.showSuccess('✅ Mess updated successfully!');
          // this.loadMessData();
          setTimeout(() => {
            this.router.navigate(['/mess-owner/setup/my-thalis'])
          }, 500);
        }
      },
      error: (err) => {
        this.errorMessage = err.error?.error || 'Mess update failed. Please try again.';
        this.snackBarService.showError(`❌ ${this.errorMessage}`);
      }
    });
  }

  // Add these to your component class
  isDragOver = false;

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.onUploadImage({ target: { files: event.dataTransfer.files } });
    }
  }

  triggerFileInput() {
    document.getElementById('messImageUpload')?.click();
  }

  removeImage() {
    this.selectedImage = null;
    this.selectedImageName = '';
    this.selectedImagePreview = '';
    this.currentMess.image = ''
  }
}
