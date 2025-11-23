import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';
import { map, take, filter, switchMap } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.loading$.pipe(
    filter(loading => !loading),
    take(1),
    switchMap(() => authService.currentUser$),
    take(1),
    map(user => {
      if (user) {
        return true;
      } else {
        return router.createUrlTree(['/login']);
      }
    })
  );
};
