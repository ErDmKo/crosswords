import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CrosswordComponent } from './crossword/crossword.component';

const routes: Routes = [{
    path: '', component: CrosswordComponent
}];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
