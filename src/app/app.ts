import { Component, signal, computed, inject } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router, RouterOutlet } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NavbarComponent } from "./components/navbar/navbar.component";
import { FooterComponent } from "./components/footer/footer.component";
import { LoaderComponent } from './components/loader-component/loader.component';
import { Chart, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

Chart.register(...registerables, ChartDataLabels);

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, FooterComponent, LoaderComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private router = inject(Router);
  private modalService = inject(NgbModal);

  // Signal che tiene traccia dell'URL attivo attuale (stringa vuota all'inizio)
  currentUrl = signal<string | null>(null);
  
  // Loader signal
  isLoading = signal(false);

  // Signal derivato: calcola la visibilità automaticamente. 
  // Finché currentUrl è null (cioè i guard stanno lavorando), restituisce FALSE. Niente più flash!
  showNavFooter = computed(() => {
    const url = this.currentUrl();
    if (!url) return false; 
    return !(url === '/' || url.startsWith('/dashboard'));
  });

  constructor() {
    this.router.events.subscribe((event: any) => {
      
      // Gestione del Loader
      if (event instanceof NavigationStart) {
        this.isLoading.set(true);
      } 
      
      else if (event instanceof NavigationEnd) {
        // Aggiorniamo l'URL solo a navigazione conclusa con successo
        this.currentUrl.set(event.urlAfterRedirects);
        setTimeout(() => this.isLoading.set(false), 150);
      } 
      
      else if (event instanceof NavigationCancel || event instanceof NavigationError) {
        this.isLoading.set(false);
      }
    });
  }

  public open(modal: any): void {
    this.modalService.open(modal);
  }
}