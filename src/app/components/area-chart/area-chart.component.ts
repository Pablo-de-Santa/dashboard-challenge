import { Component, signal, effect, computed, ViewChild, ElementRef } from '@angular/core';
import { ChartDataService } from '../../services/chart-data.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-area-chart',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule
  ],
  templateUrl: './area-chart.component.html',
  styleUrl: './area-chart.component.scss',
  providers: [ChartDataService]
})
export class AreaChartComponent {
  selectedRange = signal('last-month');
  areaData = signal<any[]>([]);
  ranges = ['last-month', 'last-quarter', 'last-year', 'custom'];

  @ViewChild('clipRect', { static: true }) clipRect!: ElementRef<SVGRectElement>;

  zoomLevel = signal(1); // default 1x zoom
  isDragging = false;
  startX = 0;
  scrollLeft = 0;
  isFading = signal(false);
  shouldAnimatePath = signal(false);

  constructor(private chartService: ChartDataService, private snackBar: MatSnackBar) {
    effect(() => {
      this.chartService.getAreaChartData(this.selectedRange()).subscribe(data => {
        this.areaData.set(data);
      });
    });
  }

  updateRange(event: MatSelectChange) {
    this.isFading.set(true);
    this.shouldAnimatePath.set(false); // Reset path animation
  
    setTimeout(() => {
      this.selectedRange.set(event.value);
  
      // Delay reactivation of animation until new path is rendered
        this.isFading.set(false);
        this.shouldAnimatePath.set(true);
      }, 300); // match fade-in delay
  }

  yTicks = computed(() => {
    const data = this.areaData();
    const allValues = data.map(d => d.all);
    const loyaltyValues = data.map(d => d.loyalty);
    const values = allValues.concat(loyaltyValues);
  
    const max = Math.max(...values, 0);
    const scaledMax = max / this.zoomLevel();
  
    const step = Math.ceil(scaledMax / 4);
    return Array.from({ length: 5 }, (_, i) => step * i).reverse();
  });
  
  xLabels = computed(() => {
    const zoom = this.zoomLevel();
    const rawData = this.areaData();
    if (!rawData.length) return [];
  
    const total = rawData.length;
    const visibleCount = Math.floor(total / zoom);
    const visibleData = rawData.slice(Math.max(0, total - visibleCount));
  
    // 👇 Dynamically decrease label count as you zoom out
    const maxLabels = 6;
    const labelCount = Math.max(2, Math.floor(maxLabels * this.zoomLevel()));
    // zoom 1 → 6 labels; zoom 0.75 → 5; zoom 0.5 → 4; zoom 0.25 → 3; etc.
  
    if (visibleData.length < 2) return [];
  
    const lastIndex = visibleData.length - 1;
    return Array.from({ length: labelCount }, (_, i) => {
      const index = Math.floor(i * lastIndex / (labelCount - 1));
      const date = new Date(visibleData[index]?.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
  });
  

  svgPath = computed(() => {
    const data = this.areaData();
    if (!data.length) return { all: '', loyalty: '' };
  
    const zoom = this.zoomLevel();
    const total = data.length;
    const visibleCount = Math.floor(total / zoom);
    const visibleData = data.slice(Math.max(0, total - visibleCount));
  
    const maxY = Math.max(
      ...visibleData.flatMap(d => [d.all, d.loyalty])
    );
    const width = 600;
    const height = 300;
    const stepX = width / (visibleData.length - 1);
  
    const createPath = (key: 'all' | 'loyalty') => {
      const points = visibleData.map((d, i) => {
        const x = i * stepX;
        const y = height - (d[key] / maxY) * height * zoom;
        return [x, y];
      });
  
      let d = `M ${points[0][0]} ${points[0][1]}`;
      for (let i = 1; i < points.length; i++) {
        d += ` L ${points[i][0]} ${points[i][1]}`;
      }
      d += ` L ${points[points.length - 1][0]} ${height} L 0 ${height} Z`;
      return d;
    };
  
    return {
      all: createPath('all'),
      loyalty: createPath('loyalty'),
    };
  });  

  zoomIn() {
    if (this.zoomLevel() === 1) {
      this.snackBar.open('Chart is fully visible – cannot zoom in further.', 'Close', {
        duration: 3000
      });
      return;
    }
  
    if ('startViewTransition' in document) {
      (document as any).startViewTransition(() => {
        this.zoomLevel.set(Math.min(this.zoomLevel() + 0.25, 3));
      });
    } else {
      this.zoomLevel.set(Math.min(this.zoomLevel() + 0.25, 3));
    }
  }

  zoomOut() {
    if (this.zoomLevel() === 0.25) {
      this.snackBar.open('Minimum zoom level reached – cannot zoom out further.', 'Close', {
        duration: 3000
      });
      return;
    }

    this.zoomLevel.set(Math.max(this.zoomLevel() - 0.25, 0.25));
  }

  resetZoom() {
    this.zoomLevel.set(1);
  }
  
  totalAll = computed(() =>
    this.areaData().reduce((sum, d) => sum + d.all, 0)
  );

  totalLoyalty = computed(() =>
    this.areaData().reduce((sum, d) => sum + d.loyalty, 0)
  );

  private getVisibleData(): any[] {
    const data = this.areaData();
    const zoom = this.zoomLevel();
    const visibleCount = Math.floor(data.length / zoom);
    return data.slice(Math.max(0, data.length - visibleCount));
  }

  deltaAll = computed(() => {
    const visibleData = this.getVisibleData();
    if (visibleData.length < 2) return 0;
  
    const midpoint = Math.floor(visibleData.length / 2);
    const previous = visibleData.slice(0, midpoint);
    const current = visibleData.slice(midpoint);
  
    const previousTotal = previous.reduce((sum, d) => sum + d.all, 0);
    const currentTotal = current.reduce((sum, d) => sum + d.all, 0);
  
    return previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0;
  });
  
  deltaLoyalty = computed(() => {
    const visibleData = this.getVisibleData();
    if (visibleData.length < 2) return 0;
  
    const midpoint = Math.floor(visibleData.length / 2);
    const previous = visibleData.slice(0, midpoint);
    const current = visibleData.slice(midpoint);
  
    const previousTotal = previous.reduce((sum, d) => sum + d.loyalty, 0);
    const currentTotal = current.reduce((sum, d) => sum + d.loyalty, 0);
  
    return previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0;
  });
  
}