'use strict';

var Router = require('koa-router');
var logger = require('logger');
var CartoDBService = require('services/cartoDBService');
var GEEService = require('services/geeService');
var NotFound = require('errors/notFound');
var BiomassSerializer = require('serializers/biomassSerializer');


var router = new Router({
    prefix: '/biomass-loss'
});

class BiomassLossRouter {

    static indicatorSelector(row, indicator, begin, end){
        var dasy={};
        if (indicator === 4){
            return row[2].value;
        }

        for (let i=0, length = row.length; i < length; i++){
            if (row[i].indicator_id === indicator && row[i].year>= begin && row[i].year<= end){
                dasy[row[i].year + ''] = row[i].value;
            }
        }
        return dasy;
    }

    static sumRange(data, begin, end){
        let keys = Object.keys(data);
        let total = 0;
        for(let i = 0, length = keys.length; i < length; i++){
            if(keys[i] !== 'carbon' && parseInt(keys[i], 10) >= begin && parseInt(keys[i], 10) < end ){
                total += data[keys[i]];
            }
        }
        return total;
    }


    static * getNational(){
        logger.info('Obtaining national data');
        let data = yield CartoDBService.getNational(this.params.iso, this.query.thresh);
        let period = this.query.period;
        if(!this.query.period){
            period = '2001-01-01,2013-01-01';
        }
        let periods = period.split(',');
        let begin = parseInt(periods[0].split('-')[0], 10);
        let end = parseInt(periods[1].split('-')[0], 10);

        let body = {};
        body.tree_loss_by_year = BiomassLossRouter.indicatorSelector(data, 1, begin, end);
        body.biomass_loss_by_year = BiomassLossRouter.indicatorSelector(data, 12, begin, end);
        body.c_loss_by_year = BiomassLossRouter.indicatorSelector(data, 13, begin, end);
        body.co2_loss_by_year = BiomassLossRouter.indicatorSelector(data, 14, begin, end);
        body.biomass = BiomassLossRouter.indicatorSelector(data, 4, begin, end);
        body.biomass_loss = BiomassLossRouter.sumRange(body.biomass_loss_by_year, begin, end);
        this.body = BiomassSerializer.serialize(body);
    }

    static * getSubnational(){
        logger.info('Obtaining subnational data');
        let data = yield CartoDBService.getSubnational(this.params.iso, this.params.id1, this.query.thresh);
        let period = this.query.period;
        if(!this.query.period){
            period = '2001-01-01,2013-01-01';
        }
        let periods = period.split(',');
        let begin = parseInt(periods[0].split('-')[0], 10);
        let end = parseInt(periods[1].split('-')[0], 10);

        let body = {};
        body.tree_loss_by_year = BiomassLossRouter.indicatorSelector(data, 1, begin, end);
        body.biomass_loss_by_year = BiomassLossRouter.indicatorSelector(data, 12, begin, end);
        body.c_loss_by_year = BiomassLossRouter.indicatorSelector(data, 13, begin, end);
        body.co2_loss_by_year = BiomassLossRouter.indicatorSelector(data, 14, begin, end);
        body.biomass = BiomassLossRouter.indicatorSelector(data, 4, begin, end);
        body.biomass_loss = BiomassLossRouter.sumRange(body.biomass_loss_by_year, begin, end);
        this.body = BiomassSerializer.serialize(body);
    }

    static * use(){
        logger.info('Obtaining use data with name %s and id %s', this.params.name, this.params.id);
        let useTable = null;
        switch (this.params.name) {
            case 'mining':
                useTable = 'gfw_mining';
                break;
            case 'oilpalm':
                useTable = 'gfw_oil_palm';
                break;
            case 'fiber':
                useTable = 'gfw_wood_fiber';
                break;
            case 'logging':
                useTable = 'gfw_logging';
                break;
            default:
                this.throw(400, 'Name param invalid');
        }
        if(!useTable){
            this.throw(404, 'Name not found');
        }
        try{
            let period = this.query.period;
            if(!this.query.period){
                period = '2001-01-01,2013-01-01';
            }

            let data = yield GEEService.getUse(useTable, this.params.id, period, this.query.thresh);
            this.body = BiomassSerializer.serialize(data);
        } catch (err){
            logger.error(err);
            if(err instanceof NotFound){
                this.throw(404, 'WDPA not found');
                return;
            }
            throw err;
        }
    }

    static * wdpa(){
        logger.info('Obtaining wpda data with id %s', this.params.id);
        try{
            let period = this.query.period;
            if(!this.query.period){
                period = '2001-01-01,2013-01-01';
            }
            let data = yield GEEService.getWdpa(this.params.id, period, this.query.thresh);

            this.body = BiomassSerializer.serialize(data);
        } catch(err){
            logger.error(err);
            if(err instanceof NotFound){
                this.throw(404, 'WDPA not found');
                return;
            }
            throw err;
        }
    }

    static * world(){
        logger.info('Obtaining world data');
        this.assert(this.query.geostore, 400, 'geostore param required');
        let period = this.query.period;
        if(!this.query.period){
            period = '2001-01-01,2013-01-01';
        }
        let data = yield GEEService.getWorld(this.query.geostore, period, this.query.thresh);
        this.body = BiomassSerializer.serialize(data);
    }

}

var isCached =  function *(next){
    if (yield this.cashed()) {
        return;
    }
    yield next;
};

router.get('/admin/:iso', isCached, BiomassLossRouter.getNational);
router.get('/admin/:iso/:id1', isCached, BiomassLossRouter.getSubnational);
router.get('/use/:name/:id', isCached, BiomassLossRouter.use);
router.get('/wdpa/:id', isCached, BiomassLossRouter.wdpa);
router.get('/', isCached, BiomassLossRouter.world);


module.exports = router;
