'use strict';

var logger = require('logger');
var JSONAPISerializer = require('jsonapi-serializer').Serializer;


var biomassIflSerializer = new JSONAPISerializer('biomass', {
    attributes: ['geojson', 'type'],
    keyForAttribute: 'camelCase'
});

class BiomassIflSerializer {

  static serialize(data) {
    return biomassIflSerializer.serialize(data);
  }
}

module.exports = BiomassIflSerializer;
