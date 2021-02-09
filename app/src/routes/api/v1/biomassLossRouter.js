
const Router = require('koa-router');
const logger = require('logger');
const CartoDBService = require('services/cartoDBService');
const GeostoreService = require('services/geostoreService');
const NotFound = require('errors/notFound');
const BiomassSerializer = require('serializers/biomassSerializer');


const router = new Router({
    prefix: '/biomass-loss'
});

class BiomassLossRouter {

    static indicatorSelector(row, indicator, begin, end){
        var dasy={};
        if (indicator === 4 ){
            return row[2].value;
        } else if(indicator === 0){
            return row[0].value;
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
        let dataArea = yield GeostoreService.getGeostoreByIso(this.params.iso);
        body.area_ha = dataArea.areaHa;
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
        let dataArea = yield GeostoreService.getGeostoreByIsoAndId(this.params.iso, this.params.id1);
        body.area_ha = dataArea.areaHa;
        body.tree_loss_by_year = BiomassLossRouter.indicatorSelector(data, 1, begin, end);
        body.biomass_loss_by_year = BiomassLossRouter.indicatorSelector(data, 12, begin, end);
        body.c_loss_by_year = BiomassLossRouter.indicatorSelector(data, 13, begin, end);
        body.co2_loss_by_year = BiomassLossRouter.indicatorSelector(data, 14, begin, end);
        body.biomass = BiomassLossRouter.indicatorSelector(data, 4, begin, end);
        body.biomass_loss = BiomassLossRouter.sumRange(body.biomass_loss_by_year, begin, end);
        this.body = BiomassSerializer.serialize(body);
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

module.exports = router;
