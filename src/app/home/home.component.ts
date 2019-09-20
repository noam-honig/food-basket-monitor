import { Component, OnInit } from '@angular/core';
import { RunOnServer, DateColumn, DataAreaSettings } from 'radweb';
import { Context } from 'radweb';
import { Roles } from '../users/roles';
import { Sites, monitorResult } from './sites';
var fullDayValue = 24 * 60 * 60 * 1000;


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})

export class HomeComponent implements OnInit {

  constructor(private context: Context) {
    let today = new Date();
    this.initTotals();
    this.fromDate.value = new Date(today.getFullYear(), today.getMonth(), 1);
    this.toDate.value = this.getEndOfMonth();
  }
  fromDate = new DateColumn({
    caption: 'מתאריך',
    valueChange: () => {

      if (this.toDate.value < this.fromDate.value) {
        this.toDate.value = this.getEndOfMonth();
      }

    }
  });
  async refresh() {
    await Sites.refreshSiteInfo(this.fromDate.rawValue, this.toDate.rawValue);
    this.refreshGrid();

  };
  totals: monitorResult;
  initTotals() {
    this.totals = {
      dbConnections: 0,
      deliveries: 0,
      familiesInEvent: 0,
      helpers: 0,
      name: '',
      onTheWay: 0,
      totalFamilies: 0
    };
  }

  async refreshGrid() {

    let rows = await this.sites.getRecords();
    this.initTotals();
    let loading = false;
    for (const site of rows.items) {
      this.totals.deliveries += site.deliveries.value;
      this.totals.familiesInEvent += site.families.value;
      this.totals.helpers += site.helpers.value;
      this.totals.onTheWay += site.onTheWay.value;
      this.totals.totalFamilies += site.allFamilies.value;
      if (site.connections.value > 10) {
        this.totals.dbConnections = site.connections.value;
        this.totals.name = site.name.value;
      }


      if (site.loading.value) {
        loading = true;
      }
    }
    if (loading)
      setTimeout(() => {
        this.refreshGrid();
      }, 1000);

  }

  sites = this.context.for(Sites).gridSettings({
    allowUpdate: true,
    allowDelete: true,
    allowInsert: true,
    hideDataArea: true,
    knowTotalRows: true,
    get: {
      limit: 100,
      orderBy: s => [{ column: s.deliveries, descending: true }]
    },
    rowCssClass: s => {
      if (s.loading.value)
        return 'warning';
      if (s.connections.value > 10)
        return 'error';
      return '';
    },
    columnSettings: s => [
      { column: s.name, readonly: true },
      { column: s.deliveries, readonly: true, width: '60' },
      { column: s.families, readonly: true, width: '100' },
      { column: s.connections, readonly: true, width: '90' },
      { column: s.lastUpdate, readonly: true, width: '170' },
      { column: s.errorMessage, readonly: true, width: '170' },
      { column: s.loading, readonly: true, width: '170' },
      s.url
    ]
  });
  today() {
    this.fromDate.value = new Date();
    this.toDate.value = new Date();
    this.refresh();

  }


  next() {
    this.setRange(+1);
  }
  previous() {

    this.setRange(-1);
  }
  private setRange(delta: number) {
    if (this.fromDate.value.getDate() == 1 && this.toDate.value.toDateString() == this.getEndOfMonth().toDateString()) {
      this.fromDate.value = new Date(this.fromDate.value.getFullYear(), this.fromDate.value.getMonth() + delta, 1);
      this.toDate.value = this.getEndOfMonth();
    } else {
      let difference = Math.abs(this.toDate.value.getTime() - this.fromDate.value.getTime());
      if (difference < fullDayValue)
        difference = fullDayValue;
      difference *= delta;
      let to = this.toDate.value;
      this.fromDate.value = new Date(this.fromDate.value.getTime() + difference);
      this.toDate.value = new Date(to.getTime() + difference);

    }
    this.refresh();
  }
  private getEndOfMonth(): Date {
    return new Date(this.fromDate.value.getFullYear(), this.fromDate.value.getMonth() + 1, 0);
  }
  toDate = new DateColumn('עד תאריך');
  rangeArea = new DataAreaSettings({
    columnSettings: () => [this.fromDate, this.toDate],
    numberOfColumnAreas: 2
  });

  isAdmin() { return this.context.isAllowed(Roles.admin); }

  async ngOnInit() {
    this.refresh();
  }
  clickMe() {
    HomeComponent.test();
  }
  @RunOnServer({ allowed: () => true })
  static test(context?: Context) {
    console.log('hi');
    console.log(context.user);
  }
}

