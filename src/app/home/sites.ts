import { IdEntity, IdColumn, StringColumn, DateTimeColumn, DateColumn, BoolColumn, NumberColumn, EntityClass, RunOnServer, Context, } from 'radweb';
import { Roles } from '../users/roles';
import * as fetch from 'node-fetch';

@EntityClass
export class Sites extends IdEntity<IdColumn> {
    url = new StringColumn("url");
    lastUpdate = new DateTimeColumn("עדכון אחרון");
    fromDate = new DateColumn("מתאריך");
    toDate = new DateColumn("עד תאריך");
    loading = new BoolColumn("בטעינה");
    name = new StringColumn("שם");
    connections = new NumberColumn("db");
    families = new NumberColumn("באירוע");
    allFamilies = new NumberColumn("כל המשפחות");
    helpers = new NumberColumn("מתנדבים");
    onTheWay = new NumberColumn("בדרך");
    deliveries = new NumberColumn("משלוחים");
    errorMessage = new StringColumn("שגיאה");

    constructor() {
        super(new IdColumn(), {
            allowApiRead: Roles.admin,
            allowApiCRUD: Roles.admin,
            name: 'sites'
        });
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
                    s.allFamilies.value = r.totalFamilies;
                    s.onTheWay.value = r.onTheWay;
                    s.helpers.value = r.helpers;
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
}
export interface monitorResult {
    totalFamilies: number;
    name: string;
    familiesInEvent: number;
    dbConnections: number;
    deliveries: number;
    onTheWay: number;
    helpers: number;
}