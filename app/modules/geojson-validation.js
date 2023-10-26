const geojsonValidation = require('geojson-validation');

module.exports = () => {
  const geojsonModule = {};

  //! *************************************************************************
  //? GeoJSONValidationPoint
  //! *************************************************************************
  geojsonModule.validatePoint = async (geojson) => {
    if (!geojson || geojson.type !== "Point") {
      return false;
    }
    if (!geojson || !Array.isArray(geojson.coordinates)) {
      return false;
    }
    if (!geojson || geojson.coordinates.length !== 2) {
      return false;
    }
    if ( typeof geojson.coordinates[0] !== "number" || typeof geojson.coordinates[1] !== "number") {
      return false;
    }

    return true;
  }
  //! *************************************************************************
  //? validarGeoJSON
  //! *************************************************************************
  geojsonModule.validarGeoJSON = async (geojson) => {
  const schema = {
    type: 'object',
    required: ['type', 'features'],
    properties: {
      type: { enum: ['FeatureCollection'] },
      features: {
        type: 'array',
        minItems: 1,
        maxItems: 1,
        items: {
          type: 'object',
          required: ['type', 'geometry'],
          properties: {
            type: { enum: ['Feature'] },
            geometry: {
              type: 'object',
              required: ['type', 'coordinates'],
              properties: {
                type: { enum: ['Point'] },
                coordinates: {
                  type: 'array',
                  minItems: 2,
                  maxItems: 2,
                  items: { type: 'number' }
                }
              }
            }
          }
        }
      }
    }
  };
  const result = geojsonValidation.valid(geojson, schema);
  
  if(result.length > 0){
    return result;
  }
}
  return geojsonModule;
};
