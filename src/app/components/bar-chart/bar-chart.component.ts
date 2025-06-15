import {
  Component,
  computed,
  signal,
  effect,
} from '@angular/core';
import { ChartDataService } from '../../services/chart-data.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule, MatSelectChange } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-bar-chart',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatSnackBarModule
  ],
  templateUrl: './bar-chart.component.html',
  styleUrl: './bar-chart.component.scss',
  providers: [ChartDataService]
})
export class BarChartComponent {
  selectedRange = signal('last-month');
  rawData = signal<any[]>([]);
  zoomLevel = signal(1);
  isFading = signal(false);

  ranges = ['last-month', 'last-quarter', 'last-year', 'custom'];

  chartHeight = 200;

  shouldAnimateBars = signal(false);


  constructor(private chartService: ChartDataService, private snackBar: MatSnackBar) {
    effect(() => {
      const range = this.selectedRange();
      this.chartService.getBarChartDataByRange(range).subscribe(data => {
        this.rawData.set(data);
      });
    });
  }

  updateRange(event: MatSelectChange) {
    this.isFading.set(true);
    setTimeout(() => {
      this.selectedRange.set(event.value);
      this.isFading.set(false);
    }, 300);
  }

  visibleData = computed(() => {
    const data = this.rawData();
    const zoom = this.zoomLevel();
    const visibleCount = Math.floor(data.length / zoom);
    return data.slice(Math.max(0, data.length - visibleCount));
  });

  scaledMaxValue = computed(() => {
    const values = this.visibleData().flatMap(d => [d.all, d.loyalty]);
    const max = Math.max(...values, 1);
    return max / this.zoomLevel();
  });

  yTicks = computed(() => {
    const step = Math.ceil(this.scaledMaxValue() / 4);
    return Array.from({ length: 5 }, (_, i) => step * i).reverse();
  });

  xLabels = computed(() => {
    const visible = this.visibleData();
    const maxLabels = 6;
    const count = Math.max(2, Math.floor(maxLabels * this.zoomLevel()));
    if (visible.length < 2) return [];

    const lastIndex = visible.length - 1;
    return Array.from({ length: count }, (_, i) => {
      const index = Math.floor(i * lastIndex / (count - 1));
      return new Date(visible[index]?.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    });
  });

  private triggerBarAnimation() {
    this.shouldAnimateBars.set(false); // reset
    requestAnimationFrame(() => {
      this.shouldAnimateBars.set(true);
    });
  }
  
  zoomIn() {
    if (this.zoomLevel() >= 1) {
      this.snackBar.open('Chart is fully visible – cannot zoom in further.', 'Close', { duration: 3000 });
      return;
    }
    this.triggerBarAnimation();
    this.zoomLevel.set(Math.min(this.zoomLevel() + 0.25, 3));
  }
  
  zoomOut() {
    if (this.zoomLevel() <= 0.25) {
      this.snackBar.open('Minimum zoom level reached – cannot zoom out further.', 'Close', { duration: 3000 });
      return;
    }
    this.triggerBarAnimation();
    this.zoomLevel.set(Math.max(this.zoomLevel() - 0.25, 0.25));
  }
  
  resetZoom() {
    this.triggerBarAnimation();
    this.zoomLevel.set(1);
  }

  totalAll = computed(() =>
  this.visibleData().reduce((sum, d) => sum + d.all, 0)
);

totalLoyalty = computed(() =>
  this.visibleData().reduce((sum, d) => sum + d.loyalty, 0)
);

deltaAll = computed(() => {
  const data = this.visibleData();
  if (data.length < 2) return 0;

  const mid = Math.floor(data.length / 2);
  const prev = data.slice(0, mid).reduce((sum, d) => sum + d.all, 0);
  const curr = data.slice(mid).reduce((sum, d) => sum + d.all, 0);

  return prev ? ((curr - prev) / prev) * 100 : 0;
});

deltaLoyalty = computed(() => {
  const data = this.visibleData();
  if (data.length < 2) return 0;

  const mid = Math.floor(data.length / 2);
  const prev = data.slice(0, mid).reduce((sum, d) => sum + d.loyalty, 0);
  const curr = data.slice(mid).reduce((sum, d) => sum + d.loyalty, 0);

  return prev ? ((curr - prev) / prev) * 100 : 0;
});
}