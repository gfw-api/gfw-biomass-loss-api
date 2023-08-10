import logger from 'logger';
import config from 'config';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import CartoDB from 'cartodb';
import Mustache from 'mustache';
import ErrorSerializer from "serializers/error.serializer";


const ISO: string = `WITH r as (
        SELECT iso,boundary,admin0_name as country,  year, thresh, indicator_id, value*1000000 as value
        FROM indicators_values
        WHERE iso = UPPER('{{iso}}')
              AND thresh = {{thresh}}
              AND iso_and_sub_nat = UPPER('{{iso}}')
              AND boundary = 'admin'
              AND (indicator_id = 4
                OR indicator_id= 12
                OR indicator_id= 13
                OR indicator_id= 14)
        ORDER BY year, indicator_id),
            s as (SELECT iso,boundary,admin0_name as country,  year, thresh, indicator_id, value as value
        FROM indicators_values
        WHERE iso = UPPER('{{iso}}')
              AND thresh = {{thresh}}
              AND iso_and_sub_nat = UPPER('{{iso}}')
              AND boundary = 'admin'
              AND indicator_id = 1
         ORDER BY year, indicator_id),
            area as (SELECT iso,'admin'::text as boundary, name_0 as country, 0 as year, 0 as thresh, 0 as indicator_id, area_ha as value from gadm2_countries_simple where iso  = UPPER('{{iso}}'))
        (select * from s
        union all
        select * from r)
        union all
        select * from area
        ORDER BY year, indicator_id`;

const ID1: string = `WITH r as (
        SELECT iso, boundary, admin0_name as country, sub_nat_id as id1,  year, thresh, indicator_id, value
        FROM indicators_values
        WHERE iso = UPPER('{{iso}}')
              AND thresh = {{thresh}}
              AND sub_nat_id = {{id1}}
              AND boundary = 'admin'
              AND (indicator_id = 1
                OR indicator_id = 4
                OR indicator_id= 12
                OR indicator_id= 13
                OR indicator_id= 14)
        ORDER BY year),
            area as (SELECT iso,'admin'::text as boundary, name_0 as country, id_1 as id1, 0 as year, 0 as thresh, 0 as indicator_id, area_ha as value from gadm2_provinces_simple where iso=UPPER('{{iso}}') and id_1={{id1}})
        select * from r
        union all
    select * from area
        ORDER BY year, indicator_id `;

const executeThunk = async (client: CartoDB.SQL, sql: string, params: any): Promise<Record<string, any>> => (new Promise((resolve: (value: (PromiseLike<unknown> | unknown)) => void, reject: (reason?: any) => void) => {
    logger.debug(Mustache.render(sql, params));
    client.execute(sql, params).done((data: Record<string, any>) => {
        resolve(data);
    }).error((error: ErrorSerializer) => {
        reject(error);
    });
}));


class CartoDBService {

    client: CartoDB.SQL;

    constructor() {
        this.client = new CartoDB.SQL({
            user: config.get('cartoDB.user')
        });
    }

    async getNational(iso: string, thresh: string = "30"): Promise<Array<Record<string, any>>> {
        const parsedThresh: number = parseInt(thresh, 10);
        const data: Record<string, any> = await executeThunk(this.client, ISO, {
            iso: iso,
            thresh: parsedThresh
        });
        return data.rows;
    }

    async getSubnational(iso: string, id1: string, thresh: string = "30"): Promise<Array<Record<string, any>>> {
        const parsedThresh: number = parseInt(thresh, 10);
        const data: Record<string, any> = await executeThunk(this.client, ID1, {
            iso: iso,
            id1: id1,
            thresh: parsedThresh
        });
        return data.rows;
    }
}

export default new CartoDBService();
