import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { City, LegoCharacter, Project } from '../../models/characters.model';
import { ReactiveFormsModule } from '@angular/forms'
import { SupabaseService } from '../../supabase/supabase.service';

@Component({
    selector: 'app-modal',
    templateUrl: './modal.component.html',
    styleUrls: ['./modal.component.scss'],
    standalone: true,
    imports: [ReactiveFormsModule],
})
export class ModalComponent implements OnInit, OnChanges {
    legoForm: FormGroup = new FormGroup({});
    successMessage: string | null = null;
    errorMessage: string | null = null;
    @Output() characterCreated = new EventEmitter<void>();
    @Output() characterUpdated = new EventEmitter<void>();
    @Input() editData: LegoCharacter | null = null;
    @ViewChild('closeModal') closeModal!: ElementRef;
    cities: City[] = [];
    projects: Project[] = [];
    selectedFile: File | null = null;
    previewUrl: string | null = null;
    isUploading = false;

    constructor(private fb: FormBuilder, private supabase: SupabaseService) { }

    ngOnInit(): void {
        this.initForm();
        this.loadCities();
        this.loadProjects();
    }

    initForm() {
        this.legoForm = this.fb.group({
            name: ['', Validators.required],
            lastname: ['', Validators.required],
            gender: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            city_id: ['', Validators.required],
            project_id: ['', Validators.required],
            phone: ['', Validators.required],
            picture: ['']
        });
    }

    loadCities() {
        this.supabase.getCities().subscribe({
            next: (res) => this.cities = res,
            error: (err) => console.error('Error loading cities:', err)
        });
    }

    loadProjects() {
        this.supabase.getProjects().subscribe({
            next: (res) => this.projects = res,
            error: (err) => console.error('Error loading projects:', err)
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

        this.selectedFile = file;

        const reader = new FileReader();
        reader.onload = () => {
            this.previewUrl = reader.result as string;
        };
        reader.readAsDataURL(file);
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['editData'] && this.editData) {
            setTimeout(() => {
                this.legoForm.patchValue(this.editData!);
                this.previewUrl = this.editData!.picture;
            }, 0);
        } else if (changes['editData'] && !this.editData) {
            this.legoForm.reset();
            this.previewUrl = null;
        }
    }

    async onSubmit(): Promise<void> {
        if (this.legoForm.invalid) return;

        this.isUploading = true;

        try {
            let pictureUrl = this.legoForm.get('picture')?.value;

            if (this.selectedFile) {
                const uploadedUrl = await this.supabase.uploadCharacterAvatar(this.selectedFile);
                if (uploadedUrl) {
                    pictureUrl = uploadedUrl;
                } else {
                    throw new Error("Errore durante l'upload dell'immagine");
                }
            }

            const characterData: LegoCharacter = { ...this.legoForm.value, picture: pictureUrl };

            if (this.editData?.id) {
                this.supabase.editCharacter(this.editData.id, characterData).subscribe({
                    next: () => {
                        this.characterUpdated.emit();
                        this.closeModalAction();
                    },
                    error: (err) => console.error(err)
                });
            } else {
                this.supabase.createCharacter(characterData).subscribe({
                    next: () => {
                        this.characterCreated.emit();
                        this.closeModalAction();
                    },
                    error: (err) => console.error(err)
                });
            }
        } catch (error) {
            alert(error);
        } finally {
            this.isUploading = false;
        }
    }

    closeModalAction() {
        this.selectedFile = null;
        this.previewUrl = null;
        this.closeModal.nativeElement.click();
        this.legoForm.reset();
    }
}
