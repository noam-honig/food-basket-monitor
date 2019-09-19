import { RadWebModule, NotSignedInGuard, SignedInGuard } from 'radweb';
import { NgModule } from '@angular/core';
import { Routes, RouterModule, Route, ActivatedRouteSnapshot } from '@angular/router';
import { HomeComponent } from './home/home.component';

import { RegisterComponent } from './users/register/register.component';
import { UpdateInfoComponent } from './users/update-info/update-info.component';

import { UsersComponent } from './users/users.component';
import { Roles, AdminGuard } from './users/roles';


const routes: Routes = [
  { path: 'Home', component: HomeComponent,data: { name: "בית" }  },
  { path: 'User Accounts', component: UsersComponent, canActivate: [AdminGuard], data: { name: "משתמשים" } },

  { path: 'Register', component: RegisterComponent, canActivate: [NotSignedInGuard] , data: { name: "הרשם" } },
  { path: 'Account Info', component: UpdateInfoComponent, canActivate: [SignedInGuard], data: { name: "עדכון פרטים" }  },
  { path: '', redirectTo: '/Home', pathMatch: 'full' },
  { path: '**', redirectTo: '/Home', pathMatch: 'full' }

];

@NgModule({
  imports: [RouterModule.forRoot(routes), RadWebModule],
  providers: [AdminGuard],
  exports: [RouterModule]
})
export class AppRoutingModule { }

