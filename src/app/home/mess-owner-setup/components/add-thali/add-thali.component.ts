import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { map, Observable, Subject, takeUntil } from 'rxjs';
import { Thali, ThaliType } from 'src/app/auth/interfaces/thali.interface';
import { EditingStateService } from 'src/app/services/editing-state.service';
import { SnackBarService } from 'src/app/services/snack-bar.service';
import { ThaliService } from 'src/app/services/thalis.service';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { thaliTimeRangeValidator } from '../../shared/thali-time-range-validator';
import { UpdateThaliPayload } from 'src/app/payloads/thali.payload';

@Component({
  selector: 'app-add-thali',
  templateUrl: './add-thali.component.html',
  styleUrls: ['./add-thali.component.css'],
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, ConfirmDialogComponent]
})
export class AddThaliComponent implements OnInit, OnDestroy {
  @Input() thaliData: Thali | null = null;
  @Input() readonly: boolean = false;
  @Output() delete = new EventEmitter<void>();
  @Output() cancelEdit = new EventEmitter<void>();
  @Output() thaliChange = new EventEmitter<Partial<Thali>>();
  @Output() thaliCreated = new EventEmitter<Thali>(); // For new thalis
  @Output() thaliUpdated = new EventEmitter<void>();   // For updates

  isEditing = false;
  thaliForm: FormGroup;
  previewUrl: string | ArrayBuffer | null = null;
  timeMin = '00:00';
  timeMax = '23:59';
  ThaliType = ThaliType;
  private timeRanges: Record<ThaliType, { min: string; max: string }> = {
    [ThaliType.Lunch]: { min: '12:00', max: '16:00' },
    [ThaliType.Dinner]: { min: '19:00', max: '23:00' }
  };
  thaliTypes = Object.values(ThaliType).filter(value => typeof value === 'string');
  private destroy$ = new Subject<void>();
  showDialog = false;
  dialogTitle = '';
  dialogMessage = '';
  dialogConfirmText = '';
  dialogCancelText = '';
  dialogColor: 'publish' | 'unpublish' | 'delete' | 'save' | 'cancel' = 'publish';
  dialogCallback: () => void = () => { };
  selectedImage: File | null = null;
  selectedImageName = '';
  address = '';
  activeTab: 'user' | 'mess' = 'user';
  selectedImagePreview: string = '';
  messTypes: any;
  imageUrl: any = null;
  imageUploading: boolean = true;
  existingDate='';
  newAvailableFrom='';
  newAvailableUntil ='';

  constructor(
    private fb: FormBuilder,
    private snackBar: SnackBarService,
    private editingState: EditingStateService,
    private thaliService: ThaliService,
    private http: HttpClient,
    private router: Router,
  ) {
    this.thaliForm = this.fb.group({
      thaliName: ['', Validators.required],
      rotis: ['', [Validators.required, Validators.min(0)]],
      sabzi: ['', Validators.required],
      daal: ['no', Validators.required],
      daalReplacement: [''],
      rice: ['no', Validators.required],
      salad: ['no'],
      sweet: ['no'],
      sweetInfo: [''],
      otherItems: [''],
      price: ['', [Validators.required, Validators.min(1)]],
      type: [null, Validators.required],
      image: [null,],
      availableFrom: ['', Validators.required],
      availableUntil: ['', Validators.required],
    });
    this.thaliForm.setValidators(thaliTimeRangeValidator());
  }

  ngOnInit(): void {

    this.setupFormInitialState();
    this.setupFormLogic();

    this.editingState.isEditing$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isEditing => {
        this.isEditing = isEditing;
        this.handleEditStateChange();
      });
      console.log(this.thaliData);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupFormInitialState(): void {
    if (this.thaliData) {
      console.log(this.thaliData);
      this.patchThali(this.thaliData);
      this.selectedImagePreview = this.thaliData.image;
      this.selectedImage = new File([], this.thaliData.image) as File;
      this.imageUrl = this.thaliData.image;
      this.selectedImageName = this.thaliData.image;
      this.imageUploading = false;
      this.previewUrl = this.thaliData.image || null;
    }

    if (this.isEditing) {
      this.enableEditMode();
    } else if (this.readonly) {
      this.thaliForm.disable({ emitEvent: false });
    } else {
      this.thaliForm.enable({ emitEvent: false });
    }
  }

  private handleEditStateChange(): void {
    if (this.isEditing) {
      this.enableEditMode();
    } else if (this.readonly) {
      this.thaliForm.disable({ emitEvent: false });
    } else {
      this.thaliForm.enable({ emitEvent: false });
    }
  }

  private setupFormLogic(): void {
    // Sweet logic
    this.getControl('sweet')?.valueChanges.subscribe((value: string) => {
      const sweetInfoControl = this.getControl('sweetInfo');
      if (value === 'yes') {
        sweetInfoControl?.enable({ emitEvent: false });
      } else {
        sweetInfoControl?.disable({ emitEvent: false });
        sweetInfoControl?.reset();
      }
    });

    // Daal logic
    this.getControl('daal')?.valueChanges.subscribe((value: string) => {
      const daalReplacementControl = this.getControl('daalReplacement');
      if (value === 'no') {
        daalReplacementControl?.enable({ emitEvent: false });
      } else {
        daalReplacementControl?.disable({ emitEvent: false });
        daalReplacementControl?.reset();
      }
    });

    // Initial daal replacement state
    if (this.getControl('daal')?.value !== 'no') {
      this.getControl('daalReplacement')?.disable({ emitEvent: false });
    }

    // Time range logic
    this.getControl('type')?.valueChanges.subscribe((type: ThaliType) => {
      const range = this.timeRanges[type];
      if (range) {
        this.timeMin = range.min;
        this.timeMax = range.max;
      } else {
        this.timeMin = '00:00';
        this.timeMax = '23:59';
      }
      this.resetInvalidTimes();
    });
  }

  private getControl(controlName: string): AbstractControl | null {
    return this.thaliForm.get(controlName);
  }

  patchThali(thali: Thali): void {

    this.thaliForm.patchValue({
      thaliName: thali.thaliName,
      rotis: thali.rotis,
      sabzi: thali.sabzi,
      daal: thali.daal ? 'yes' : 'no',
      daalReplacement: thali.daalReplacement || '',
      rice: thali.rice ? 'yes' : 'no',
      salad: thali.salad ? 'yes' : 'no',
      sweet: thali.sweet ? 'yes' : 'no',
      sweetInfo: thali.sweetInfo || '',
      otherItems: thali.otherItems || '',
      price: thali.price,
      type: thali.type,
      availableFrom: thali.availableFrom?.substring(11, 16) || '',
      availableUntil: thali.availableUntil?.substring(11, 16) || ''
    });
  }

  resetInvalidTimes(): void {
    const from = this.getControl('availableFrom')?.value;
    const until = this.getControl('availableUntil')?.value;

    if (from && (from < this.timeMin || from > this.timeMax)) {
      this.getControl('availableFrom')?.setValue('');
    }
    if (until && (until < this.timeMin || until > this.timeMax)) {
      this.getControl('availableUntil')?.setValue('');
    }
  }

  enableEditMode(): void {
    this.isEditing = true;
    this.thaliForm.enable({ emitEvent: false });

    if (this.getControl('daal')?.value !== 'no') {
      this.getControl('daalReplacement')?.disable({ emitEvent: false });
    }
    if (this.getControl('sweet')?.value !== 'yes') {
      this.getControl('sweetInfo')?.disable({ emitEvent: false });
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => this.previewUrl = reader.result;
      reader.readAsDataURL(file);
      this.getControl('image')?.setValue(file);
      this.getControl('image')?.updateValueAndValidity();
    }
  }



  confirmSave(): void {
    if (this.thaliForm.valid) {
      this.openDialog(
        'save',
        'Save Changes',
        'Are you sure you want to save these changes?',
        'Save',
        'Cancel',
        () => {
          this.submitThali();
        }
      );
    } else {
      this.thaliForm.markAllAsTouched();
      this.snackBar.showError('Please fix all errors before saving');
    }
  }

  // Dialog handlers
  onDialogConfirm() {
    this.dialogCallback();
    this.showDialog = false;
  }

  onDialogCancel() {
    this.showDialog = false;
  }

  confirmCancel(): void {
    this.openDialog(
      'cancel',
      'Cancel Editing',
      'Are you sure you want to cancel? All unsaved changes will be lost.',
      'Yes, Cancel',
      'No, Continue Editing',
      () => {
        if (this.thaliData) {
          this.patchThali(this.thaliData);
        }
        this.isEditing = false;
        this.cancelEdit.emit();
      }
    );
  }

  openDialog(
    type: 'publish' | 'unpublish' | 'delete' | 'save' | 'cancel',
    title: string,
    message: string,
    confirmText: string,
    cancelText: string,
    callback: () => void
  ) {
    this.dialogColor = type;
    this.dialogTitle = title;
    this.dialogMessage = message;
    this.dialogConfirmText = confirmText;
    this.dialogCancelText = cancelText;
    this.dialogCallback = callback;
    this.showDialog = true;
  }

  submitThali(): void {
    if (this.thaliForm.valid) {
      const formValue = this.thaliForm.value;

      // Prepare complete thali data
      const thaliData: Omit<Thali, 'id' | 'available_date' | 'availableFrom' | 'availableUntil'> = {
        thaliName: formValue.thaliName!,
        type: formValue.type!,
        published: formValue.published || false,
        editable: formValue.editable !== false,
        rotis: formValue.rotis!,
        sabzi: formValue.sabzi!,
        daal: formValue.daal === 'yes'!,
        daalReplacement: formValue.daalReplacement || '',
        rice: formValue.rice === 'yes'!,
        salad: formValue.salad === 'yes'!,
        sweet: formValue.sweet === 'yes'!,
        sweetInfo: formValue.sweetInfo || '',
        otherItems: formValue.otherItems || '',
        price: formValue.price!,
        image: this.imageUrl as string,
        timeFrom: formValue.availableFrom!,
        timeTo: formValue.availableUntil!,
        isDeleted: false
      };

      if (this.thaliData?.id) {
        this.existingDate = this.thaliData.availableFrom.split(' ')[0];
        this.newAvailableFrom = `${this.existingDate} ${formValue.availableFrom}`;
        this.newAvailableUntil = `${this.existingDate} ${formValue.availableUntil}`;
        const updatePayload: UpdateThaliPayload = {
          ...this.thaliData,

          // ✅ rebuild datetime with SAME date + NEW time
          availableFrom: this.newAvailableFrom,
          availableUntil: this.newAvailableUntil,

          // other edited fields
          thaliName: formValue.thaliName!,
          rotis: formValue.rotis!,
          sabzi: formValue.sabzi!,
          daal: formValue.daal === 'yes',
          daalReplacement: formValue.daalReplacement || '',
          rice: formValue.rice === 'yes',
          salad: formValue.salad === 'yes',
          sweet: formValue.sweet === 'yes',
          sweetInfo: formValue.sweetInfo || '',
          otherItems: formValue.otherItems || '',
          price: formValue.price!,
          image: this.imageUrl as string,
          published: formValue.published || false,
          editable: formValue.editable !== false
        };
        // For updates, emit just the id to indicate success
        this.thaliService.updateThali(this.thaliData.id, updatePayload).subscribe({
          next: (response) => {
            this.snackBar.showSuccess('Thali updated successfully!');
            this.router.navigate(['/mess-owner/setup/my-thalis']);
            this.thaliUpdated.emit(); // Emit update event
          },
          error: (error) => {
            console.error('Error updating thali:', error);
            this.snackBar.showError('Error updating thali: ' + error.message);
          }
        });
      } else {
        // For new thalis, emit the complete thali with id
        this.thaliService.addThali(thaliData).subscribe({
          next: (newThali: Thali) => {
            this.snackBar.showSuccess('Thali created successfully!');
            this.router.navigate(['/mess-owner/setup/my-thalis']);
            this.thaliCreated.emit(newThali); // Emit create event with data
          },
          error: (error) => {
            console.error('Error creating thali:', error);
            this.snackBar.showError('Error creating thali: Cannot create another thali for same mess, same date and same type. Try editing existing thali');
          }
        });
      }
    }
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
      this.selectedImage = file.name
      this.selectedImageName = file.name;
      this.imageUploading = false;

      this.uploadImageToCloudinary(file).subscribe({
        next: (url: any) => {
          this.imageUrl = url;
          this.selectedImagePreview = url
          // this.messForm.patchValue({
          //   image: this.imageUrl
          // });
          //   this.imageUploading = true;
          //   this.currentMess.image = this.imageUrl
        },
        error: () => {
          alert('Image upload failed.');
          this.imageUploading = false;
        }
      });
    }
  }

  triggerFileInput() {
    document.getElementById('messImageUpload')?.click();
  }

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

  removeImage() {
    this.selectedImage = null;
    this.selectedImageName = '';
    this.selectedImagePreview = '';
    this.imageUrl = ''
  }
}
