import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';

// TODO: Move these to environment files in a real production app
const SUPABASE_URL = 'https://ftikbxoypwcqlprfwxrf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0aWtieG95cHdjcWxwcmZ3eHJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NTQxMzksImV4cCI6MjA3OTEzMDEzOX0.m6GN1fhcc4EG4jvfqODTzVQj5lf0ra555xAt21zSCvQ';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase: SupabaseClient;
  private _currentUser = new BehaviorSubject<User | null>(null);
  
  constructor(private router: Router) {
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

  get currentUserValue(): User | null {
    return this._currentUser.value;
  }

  private updateUser(session: Session | null) {
    if (session?.user) {
      this._currentUser.next(session.user);
    } else {
      this._currentUser.next(null);
    }
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
