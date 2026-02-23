import { computed, effect, Injectable, signal } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { City } from "../models/characters.model";
import { HttpClient } from "@angular/common/http";
import { environment } from "../environments/environments";

@Injectable({ providedIn: 'root' })
export class CitiesService {
    private apiCities = environment.citiesApiUrl;
    private citiesSignal = signal<City[]>([]);
    readonly allCities = this.citiesSignal.asReadonly();
    readonly loading = signal<boolean>(false);
    searchTerm = signal<string>('');

    filteredCities = computed(() => {
        const term = this.searchTerm().toLowerCase().trim();
        const all = this.citiesSignal();

        if (term.length < 2) return [];

        return all
            .filter(c => c.nome.toLowerCase().includes(term))
            .slice(0, 15);
    });

    constructor(private http: HttpClient) {
        this.loadCities();
    }
    
    private async loadCities() {
        if (this.citiesSignal().length > 0) return;

        this.loading.set(true);
        try {
            const res = await firstValueFrom(this.http.get<City[]>(this.apiCities));
            const mappedCities = res.map(city => ({
                nome: city.nome,
                provincia: { sigla: city.provincia.sigla },
            }));
            
            mappedCities.sort((a, b) => a.nome.localeCompare(b.nome));
            
            this.citiesSignal.set(mappedCities);
        } catch (error) {
            console.error("Error loading cities:", error);
        } finally {
            this.loading.set(false);
        }
    }
}