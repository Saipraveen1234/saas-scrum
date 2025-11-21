import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';

// TODO: Move these to environment files in a real production app
const SUPABASE_URL = 'https://ftikbxoypwcqlprfwxrf.supabase.co';
const SUPABASE_ANON_KEY = 'sb_secret_DCIdkdkSc8rjdal8muo4Ug_LZqPRlHd';

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

  async signInWithEmail(email: string) {
    const { error } = await this.supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin
      }
    });
    return { error };
  }

  async signOut() {
    await this.supabase.auth.signOut();
    this.router.navigate(['/login']);
  }
}
