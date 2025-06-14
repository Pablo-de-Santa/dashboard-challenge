import { Component, OnInit, signal, effect } from '@angular/core';
import { ChartDataService } from '../../services/chart-data.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-area-chart',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './area-chart.component.html',
  styleUrl: './area-chart.component.scss',
})
export class AreaChartComponent {
  selectedRange = signal('last-month');
  areaData = signal<any[]>([]);
  ranges = ['last-month', 'last-quarter', 'last-year', 'custom'];

  constructor(private chartService: ChartDataService) {
    effect(() => {
      const range = this.selectedRange();
    
      this.chartService.getAreaChartData(range).subscribe(data => {
        this.areaData.set(data);
      });
    }, { allowSignalWrites: true });
  }

  updateRange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedRange.set(value);
  }

  getSvgPoints(): string {
    const data = this.areaData();
    if (!data.length) return '';
    const maxY = Math.max(...data.map(d => d.value));
    const width = 600;
    const height = 200;
    const stepX = width / (data.length - 1);

    return data.map((d, i) => {
      const x = i * stepX;
      const y = height - (d.value / maxY) * height;
      return `${x},${y}`;
    }).join(' ');
  }
}
