import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-export-data',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './export-data.component.html',
  styleUrls: ['./export-data.component.scss']
})
export class ExportDataComponent {
  @Input() dataCount: number = 0; 
  @Input() isExporting: boolean = false;
  @Input() title: string = 'Export Data';

  @Output() onConfirm = new EventEmitter<'xlsx' | 'pdf'>();

  selectedFormat: 'xlsx' | 'pdf' = 'xlsx';

  confirm() {
    this.onConfirm.emit(this.selectedFormat);
  }
}