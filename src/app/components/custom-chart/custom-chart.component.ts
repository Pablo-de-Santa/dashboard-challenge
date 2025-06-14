// custom-chart.component.ts
import { Component, computed, signal, effect } from '@angular/core';
import { ChartDataService } from '../../services/chart-data.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-custom-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './custom-chart.component.html',
  styleUrl: './custom-chart.component.scss'
})
export class CustomChartComponent {
  data = signal<{ type: string; value: number }[]>([]);

  total = computed(() => this.data().reduce((sum, d) => sum + d.value, 0));

  constructor(private chartService: ChartDataService) {
    effect(() => {
      this.chartService.getCustomChartData(1).subscribe(data => {
        this.data.set(data);
      });
    });
  }

  getPieSlices(): { offset: number; percent: number; color: string; label: string }[] {
    const values = this.data();
    const total = this.total();
    let offset = 0;

    const colors = ['#2196f3', '#4caf50', '#f44336', '#ff9800'];
    return values.map((item, i) => {
      const percent = (item.value / total) * 100;
      const slice = {
        offset,
        percent,
        color: colors[i % colors.length],
        label: `${item.type} — $${item.value.toFixed(2)}`
      };
      offset += percent;
      return slice;
    });
  }
}
