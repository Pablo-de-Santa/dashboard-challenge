import { Component, computed, signal, effect } from '@angular/core';
import { ChartDataService } from '../../services/chart-data.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule, MatSelectChange } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-custom-chart',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatSnackBarModule
  ],
  templateUrl: './custom-chart.component.html',
  styleUrl: './custom-chart.component.scss',
  providers: [ChartDataService]
})
export class CustomChartComponent {
  selectedRange = signal('last-month');
  rawData = signal<{type: string, value: number}[]>([]);
  isFading = signal(false);

  ranges = ['last-month', 'last-quarter', 'last-year', 'custom'];

  constructor(private chartService: ChartDataService, private snackBar: MatSnackBar) {
    effect(() => {
      const range = this.selectedRange();
      this.chartService.getCustomChartData(range).subscribe({
        next: data => this.rawData.set(data),
        error: err => {
          console.error('Error loading pie chart data:', err);
          this.rawData.set([]); // Set empty array on error
        }
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

  // Calculate total for percentage calculations
  totalValue = computed(() => {
    const data = this.rawData();
    return data.reduce((sum, item) => sum + (item?.value || 0), 0);
  });

  // Prepare pie slices data with proper error handling
  pieSlices = computed(() => {
    const data = this.rawData();
    const total = this.totalValue();
    
    // Return empty array if no data or total is 0
    if (data.length === 0 || total === 0) {
      return [];
    }

    let offset = 0;
    return data.map((item, index) => {
      // Ensure item exists and has a valid value
      const value = item?.value || 0;
      const percent = (value / total) * 100;
      
      const slice = {
        offset,
        percent,
        color: this.getSliceColor(index),
        label: `${item?.type || 'Unknown'} — $${value.toFixed(2)} (${percent.toFixed(1)}%)`,
        value: value
      };
      offset += percent;
      return slice;
    });
  });

  // Get color for slice based on index
  private getSliceColor(index: number): string {
    const colors = [
      'rgba(0, 150, 255, 0.85)',  // Blue (matches your all customers color)
      'rgba(255, 235, 0, 0.85)'   // Yellow (matches your loyalty color)
    ];
    return colors[index % colors.length];
  }

  totalAll = computed(() =>
  this.rawData().find(d => d.type === 'All Customers')?.value || 0
);

totalLoyalty = computed(() =>
  this.rawData().find(d => d.type === 'Loyalty Customers')?.value || 0
);

deltaAll = computed(() => {
  const total = this.totalValue();
  const value = this.totalAll();
  return total > 0 ? (value / total) * 100 : 0;
});

deltaLoyalty = computed(() => {
  const total = this.totalValue();
  const value = this.totalLoyalty();
  return total > 0 ? (value / total) * 100 : 0;
});

}