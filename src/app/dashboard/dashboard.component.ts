import { Component } from '@angular/core';
import { AreaChartComponent } from '../components/area-chart/area-chart.component';
import { BarChartComponent } from '../components/bar-chart/bar-chart.component';
import { CustomChartComponent } from '../components/custom-chart/custom-chart.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    AreaChartComponent,
    BarChartComponent,
    CustomChartComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {

}
