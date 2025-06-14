// src/app/services/chart-data.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ChartDataService {
  constructor(private http: HttpClient) {}

  getAreaChartData(range: string): Observable<any[]> {
    return this.http.get<any[]>(`/assets/data/area/${range}.json`);
  }

  getBarChartData(version: number): Observable<any[]> {
    return this.http.get<any[]>(`/assets/data/bar/data-${version}.json`);
  }

  getCustomChartData(version: number): Observable<any[]> {
    return this.http.get<any[]>(`/assets/data/custom/custom-${version}.json`);
  }
}
