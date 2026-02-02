import { Injectable, signal } from "@angular/core";
import { SupabaseClientService } from "./supabase.client";
import { City } from "../models/characters.model";

@Injectable({ providedIn: 'root' })
export class CitiesService {
    private citiesSignal = signal<City[]>([]);

    constructor(private supabaseClient: SupabaseClientService) { }

    // ================= GET CITIES =================
    async loadCities(): Promise<City[]> {
        if (this.citiesSignal().length) {
            return this.citiesSignal();
        }

        try {
            const { data, error } = await this.supabaseClient.supabase
                .from("cities")
                .select("*")
                .order("name");

            if (error) throw error;

            const cities = data || [];
            this.citiesSignal.set(cities);
            return cities;
        } catch (err) {
            console.error("Errore fetching cities:", err);
            this.citiesSignal.set([]);
            return [];
        }
    }

    // ================= SIGNAL ACCESSOR =================
    get cities(): City[] {
        return this.citiesSignal();
    }

    // ================= FOR COMPONENTS (OPTIONAL RXJS) =================
    get cities$() {
        return this.citiesSignal.asReadonly();
    }
}
