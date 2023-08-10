import logger from 'logger';
import { Deserializer } from "jsonapi-serializer";
import { RWAPIMicroservice } from "rw-api-microservice-node";


class GeostoreService {
    static async getGeostore(path: string, apiKey: string): Promise<Record<string, any>> {
        logger.debug('Obtaining geostore with path %s', path);
        try {
            const result: Record<string, any> = await RWAPIMicroservice.requestToMicroservice({
                uri: `/geostore/${path}`,
                method: 'GET',
                headers: {
                    'x-api-key': apiKey,
                }
            });

            return await new Deserializer({
                keyForAttribute: 'camelCase'
            }).deserialize(result);
        } catch (error) {
            logger.warn('Error obtaining geostore:');
            logger.warn(error);
            return null;
        }
    }

    static async getGeostoreByIso(iso: string, apiKey: string): Promise<Record<string, any>> {
        logger.debug('Getting geostore by iso');
        return await GeostoreService.getGeostore(`admin/${iso}`, apiKey);
    }

    static async getGeostoreByIsoAndId(iso: string, id1: string, apiKey: string): Promise<Record<string, any>> {
        logger.debug('Getting geostore by iso and region');
        return await GeostoreService.getGeostore(`admin/${iso}/${id1}`, apiKey);
    }
}

export default GeostoreService;
