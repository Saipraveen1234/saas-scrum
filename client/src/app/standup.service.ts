import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Senior Note: We export this interface so other files can use it
export interface Standup {
  id?: string;
  user_name: string;
  yesterday: string;
  today: string;
  blockers: string;
  created_at?: string;
}

@Injectable({
  providedIn: 'root',
})
export class StandupService {
  private http = inject(HttpClient);

  // This points to your Node.js Server
  private apiUrl = 'http://localhost:3000/api';

  // 1. Get List of Updates
  getStandups(): Observable<Standup[]> {
    return this.http.get<Standup[]>(`${this.apiUrl}/standups`);
  }

  // 2. Post a New Update
  postStandup(data: Partial<Standup>): Observable<Standup> {
    return this.http.post<Standup>(`${this.apiUrl}/standups`, data);
  }

  // 3. Call the AI Brain
  generateSummary(): Observable<{ summary: string }> {
    return this.http.post<{ summary: string }>(`${this.apiUrl}/summary`, {});
  }

  // 4. Get Backlog (ClickUp)
  getBacklog(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/backlog`);
  }

  // 5. Groom Task (AI)
  groomTask(task: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/groom`, { task });
  }
}
