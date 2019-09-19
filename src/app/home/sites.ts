import { IdEntity, IdColumn, StringColumn, DateTimeColumn, DateColumn, BoolColumn, NumberColumn, EntityClass, } from 'radweb';
import { Roles } from '../users/roles';

@EntityClass
export class Sites extends IdEntity<IdColumn> {
    url = new StringColumn("url");
    lastUpdate = new DateTimeColumn("עדכון אחרון");
    fromDate = new DateColumn("מתאריך");
    toDate = new DateColumn("עד תאריך");
    loading = new BoolColumn("בטעינה");
    name = new StringColumn("שם");
    connections= new NumberColumn("connections");
    families = new NumberColumn("משפחות באירוע");
    deliveries = new NumberColumn("משלוחים");
    errorMessage = new StringColumn("שגיאה");

    constructor() {
        super(new IdColumn(), {
            allowApiRead: Roles.admin,
            allowApiCRUD: Roles.admin,
            name: 'sites'
        });
    }

}
export interface monitorResult {
    name:string;
    familiesInEvent: number;
    dbConnections: number;
    deliveries:number;
}