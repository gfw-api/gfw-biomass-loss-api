
const logger = require('logger');
const JSONAPIDeserializer = require('jsonapi-serializer').Deserializer;
const { RWAPIMicroservice } = require('rw-api-microservice-node');


var deserializer = function(obj) {
    return function(callback) {
        new JSONAPIDeserializer({keyForAttribute: 'camelCase'}).deserialize(obj, callback);
    };
};


class GeostoreService {
    static * getGeostore(path) {
        logger.debug('Obtaining geostore with path %s', path);
        try {
            const result = yield RWAPIMicroservice.requestToMicroservice({
                uri: `/geostore/${path}`,
                method: 'GET',
                json: true
            });

            return yield deserializer(result);
        } catch (error) {
            logger.warn('Error obtaining geostore:');
            logger.warn(error);
            return null;
        }
    }

    static * getGeostoreByHash(hash) {
        logger.debug('Getting geostore');
        return yield GeostoreService.getGeostore(hash);
    }

    static * getGeostoreByIso(iso) {
        logger.debug('Getting geostore by iso');
        return yield GeostoreService.getGeostore(`admin/${iso}`);
    }

    static * getGeostoreByIsoAndId(iso, id1) {
        logger.debug('Getting geostore by iso and region');
        return yield GeostoreService.getGeostore(`admin/${iso}/${id1}`);
    }

    static * getGeostoreByUse(useTable, id) {
        logger.debug('Getting geostore by use');
        return yield GeostoreService.getGeostore(`use/${useTable}/${id}`);
    }

    static * getGeostoreByWdpa(wdpaid) {
        logger.debug('Getting geostore by use');
        return yield GeostoreService.getGeostore(`wdpa/${wdpaid}`);
    }
}

module.exports = GeostoreService;
