const logger = require('logger');
const path = require('path');
const config = require('config');
const CartoDB = require('cartodb');
const Mustache = require('mustache');
const NotFound = require('errors/notFound');

const ISO = `WITH r as (
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

const ID1 = `WITH r as (
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

var executeThunk = function(client, sql, params) {
    return function(callback) {
        logger.debug(Mustache.render(sql, params));
        client.execute(sql, params).done(function(data) {
            callback(null, data);
        }).error(function(err) {
            callback(err, null);
        });
    };
};


function wrapQuotes(text) {
    return '\'' + text + '\'';
}

class CartoDBService {

    constructor() {
        this.client = new CartoDB.SQL({
            user: config.get('cartoDB.user')
        });
    }

    * getNational(iso, thresh=30) {
        let data = yield executeThunk(this.client, ISO, {
            iso: iso,
            thresh: thresh
        });
        return data.rows;
    }

    * getSubnational(iso, id1, thresh=30) {
        let data = yield executeThunk(this.client, ID1, {
            iso: iso,
            id1: id1,
            thresh: thresh
        });
        return data.rows;
    }
}

module.exports = new CartoDBService();
