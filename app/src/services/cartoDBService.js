'use strict';
var logger = require('logger');
var path = require('path');
var config = require('config');
var CartoDB = require('cartodb');
var Mustache = require('mustache');
var NotFound = require('errors/notFound');


const IFL = `SELECT ST_AsGeoJson(the_geom) AS geojson, type
        FROM gadm_countries_ifl
        WHERE iso = UPPER('{{iso}}')
        AND type='intact'`;

const IFL_ID1 = `SELECT ST_AsGeoJson(the_geom) AS geojson, type
        FROM gadm_countries_ifl
        WHERE iso = UPPER('{{iso}}')
              AND id1 = {{id1}}
        AND type='intact'`;

const ISO = `SELECT iso,boundary,admin0_name as country,  year, thresh, indicator_id, value
        FROM indicators_values
        WHERE iso = UPPER('{{iso}}')
              AND thresh = {{thresh}}
              AND iso_and_sub_nat = UPPER('{{iso}}')
              AND boundary = 'admin'
              AND (indicator_id = 1
                OR indicator_id = 4
                OR indicator_id= 12
                OR indicator_id= 13
                OR indicator_id= 14)
        ORDER BY year, indicator_id`;

const ID1 = `SELECT iso, boundary, admin0_name, sub_nat_id as id1,  year, thresh, indicator_id, value
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

        ORDER BY year`;
const USE = `SELECT ST_AsGeoJson(the_geom) AS geojson
        FROM {{useTable}}
        WHERE cartodb_id = {{id}}`;

const WDPA = `SELECT CASE when marine::numeric = 2 then null
        when ST_NPoints(the_geom)<=18000 THEN ST_AsGeoJson(the_geom)
       WHEN ST_NPoints(the_geom) BETWEEN 18000 AND 50000 THEN ST_AsGeoJson(ST_RemoveRepeatedPoints(the_geom, 0.001))
      ELSE ST_AsGeoJson(ST_RemoveRepeatedPoints(the_geom, 0.005))
       END as geojson FROM wdpa_protected_areas where wdpaid={{wdpaid}}`;


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

    * getIFLNational(iso, thresh=30) {
        let data = yield executeThunk(this.client, IFL, {
            iso: iso,
            thresh: thresh
        });
        return data.rows;
    }

    * getIFLSubnational(iso, id1, thresh=30) {
        let data = yield executeThunk(this.client, IFL_ID1, {
            iso: iso,
            id1: id1,
            thresh: thresh
        });
        return data.rows;
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

    * getUseGeoJSON(useTable, id){
        logger.debug('Obtaining geojson of use');
        let data = yield executeThunk(this.client, USE, {
            useTable: useTable,
            id: id
        });
        if (!data || !data.rows || data.rows.length === 0 || !data.rows[0].geojson) {
            logger.error('Geojson not found');
            throw new NotFound('Geojson not found');
        }
        return data.rows[0].geojson;
    }

    * getWDPAGeoJSON(wdpaid){
        logger.debug('Obtaining wpda geojson of id %s', wdpaid);
        let data = yield executeThunk(this.client, WDPA, {
            wdpaid: wdpaid
        });
        if (!data || !data.rows || data.rows.length === 0 || !data.rows[0].geojson) {
            logger.info('Geojson not found');
            throw new NotFound('Geojson not found');
        }
        return data.rows[0].geojson;
    }

}

module.exports = new CartoDBService();
