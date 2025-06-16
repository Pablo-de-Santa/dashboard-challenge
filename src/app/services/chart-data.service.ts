import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ChartDataService {
  constructor(private http: HttpClient) {}

  getAreaChartData(range: string): Observable<any[]> {
    return this.http.get<any[]>(`/assets/data/area/${range}.json`);
  }

  getBarChartDataByRange(range: string): Observable<any[]> {
    return this.http.get<any[]>(`/assets/data/bar/${range}.json`);
  }

  getCustomChartData(range: string): Observable<any[]> {
    return this.http.get<any[]>(`/assets/data/custom/${range}.json`);
  }
}
