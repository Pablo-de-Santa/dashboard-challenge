// bar-chart.component.ts
import { Component, signal, computed, effect } from '@angular/core';
import { ChartDataService } from '../../services/chart-data.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-bar-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bar-chart.component.html',
  styleUrl: './bar-chart.component.scss'
})
export class BarChartComponent {
  data = signal<any[]>([]);

  max = computed(() => {
    const values = this.data().map(d => d.value);
    return values.length ? Math.max(...values) : 1;
  });

  constructor(private chartService: ChartDataService) {
    effect(() => {
      this.chartService.getBarChartData(1).subscribe(data => {
        this.data.set(data);
      });
    });
  }
}
