import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

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
  
  constructor(private router: Router, private http: HttpClient) {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Initialize session
    this.supabase.auth.getSession().then(({ data: { session } }) => {
      this.updateUser(session);
    });

    // Listen for auth changes
    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.updateUser(session);
    });
  }

  get currentUser$(): Observable<User | null> {
    return this._currentUser.asObservable();
  }

  get userRole$(): Observable<'admin' | 'employee' | null> {
    return this._userRole.asObservable();
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
    }
  }

  private fetchUserRole(token: string) {
    this.http.get<any>('http://localhost:3000/api/users/me', {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (user) => {
        console.log('[AuthService] Fetched role:', user.role);
        this._userRole.next(user.role);
      },
      error: (err) => {
        console.error('[AuthService] Failed to fetch role', err);
        // Default to employee if failed? Or null?
        this._userRole.next('employee'); 
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
}
