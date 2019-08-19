import {Component, EventEmitter} from '@angular/core';
import {scale} from 'chroma-js';
import * as L from 'leaflet';
import {flatMap} from 'lodash';
import * as StationData from '../station_data';
import * as StationInformation from '../station_information';
import {MatSliderChange} from '@angular/material/slider';
import * as moment from 'moment-timezone';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  options = {
    layers: [
      L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        opacity: 0.6,
      }),
    ],
    zoom: 14,
    center: L.latLng(40.7583757, -73.9736026),
  };
  layers = [] as L.Circle[];
  slices = [] as L.Circle[][];
  times = [] as string[];
  sliderMax = 0;
  displayedTime = '';

  constructor() {
    this.fetchStations();
  }

  onSlide(e: MatSliderChange) {
    this.handleSlide(e.value);
  }

  handleSlide(value: number) {
    this.layers = this.slices[value];
    this.displayedTime = this.times[value];
  }

  async fetchStations() {
    const info = await this.fetchJson<StationInformation.StationInformation>(
      'assets/station_information.json',
    );
    const data = await this.fetchJson<StationData.StationData>('assets/data.json');
    if (!data.length) {
      return;
    }
    this.sliderMax = data.length - 1;
    const stationMap = new Map(info.data.stations.map(station => [station.station_id, station]));

    this.slices = data.map(d => this.toCircles(d.data, stationMap));
    this.times = data.map(d => {
      return moment
        .unix(+d.scrape_time)
        .tz('America/New_York')
        .format('hA, ddd MMM D YYYY');
    });
    this.handleSlide(0);
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
    const stationsResponse = await fetch(url);
    const stationsJson = await stationsResponse.text();
    const info = JSON.parse(stationsJson) as T;
    return info;
  }
}
