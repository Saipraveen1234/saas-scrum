import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface Team {
    id: number;
    name: string;
    created_at?: string;
}

export interface UserWithTeam {
    user_id: string;
    email: string;
    name: string;
    role: 'admin' | 'employee';
    team_id: number | null;
    team_name: string | null;
}

@Injectable({
    providedIn: 'root'
})
export class TeamService {
    private http = inject(HttpClient);
    private authService = inject(AuthService);
    private apiUrl = 'http://localhost:3000/api';

    private async getHeaders(): Promise<HttpHeaders> {
        const token = await this.authService.getToken();
        return new HttpHeaders().set('Authorization', `Bearer ${token}`);
    }

    async getTeams(): Promise<Observable<Team[]>> {
        const headers = await this.getHeaders();
        return this.http.get<Team[]>(`${this.apiUrl}/teams`, { headers });
    }

    async createTeam(name: string): Promise<Observable<Team>> {
        const headers = await this.getHeaders();
        return this.http.post<Team>(`${this.apiUrl}/teams`, { name }, { headers });
    }

    async getUsers(): Promise<Observable<UserWithTeam[]>> {
        const headers = await this.getHeaders();
        return this.http.get<UserWithTeam[]>(`${this.apiUrl}/users`, { headers });
    }

    async assignUserToTeam(userId: string, teamId: number): Promise<Observable<any>> {
        const headers = await this.getHeaders();
        return this.http.put(`${this.apiUrl}/users/${userId}/team`, { team_id: teamId }, { headers });
    }
}
