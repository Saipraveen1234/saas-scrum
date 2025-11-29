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
    return from(this.authService.getToken()).pipe(
      switchMap(token => {
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        return this.http.get<any[]>(`${this.apiUrl}/backlog`, { headers });
      })
    );
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

  generateDescription(taskName: string, taskType: string): Observable<{ description: string }> {
    return from(this.authService.getToken()).pipe(
      switchMap(token => {
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        return this.http.post<{ description: string }>(`${this.apiUrl}/ai/generate-description`, { taskName, taskType }, { headers });
      })
    );
  }

  estimateTime(taskName: string, description: string): Observable<{ estimate: string, reasoning: string }> {
    return from(this.authService.getToken()).pipe(
      switchMap(token => {
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        return this.http.post<{ estimate: string, reasoning: string }>(`${this.apiUrl}/ai/estimate-time`, { taskName, description }, { headers });
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
  // 9. Analyze Backlog Item (AI)
  analyzeBacklogItem(taskId: string, name: string, description: string): Observable<any> {
    return from(this.authService.getToken()).pipe(
      switchMap(token => {
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        return this.http.post<any>(`${this.apiUrl}/backlog/analyze`, { taskId, name, description }, { headers });
      })
    );
  }

  // 10. Get Sprint Planning Data
  getSprintPlanningData(): Observable<{ backlog: any[], nextSprint: any[] }> {
    return from(this.authService.getToken()).pipe(
      switchMap(token => {
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        return this.http.get<{ backlog: any[], nextSprint: any[] }>(`${this.apiUrl}/sprint/planning`, { headers });
      })
    );
  }

  // 11. Generate Sprint Goal (AI)
  generateSprintGoal(tasks: any[]): Observable<{ goal: string }> {
    return from(this.authService.getToken()).pipe(
      switchMap(token => {
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        return this.http.post<{ goal: string }>(`${this.apiUrl}/sprint/goal`, { tasks }, { headers });
      })
    );
  }

  // 12. Commit Sprint
  commitSprint(data: any): Observable<any> {
    return from(this.authService.getToken()).pipe(
      switchMap(token => {
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        return this.http.post<any>(`${this.apiUrl}/sprint/commit`, data, { headers });
      })
    );
  }

  // 13. Analyze Retro (AI)
  analyzeRetro(items: string[]): Observable<any> {
    return from(this.authService.getToken()).pipe(
      switchMap(token => {
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        return this.http.post<any>(`${this.apiUrl}/reports/retro-analysis`, { items }, { headers });
      })
    );
  }

  // 14. Post to Slack
  postToSlack(summary: string): Observable<any> {
    return from(this.authService.getToken()).pipe(
      switchMap(token => {
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        return this.http.post<any>(`${this.apiUrl}/standups/slack`, { summary }, { headers });
      })
    );
  }
}
