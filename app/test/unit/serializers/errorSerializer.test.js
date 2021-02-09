const errorSerializer = require('serializers/errorSerializer');

describe('Error serializer test', function() {
    const data = [
        {
          name: 'Name not valid'
        },
        {
          surname: 'Surname not valid'
        }
    ];

    it('Generate correct jsonapi response', function() {
      let response = errorSerializer.serializeValidationBodyErrors(data);

      response.should.not.be.an('array');
      response.should.have.property('errors');
      response.errors.should.have.length(2);
      let error = response.errors[0];

      error.should.have.property('source');
      error.should.have.property('title');
      error.should.have.property('detail');
      error.should.have.property('code');
      error.detail.should.be.a('string');
      error.title.should.be.a('string');
      error.code.should.be.a('string');
      error.source.should.be.an('object');
      error.source.should.have.property('parameter');
      error.source.parameter.should.be.a('string');
    });

});
