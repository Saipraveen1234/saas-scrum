import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, switchMap } from 'rxjs';
import { AuthService } from './auth.service';

// Senior Note: We export this interface so other files can use it
export interface Standup {
  id?: string;
  user_name: string;
  yesterday: string;
  today: string;
  blockers: string;
  created_at?: string;
  team_name?: string;
}

@Injectable({
  providedIn: 'root',
})
export class StandupService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  // This points to your Node.js Server
  private apiUrl = 'http://localhost:3000/api';

  // 1. Get List of Updates
  getStandups(): Observable<Standup[]> {
    return from(this.authService.getToken()).pipe(
      switchMap(token => {
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        return this.http.get<Standup[]>(`${this.apiUrl}/standups`, { headers });
      })
    );
  }

  // 2. Post a New Update
  postStandup(data: Partial<Standup>): Observable<Standup> {
    return from(this.authService.getToken()).pipe(
      switchMap(token => {
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        return this.http.post<Standup>(`${this.apiUrl}/standups`, data, { headers });
      })
    );
  }

  // 3. Call the AI Brain
  generateSummary(date?: string): Observable<{ summary: string }> {
    return from(this.authService.getToken()).pipe(
      switchMap(token => {
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        return this.http.post<{ summary: string }>(`${this.apiUrl}/summary`, { date }, { headers });
      })
    );
  }

  // 4. Get Backlog (ClickUp)
  getBacklog(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/backlog`);
  }

  // 5. Groom Task (AI)
  groomTask(task: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/groom`, { task });
  }

  // 6. Get Team Count
  getTeamCount(): Observable<{ count: number }> {
    return from(this.authService.getToken()).pipe(
      switchMap(token => {
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        return this.http.get<{ count: number }>(`${this.apiUrl}/users/count`, { headers });
      })
    );
  }

  // 7. Get My Tasks (ClickUp)
  getTasks(all: boolean = false): Observable<any[]> {
    return from(this.authService.getToken()).pipe(
      switchMap(token => {
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        const url = all ? `${this.apiUrl}/tasks?all=true` : `${this.apiUrl}/tasks`;
        return this.http.get<any[]>(url, { headers });
      })
    );
  }

  updateTaskStatus(taskId: string, status: string): Observable<any> {
    return from(this.authService.getToken()).pipe(
      switchMap(token => {
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        return this.http.put<any>(`${this.apiUrl}/tasks/${taskId}/status`, { status }, { headers });
      })
    );
  }

  // --- Sprint Metrics ---

  getSprintCurrent(): Observable<any> {
    return from(this.authService.getToken()).pipe(
      switchMap(token => {
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        return this.http.get<any>(`${this.apiUrl}/sprint/current`, { headers });
      })
    );
  }

  getSprintBurnup(): Observable<any[]> {
    return from(this.authService.getToken()).pipe(
      switchMap(token => {
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        return this.http.get<any[]>(`${this.apiUrl}/sprint/burnup`, { headers });
      })
    );
  }

  getSprintRisk(): Observable<any> {
    return from(this.authService.getToken()).pipe(
      switchMap(token => {
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        return this.http.get<any>(`${this.apiUrl}/sprint/risk`, { headers });
      })
    );
  }

  analyzeSprintRisk(): Observable<any> {
    return from(this.authService.getToken()).pipe(
      switchMap(token => {
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        return this.http.post<any>(`${this.apiUrl}/sprint/analyze-risk`, {}, { headers });
      })
    );
  }

  getSprintVelocity(): Observable<any[]> {
    return from(this.authService.getToken()).pipe(
      switchMap(token => {
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        return this.http.get<any[]>(`${this.apiUrl}/sprint/velocity`, { headers });
      })
    );
  }

  // 8. Chat with AI
  sendChatMessage(message: string): Observable<{ response: string }> {
    return from(this.authService.getToken()).pipe(
      switchMap(token => {
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        return this.http.post<{ response: string }>(`${this.apiUrl}/chat`, { message }, { headers });
      })
    );
  }
}
