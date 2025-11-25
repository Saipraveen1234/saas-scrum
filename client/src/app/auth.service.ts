import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

// TODO: Move these to environment files in a real production app
const SUPABASE_URL = 'https://ftikbxoypwcqlprfwxrf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0aWtieG95cHdjcWxwcmZ3eHJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NTQxMzksImV4cCI6MjA3OTEzMDEzOX0.m6GN1fhcc4EG4jvfqODTzVQj5lf0ra555xAt21zSCvQ';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase: SupabaseClient;
  private _currentUser = new BehaviorSubject<User | null>(null);
  private _userRole = new BehaviorSubject<'admin' | 'employee' | null>(null);
  private _userTeam = new BehaviorSubject<string | null>(null);
  private _userProfile = new BehaviorSubject<any>(null);
  private _loading = new BehaviorSubject<boolean>(true);
  private apiUrl = 'http://localhost:3000/api';

  constructor(private router: Router, private http: HttpClient) {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Initialize session
    this.supabase.auth.getSession().then(({ data: { session } }) => {
      this.updateUser(session);
      this._loading.next(false);
    });

    // Listen for auth changes
    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.updateUser(session);
    });
  }

  get loading$(): Observable<boolean> {
    return this._loading.asObservable();
  }

  get currentUser$(): Observable<User | null> {
    return this._currentUser.asObservable();
  }

  get userRole$(): Observable<'admin' | 'employee' | null> {
    return this._userRole.asObservable();
  }

  get userTeam$(): Observable<string | null> {
    return this._userTeam.asObservable();
  }

  get userProfile$(): Observable<any> {
    return this._userProfile.asObservable();
  }

  get currentUserValue(): User | null {
    return this._currentUser.value;
  }

  get userRoleValue(): 'admin' | 'employee' | null {
    return this._userRole.value;
  }

  async getToken(): Promise<string | null> {
    const { data: { session } } = await this.supabase.auth.getSession();
    return session?.access_token || null;
  }

  private updateUser(session: Session | null) {
    if (session?.user) {
      this._currentUser.next(session.user);
      this.fetchUserRole(session.access_token);
    } else {
      this._currentUser.next(null);
      this._userRole.next(null);
      this._userTeam.next(null);
      this._userProfile.next(null);
    }
  }

  private fetchUserRole(token: string) {
    this.http.get<any>(`${this.apiUrl}/users/me`, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (user) => {
        console.log('[AuthService] Fetched profile:', user);
        this._userRole.next(user.role);
        this._userTeam.next(user.team_name || null);
        this._userProfile.next(user);
      },
      error: (err) => {
        console.error('[AuthService] Failed to fetch profile', err);
        this._userRole.next('employee');
        this._userTeam.next(null);
        this._userProfile.next(null);
      }
    });
  }

  async signUpWithEmail(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
    });
    return { data, error };
  }

  async signInWithPassword(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  }

  async signOut() {
    await this.supabase.auth.signOut();
    this.router.navigate(['/login']);
  }

  // Update Profile
  updateProfile(data: { name: string }): Observable<any> {
    return new Observable(observer => {
      this.getToken().then(token => {
        if (!token) {
          observer.error('No token');
          return;
        }
        this.http.put(`${this.apiUrl}/users/me`, data, {
          headers: { Authorization: `Bearer ${token}` }
        }).subscribe({
          next: (updatedUser: any) => {
            // Refresh profile
            this.fetchUserRole(token);
            observer.next(updatedUser);
            observer.complete();
          },
          error: (err) => observer.error(err)
        });
      });
    });
  }

  // Get Full Profile
  getProfile(): Observable<any> {
    return from(this.getToken()).pipe(
      switchMap(token => {
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        return this.http.get<any>(`${this.apiUrl}/users/me`, { headers });
      })
    );
  }
}
