import { Component, OnInit } from '@angular/core';
import { RunOnServer, DateColumn, DataAreaSettings } from 'radweb';
import { Context } from 'radweb';
import { Roles } from '../users/roles';
import { Sites, monitorResult } from './sites';
import * as fetch from 'node-fetch';
var fullDayValue = 24 * 60 * 60 * 1000;


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})

export class HomeComponent implements OnInit {

  constructor(private context: Context) {
    let today = new Date();

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
    await HomeComponent.refreshSiteInfo(this.fromDate.rawValue, this.toDate.rawValue);
    this.refreshGrid();

  };
  async refreshGrid() {
    let rows = await this.sites.getRecords();

    for (const site of rows.items) {
      if (site.loading.value) {
        setTimeout(() => {
          this.refreshGrid();
        }, 1000);
        return;
      }
    }

  }

  sites = this.context.for(Sites).gridSettings({
    allowUpdate: true,
    allowDelete: true,
    allowInsert: true,
    hideDataArea: true,
    knowTotalRows:true,
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
  totalFamilies() {
    let r = 0;
    for (let f of this.sites.items) {
      r += f.families.value;
    }
    return r;
  }
  totalDeliveries() {
    let r = 0;
    for (let f of this.sites.items) {
      r += f.deliveries.value;
    }
    return r;
  }
  @RunOnServer({ allowed: Roles.admin })
  static async  refreshSiteInfo(fromDate: string, toDate: string, context?: Context) {

    for (const s of (await context.for(Sites).find({}))) {
      s.loading.value = true;
      await s.save();
      try {
        fetch.default(s.url.value + "/monitor-report?fromdate=" + fromDate + "&todate=" + toDate, {
          headers: {
            "Authorization": process.env.MONITOR_KEY
          }
        }).then(x => x.json()).then(async (r: monitorResult) => {
          s.fromDate.rawValue = fromDate;
          s.toDate.rawValue = toDate;
          s.connections.value = r.dbConnections;
          s.families.value = r.familiesInEvent;
          s.deliveries.value = r.deliveries;
          s.loading.value = false;
          s.lastUpdate.value = new Date();
          s.name.value = r.name;
          s.errorMessage.value = '';
          await s.save();
        }).catch(async err => {
          s.errorMessage.value = err;
          s.loading.value = false;
          await s.save();
        });
      } catch (err) {
        console.error(err);
      }

    }
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

  ngOnInit() {
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

