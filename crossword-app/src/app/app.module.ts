import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule }    from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CrosswordComponent } from './crossword/crossword.component';
import { SetFocusDirective } from './set-focus.directive';
import {
    FormsModule
} from '@angular/forms';

@NgModule({
  declarations: [
    AppComponent,
    CrosswordComponent,
    SetFocusDirective
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
