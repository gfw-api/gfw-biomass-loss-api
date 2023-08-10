import Router from 'koa-router';
import logger from 'logger';
import { Context, Next } from 'koa';
import BiomassSerializer from 'serializers/biomass.serializer';
import GeostoreService from 'services/geostoreService';
import CartoDBService from 'services/cartoDBService';


const router: Router = new Router({
    prefix: '/api/v1/biomass-loss'
});

class BiomassLossRouter {

    static indicatorSelector(row: Array<Record<string, any>>, indicator: number, begin: number, end: number): Record<string, any> {
        const results: Record<string, any> = {};
        if (indicator === 4) {
            return row[2].value;
        } else if (indicator === 0) {
            return row[0].value;
        }

        for (let i: number = 0, length: number = row.length; i < length; i++) {
            if (row[i].indicator_id === indicator && row[i].year >= begin && row[i].year <= end) {
                results[row[i].year + ''] = row[i].value;
            }
        }
        return results;
    }

    static sumRange(data: Record<string, any>, begin: number, end: number): number {
        const keys: string[] = Object.keys(data);
        let total: number = 0;
        for (let i: number = 0, length: number = keys.length; i < length; i++) {
            if (keys[i] !== 'carbon' && parseInt(keys[i], 10) >= begin && parseInt(keys[i], 10) < end) {
                total += data[keys[i]];
            }
        }
        return total;
    }


    static async getNational(ctx: Context): Promise<void> {
        logger.info('Obtaining national data');
        const data: Array<Record<string, any>> = await CartoDBService.getNational(
            ctx.params.iso,
            ctx.request.query.thresh as string
        );
        let period: string = ctx.request.query.period as string;
        if (!ctx.request.query.period) {
            period = '2001-01-01,2013-01-01';
        }
        const periods: string[] = period.split(',');
        const begin: number = parseInt(periods[0].split('-')[0], 10);
        const end: number = parseInt(periods[1].split('-')[0], 10);

        const dataArea: Record<string, any> = await GeostoreService.getGeostoreByIso(
            ctx.params.iso,
            ctx.request.headers['x-api-key'] as string
        );
        ctx.response.body = BiomassSerializer.serialize({
            area_ha: dataArea.areaHa,
            tree_loss_by_year: BiomassLossRouter.indicatorSelector(data, 1, begin, end),
            biomass_loss_by_year: BiomassLossRouter.indicatorSelector(data, 12, begin, end),
            c_loss_by_year: BiomassLossRouter.indicatorSelector(data, 13, begin, end),
            co2_loss_by_year: BiomassLossRouter.indicatorSelector(data, 14, begin, end),
            biomass: BiomassLossRouter.indicatorSelector(data, 4, begin, end),
            biomass_loss: BiomassLossRouter.sumRange(BiomassLossRouter.indicatorSelector(data, 12, begin, end), begin, end),
        });
    }

    static async getSubnational(ctx: Context): Promise<void> {
        logger.info('Obtaining subnational data');
        const data: Array<Record<string, any>> = await CartoDBService.getSubnational(
            ctx.params.iso as string,
            ctx.params.id1 as string,
            ctx.request.query.thresh as string
        );
        let period: string = ctx.request.query.period as string;
        if (!ctx.request.query.period) {
            period = '2001-01-01,2013-01-01';
        }
        const periods: string[] = period.split(',');
        const begin: number = parseInt(periods[0].split('-')[0], 10);
        const end: number = parseInt(periods[1].split('-')[0], 10);

        const dataArea: Record<string, any> = await GeostoreService.getGeostoreByIsoAndId(
            ctx.params.iso,
            ctx.params.id1,
            ctx.request.headers['x-api-key'] as string
        );
        ctx.response.body = BiomassSerializer.serialize({
            area_ha: dataArea.areaHa,
            tree_loss_by_year: BiomassLossRouter.indicatorSelector(data, 1, begin, end),
            biomass_loss_by_year: BiomassLossRouter.indicatorSelector(data, 12, begin, end),
            c_loss_by_year: BiomassLossRouter.indicatorSelector(data, 13, begin, end),
            co2_loss_by_year: BiomassLossRouter.indicatorSelector(data, 14, begin, end),
            biomass: BiomassLossRouter.indicatorSelector(data, 4, begin, end),
            biomass_loss: BiomassLossRouter.sumRange(BiomassLossRouter.indicatorSelector(data, 12, begin, end), begin, end),
        });
    }

}

const isCached = async (ctx: Context, next: Next): Promise<void> => {
    if (await ctx.cashed()) {
        return;
    }
    await next();
};

router.get('/admin/:iso', isCached, BiomassLossRouter.getNational);
router.get('/admin/:iso/:id1', isCached, BiomassLossRouter.getSubnational);

export default router;
