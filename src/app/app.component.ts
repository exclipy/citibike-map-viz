import {BreakpointObserver} from '@angular/cdk/layout';
import {Component} from '@angular/core';
import {MatSliderChange} from '@angular/material/slider';
import {scale} from 'chroma-js';
import * as L from 'leaflet';
import {flatMap} from 'lodash';
import * as moment from 'moment-timezone';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import * as StationData from '../station_data';
import * as StationInformation from '../station_information';

interface DataSource {
  url: string;
  timeFormatter: (scrapeTime: string) => string;
}

const directDataSource: DataSource = {
  url: 'https://citibike-analysis-results.storage.googleapis.com/data.json',
  timeFormatter: timestamp =>
    moment
      .unix(+timestamp)
      .tz('America/New_York')
      .format('hA, ddd MMM D YYYY'),
};

const averageWeekdayDataSource: DataSource = {
  url: 'https://citibike-analysis-results.storage.googleapis.com/data_average_weekday.json',
  timeFormatter: time =>
    moment(time, 'HH:mm')
      .subtract(4, 'hours')
      .format('HH:mm'),
};

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  options = {
    layers: [
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        opacity: 0.6,
      }),
    ],
    zoom: 14,
    center: L.latLng(40.7583757, -73.9736025),
  };
  layers = [] as L.Circle[];
  slices = [] as L.Circle[][];
  times = [] as string[];
  sliderValue = 0;
  sliderMax = 0;
  displayedTime = '';
  isWidescreen$: Observable<boolean>;

  constructor(private breakpointObserver: BreakpointObserver) {
    this.fetchStations(directDataSource);
    this.isWidescreen$ = this.breakpointObserver
      .observe(['(min-width: 700px)'])
      .pipe(map(state => state.matches));
  }

  onSlide(e: MatSliderChange) {
    this.handleSlide(e.value);
  }

  handleSlide(value: number) {
    this.layers = this.slices[this.sliderMax - value];
    this.displayedTime = this.times[this.sliderMax - value];
  }

  async fetchStations(dataSource: DataSource) {
    const info = await this.fetchJson<StationInformation.StationInformation>(
      'assets/station_information.json',
    );
    const data = await this.fetchJson<StationData.StationData>(dataSource.url);
    if (!data.length) {
      return;
    }
    const stationMap = new Map(info.data.stations.map(station => [station.station_id, station]));

    this.slices = data.map(d => this.toCircles(d.data, stationMap));
    this.times = data.map(d => dataSource.timeFormatter(d.scrape_time));
    this.sliderMax = data.length - 1;
    this.sliderValue = this.sliderMax;
    this.handleSlide(this.sliderValue);
  }

  private toCircles(
    latestStations: StationData.Station[],
    stationMap: Map<string, StationInformation.Station>,
  ) {
    const joinedLatestStations = flatMap(latestStations, (station: StationData.Station) => {
      const stationInfo = stationMap.get(station.station_id);
      if (stationInfo) {
        return [
          {
            ...station,
            lat: stationInfo.lat,
            lon: stationInfo.lon,
          },
        ];
      } else {
        return [];
      }
    });
    const colorScale = scale(['red', 'yellow', 'green']);
    const circles = joinedLatestStations.map(station => {
      const l =
        station.num_bikes_available / (station.num_bikes_available + station.num_docks_available);
      const color = colorScale(l).hex();
      return L.circle([station.lat, station.lon], {
        radius: 40,
        fillOpacity: 1,
        fillColor: color,
        stroke: false,
      });
    });
    return circles;
  }

  private async fetchJson<T>(url: string) {
    const stationsResponse = await fetch(url, {cache: 'no-store'});
    const stationsJson = await stationsResponse.text();
    const info = JSON.parse(stationsJson) as T;
    return info;
  }
}
