import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, signal, SimpleChanges, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { City, LegoCharacter, Project } from '../../models/characters.model';
import { ReactiveFormsModule } from '@angular/forms'
import { SupabaseService } from '../../supabase/supabase.service';
import { NotificationService, ToastType } from '../../services/notification.service';
import { ToastComponent } from "../toast-component/toast.component";
import { CitiesService } from '../../services/cities.service';

@Component({
    selector: 'app-modal',
    templateUrl: './modal.component.html',
    styleUrls: ['./modal.component.scss'],
    imports: [ReactiveFormsModule, ToastComponent],
})
export class ModalComponent implements OnInit, OnChanges {
    // Character Form
    legoCharacterForm: FormGroup = new FormGroup({});
    successMessage: string | null = null;
    errorMessage: string | null = null;
    @Output() characterCreated = new EventEmitter<void>();
    @Output() characterUpdated = new EventEmitter<void>();
    @Input() editData: LegoCharacter | null = null;

    @ViewChild('closeModal') closeModal!: ElementRef;

    projects: Project[] = [];
    selectedFile: File | null = null;
    previewUrl: string | null = null;
    isUploading = false;

    // Project Form
    legoProjectForm: FormGroup = new FormGroup({});
    @Input() editProject: Project | null = null;
    @Output() projectCreated = new EventEmitter<void>();
    @Output() projectUpdated = new EventEmitter<void>();
    @Input() showProjectForm: boolean = false;

    allCharacters: LegoCharacter[] = [];
    @Input() currentMembersIds: string[] = [];

    //Cities
    cities: City[] = [];
    showSuggestions = signal<boolean>(false);

    constructor(
        private fb: FormBuilder, 
        private supabase: SupabaseService, 
        private cdr: ChangeDetectorRef, 
        private notify: NotificationService, 
        public citiesService: CitiesService
    ) {
        this.initForm();

        this.legoCharacterForm.get('city_name')?.valueChanges.subscribe(val => {
            this.citiesService.searchTerm.set(val || '');
        });
    }

    ngOnInit(): void {
        this.loadCities();
        this.loadProjects();
        this.loadAllCharacters();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['editData'] && this.editData) {
            this.legoCharacterForm.patchValue(this.editData);
            this.previewUrl = this.editData.picture;
        }

        if (this.showProjectForm && (changes['editProject'] || changes['currentMembersIds'])) {
            if (this.editProject && !this.legoProjectForm.dirty) {
                this.legoProjectForm.patchValue({
                    name: this.editProject.name,
                    description: this.editProject.description,
                    start_date: this.editProject.start_date,
                    end_date: this.editProject.end_date,
                    member_ids: [...(this.currentMembersIds || [])]
                }, { emitEvent: false });
            }
        }
    }

    initForm() {
        this.legoCharacterForm = this.fb.group({
            name: ['', Validators.required],
            lastname: ['', Validators.required],
            gender: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            city_name: ['', Validators.required],
            project_id: ['', Validators.required],
            phone: ['', Validators.required],
            picture: ['']
        });

        this.legoProjectForm = this.fb.group({
            name: ['', Validators.required],
            description: ['', Validators.required],
            start_date: ['', Validators.required],
            end_date: [null],
            member_ids: [[]]
        });

    }

    loadCities() {
        this.citiesService.allCities();
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
            this.notify.show("Please upload a valid image (JPEG, PNG, or WebP).", ToastType.ERROR);
            return;
        }

        if (file.size > 15 * 1024 * 1024) {
            this.notify.show("Image size should be less than 15MB.", ToastType.ERROR);
            return;
        }

        this.selectedFile = file;

        const reader = new FileReader();
        reader.onload = () => {
            this.previewUrl = reader.result as string;
        };
        reader.readAsDataURL(file);
    }

    async onCharacterSubmit(): Promise<void> {
        if (this.legoCharacterForm.invalid) return;
        this.isUploading = true;

        try {
            let pictureUrl = this.legoCharacterForm.get('picture')?.value;
            if (this.selectedFile) {
                const uploadedUrl = await this.supabase.uploadCharacterAvatar(this.selectedFile);
                if (uploadedUrl) {
                    pictureUrl = uploadedUrl;
                } else {
                    throw new Error("Errore durante l'upload dell'immagine");
                }
            }

            const characterData: LegoCharacter = { ...this.legoCharacterForm.value, picture: pictureUrl };

            if (this.editData?.id) {
                this.supabase.editCharacter(this.editData.id, characterData).subscribe({
                    next: () => {
                        this.characterUpdated.emit();
                        this.closeModalAction();
                        this.notify.show("Character updated successfully", ToastType.SUCCESS);
                    },
                    error: (err) => console.error(err)
                });
            } else {
                this.supabase.createCharacter(characterData).subscribe({
                    next: () => {
                        this.characterCreated.emit();
                        this.closeModalAction();
                        this.notify.show("Character created successfully", ToastType.SUCCESS);
                    },
                    error: (err) => console.error(err)
                });
            }
        } catch (error) {
            console.error(error);
            this.notify.show("An error occurred. Please try again.", ToastType.ERROR);
        } finally {
            this.isUploading = false;
        }
    }

    async onProjectSubmit(): Promise<void> {
        if (this.legoProjectForm.invalid) return;
        this.isUploading = true;

        try {
            const { member_ids, ...projectData } = this.legoProjectForm.value;

            if (!projectData.end_date) projectData.end_date = null;

            if (this.editProject?.id) {
                this.supabase.editProject(this.editProject.id, projectData).subscribe({
                    next: async () => {
                        await this.updateProjectMembers(this.editProject!.id!, member_ids);
                    },
                    error: (err) => this.handleError(err)
                });
            } else {
                this.supabase.createProject(projectData).subscribe({
                    next: async (res: any) => {
                        const newId = res.data?.[0]?.id;
                        if (newId) await this.updateProjectMembers(newId, member_ids);
                    },
                    error: (err) => this.handleError(err)
                });
            }
        } catch (error) {
            this.handleError(error);
        }
    }

    private async updateProjectMembers(projectId: string, memberIds: string[]) {
        try {
            await this.supabase.assignMembersToProject(projectId, memberIds);
            this.projectUpdated.emit();
            this.closeModalAction();
        } catch (error) {
            this.handleError(error);
        } finally {
            this.isUploading = false;
        }
    }

    private handleError(err: any) {
        console.error(err);
        this.errorMessage = "An error occurred. Please try again.";
        this.isUploading = false;
    }

    loadAllCharacters() {
        this.supabase.getCharacters().subscribe(res => {
            this.allCharacters = res;
            this.cdr.detectChanges();
        });
    }

    toggleMember(id: string, event: any) {
        const isChecked = event.target.checked;
        const control = this.legoProjectForm.get('member_ids');
        const currentIds = [...(control?.value || [])];

        if (isChecked) {
            if (!currentIds.includes(id)) currentIds.push(id);
        } else {
            const index = currentIds.indexOf(id);
            if (index > -1) currentIds.splice(index, 1);
        }

        control?.setValue(currentIds);
        control?.markAsDirty();
        this.cdr.detectChanges();
    }

    closeModalAction() {
        (document.activeElement as HTMLElement)?.blur();
        if (this.closeModal) {
            this.closeModal.nativeElement.click();
        }

        this.selectedFile = null;
        this.previewUrl = null;
        if (this.legoCharacterForm) this.legoCharacterForm.reset();
        if (this.legoProjectForm) this.legoProjectForm.reset({ member_ids: [] });
        this.errorMessage = null;
        this.successMessage = null;
        this.isUploading = false;
        this.cdr.detectChanges();
    }

    selectCity(city: City) {
        const cityNameWithProv = `${city.nome} (${city.provincia.sigla})`;
        this.legoCharacterForm.get('city_name')?.setValue(cityNameWithProv, { emitEvent: false });
        this.showSuggestions.set(false);
        this.citiesService.searchTerm.set('');
    }
}
