import {NgModule} from '@angular/core';
import {MatSliderModule} from '@angular/material/slider';
import {MatToolbarModule} from '@angular/material/toolbar';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {LeafletModule} from '@asymmetrik/ngx-leaflet';
import {AppComponent} from './app.component';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    LeafletModule.forRoot(),
    BrowserAnimationsModule,
    MatSliderModule,
    MatToolbarModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
