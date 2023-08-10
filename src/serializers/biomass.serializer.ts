import { Serializer } from 'jsonapi-serializer';

const years: string[] = ['2001', '2002', '2003', '2004', '2005', '2006', '2007', '2008', '2009', '2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019', '2020'];

const biomassSerializer: Serializer = new Serializer('biomass', {
    attributes: ['biomass', 'biomass_loss', 'biomass_loss_by_year', 'c_loss_by_year', 'co2_loss_by_year', 'tree_loss_by_year', 'area_ha'],
    keyForAttribute: 'camelCase',
    tree_loss_by_year: {
        attributes: years
    },
    biomass_loss_by_year: {
        attributes: years
    },
    c_loss_by_year: {
        attributes: years
    },
    co2_loss_by_year: {
        attributes: years
    }
});

class BiomassSerializer {

    static serialize(data: Record<string, any>): Record<string, any> {
        return biomassSerializer.serialize(data);
    }
}

export default BiomassSerializer;
