import { Component, Input, OnChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions, ChartType } from 'chart.js';
import 'chartjs-adapter-date-fns';

@Component({
  selector: 'app-graph',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.scss']
})
export class GraphComponent implements OnChanges {
  @Input() chartLabels: string[] = [];
  @Input() chartData: number[] = [];
  @Input() chartType: ChartType = 'pie';
  @Input() title: string = '';
  @Input() multiDatasets?: any[];
  @Input() options: ChartOptions = {};

  @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;

  public mainChartData: ChartData<ChartType> = {
    labels: [],
    datasets: []
  };

  ngOnChanges(): void {
    this.updateChartData();
  }

  private updateChartData(): void {
    const defaultOptions: ChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: 'bottom' },
        title: { display: !!this.title, text: this.title }
      }
    };

    if (!this.options.scales && this.chartType !== 'pie') {
      defaultOptions.scales = {
        x: { stacked: true },
        y: { stacked: true, beginAtZero: true }
      };
    }

    this.options = { ...defaultOptions, ...this.options };

    if (this.multiDatasets) {
      this.mainChartData = {
        labels: this.chartLabels,
        datasets: this.multiDatasets
      };
    } else {
      this.mainChartData = {
        labels: this.chartLabels,
        datasets: [{
          label: this.title,
          data: this.chartData,
          backgroundColor: this.chartType === 'pie' 
            ? ['#42A5F5', '#FF4081', '#FFCE56', '#4CAF50', '#FFA000'] 
            : '#42A5F5'
        }]
      };
    }
    this.chart?.update();
  }
}