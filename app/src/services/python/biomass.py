import ee
import os
import json
import logging
import config
import sys


def _get_thresh_image(thresh, asset_id):
    """Renames image bands using supplied threshold and returns image."""
    image = ee.Image(asset_id)

    # Select out the gain band if it exists
    if 'gain' in asset_id:
        before = image.select('.*_' + thresh, 'gain').bandNames()
    else:
        before = image.select('.*_' + thresh).bandNames()

    after = before.map(
        lambda x: ee.String(x).replace('_.*', ''))

    image = image.select(before, after)
    return image


def _get_region(geom):
    """Return ee.Geometry from supplied GeoJSON object."""
    poly = _get_coords(geom)
    ptype = geom.get('type')
    if ptype.lower() == 'multipolygon':
        region = ee.Geometry.MultiPolygon(poly)
    else:
        region = ee.Geometry.Polygon(poly)
    return region
def _dict_unit_transform(data, num):
    dasy = {}
    for key, value in data.iteritems():
        dasy[key] = value*num

    return dasy

def _indicator_selector(row, indicator,begin,end):
    """Return Tons of biomass loss."""
    dasy={}
    if indicator == 4:
            return row[2]['value']

    for i in range(len(row)):
        if (row[i]['indicator_id'] == indicator and row[i]['year']>= int(begin) and row[i]['year']<= int(end)):
            dasy[str(row[i]['year'])] = row[i]['value']

    return dasy

def _dates_selector(data,begin,end):
    """Return Tons of biomass loss."""
    dasy = {}
    for key, value in data.iteritems():
        if (int(key)>= int(begin) and int(key)<= int(end)):
            dasy[key] = value

    return dasy

def _ee(geom, thresh, asset_id1):
    image = _get_thresh_image(thresh, asset_id1)
    region = _get_region(geom)

    # Reducer arguments
    reduce_args = {
        'reducer': ee.Reducer.sum(),
        'geometry': region,
        'bestEffort': True,
        'scale': 90
    }

    # Calculate stats
    area_stats = image.divide(10000 * 255.0) \
        .multiply(ee.Image.pixelArea()) \
        .reduceRegion(**reduce_args)

    return area_stats.getInfo()

def _ee_biomass(geom, thresh, asset_id1, asset_id2):

    image1 = _get_thresh_image(thresh, asset_id1)
    image2 = ee.Image(asset_id2)
    region = _get_region(geom)

    # Reducer arguments
    reduce_args = {
        'reducer': ee.Reducer.sum(),
        'geometry': region,
        'bestEffort': True,
        'scale': 90
    }

    # Calculate stats 10000 ha, 10^6 to transform from Mg (10^6g) to Tg(10^12g) and 255 as is the pixel value when true.
    area_stats = image2.multiply(image1) \
        .divide(10000 * 255.0 * 1000000) \
        .multiply(ee.Image.pixelArea()) \
        .reduceRegion(**reduce_args)

    carbon_stats = image2.multiply(ee.Image.pixelArea().divide(10000)).reduceRegion(**reduce_args)
    area_results = area_stats.combine(carbon_stats).getInfo()

    return area_results



def _get_coords(geojson):
    if geojson.get('features') is not None:
        return geojson.get('features')[0].get('geometry').get('coordinates')
    elif geojson.get('geometry') is not None:
        return geojson.get('geometry').get('coordinates')
    else:
        return geojson.get('coordinates')

def _sum_range(data, begin, end):
    return sum(
        [value for key, value in data.iteritems()
            if (int(key) >= int(begin)) and (int(key) < int(end))])


def _execute_geojson(thresh, geojson, begin, end):
    """Query GEE using supplied args with threshold and geojson."""

    # Authenticate to GEE and maximize the deadline
    ee.Initialize(config.EE_CREDENTIALS, config.EE_URL)
    # ee.Initialize()
    ee.data.setDeadline(60000)
    geojson = json.loads(geojson)

    # hansen tree cover loss by year
    hansen_loss_by_year = _ee(geojson, thresh, config.assets['hansen_loss_thresh'])
    logging.info('TREE_LOSS_RESULTS: %s' % hansen_loss_by_year)
    # Biomass loss by year
    loss_by_year = _ee_biomass(geojson, thresh, config.assets['hansen_loss_thresh'], config.assets['biomass_2000'])
    logging.info('BIOMASS_LOSS_RESULTS: %s' % loss_by_year)
    # biomass (UMD doesn't permit disaggregation of forest gain by threshold).
    biomass = loss_by_year['carbon']
    logging.info('BIOMASS: %s' % biomass)
    loss_by_year.pop("carbon",None)

    # Carbon (UMD doesn't permit disaggregation of forest gain by threshold).
    carbon_loss = _dict_unit_transform(loss_by_year, 0.5)
    logging.info('CARBON: %s' % carbon_loss)

    # CO2 (UMD doesn't permit disaggregation of forest gain by threshold).
    carbon_dioxide_loss = _dict_unit_transform(carbon_loss, 3.67)
    logging.info('CO2: %s' % carbon_dioxide_loss)

    # Reduce loss by year for supplied begin and end year
    begin = begin.split('-')[0]
    end = end.split('-')[0]
    biomass_loss = _sum_range(loss_by_year, begin, end)

    # Prepare result object
    result = {}
    result['biomass'] = biomass
    result['biomass_loss'] = biomass_loss
    result['biomass_loss_by_year'] = _dates_selector(loss_by_year,begin,end)
    result['tree_loss_by_year'] = _dates_selector(hansen_loss_by_year,begin,end)
    result['c_loss_by_year'] = _dates_selector(carbon_loss,begin,end)
    result['co2_loss_by_year'] = _dates_selector(carbon_dioxide_loss,begin,end)

    return result


thresh = sys.argv[1]
geojsonPath = sys.argv[2]
begin = sys.argv[3]
end = sys.argv[4]

txt_file = open(geojsonPath)

print (json.dumps(_execute_geojson(thresh, txt_file.read(), begin, end)))
