import { Component, signal, effect, computed, ViewChild, ElementRef } from '@angular/core';
import { ChartDataService } from '../../services/chart-data.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-area-chart',
  standalone: true,
  imports: [FormsModule, CommonModule, MatSnackBarModule],
  templateUrl: './area-chart.component.html',
  styleUrl: './area-chart.component.scss'
})
export class AreaChartComponent {
  selectedRange = signal('last-month');
  areaData = signal<any[]>([]);
  ranges = ['last-month', 'last-quarter', 'last-year', 'custom'];
  zoomLevel = signal(1); // default 1x zoom

  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;

  isDragging = false;
  startX = 0;
  scrollLeft = 0;

  constructor(private chartService: ChartDataService, private snackBar: MatSnackBar) {
    effect(() => {
      this.chartService.getAreaChartData(this.selectedRange()).subscribe(data => {
        this.areaData.set(data);
      });
    });
  }

  updateRange(event: Event) {
    this.selectedRange.set((event.target as HTMLSelectElement).value);
  }

  yTicks = computed(() => {
    const values = this.areaData().map(d => d.value);
    const max = Math.max(...values, 0);
    const step = Math.ceil(max / 4); // 4 ticks
    return Array.from({ length: 5 }, (_, i) => step * i).reverse(); // Top to bottom
  });
  
  xLabels = computed(() => {
    const dates = this.areaData().map(d => new Date(d.date));
    if (!dates.length) return [];
  
    const total = dates.length;
    const intervals = 5; // 6 labels
  
    return Array.from({ length: intervals + 1 }, (_, i) => {
      const index = Math.floor(i * (total - 1) / intervals);
      return dates[index].toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
  });

  svgPath = computed(() => {
    const data = this.areaData();
    if (!data.length) return '';
    const maxY = Math.max(...data.map(d => d.value));
    const width = 600;
    const height = 200;

    const stepX = (width / (data.length - 1)) * this.zoomLevel();
    const points = data.map((d, i) => {
      const x = i * stepX;
      const y = height - (d.value / maxY) * height * this.zoomLevel(); // zoom Y as well
      return [x, y];
    });

    let d = `M ${points[0][0]} ${points[0][1]}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i][0]} ${points[i][1]}`;
    }

    // Close the area path
    const lastX = points[points.length - 1][0];
    d += ` L ${lastX} ${height} L 0 ${height} Z`;

    return d;
  });

  zoomIn() {
    const currentZoom = this.zoomLevel();
    const maxZoom = 3;
  
    // Prevent zooming in if it would exceed the chart width
    if (currentZoom >= maxZoom || this.isChartFullyVisible()) {
      this.snackBar.open('Chart is fully visible – cannot zoom in further.', 'Close', {
        duration: 3000
      });
      return;
    }
  
    this.zoomLevel.set(Math.min(currentZoom + 0.25, maxZoom));
  }

  zoomOut() {
    this.zoomLevel.set(Math.max(this.zoomLevel() - 0.25, 0.5));
  }

  resetZoom() {
    this.zoomLevel.set(1);
  }
  
  isChartFullyVisible(): boolean {
    const dataLength = this.areaData().length;
    const stepX = (600 / (dataLength - 1)) * this.zoomLevel(); // base width
    const totalWidth = stepX * (dataLength - 1);
  
    const containerWidth = this.scrollContainer?.nativeElement.offsetWidth || 600;
  
    return totalWidth <= containerWidth;
  }
}
