# GFW Biomass Loss API

[![Build Status](https://travis-ci.com/gfw-api/gfw-biomass-loss-api.svg?branch=dev)](https://travis-ci.com/gfw-api/gfw-biomass-loss-api)
[![Test Coverage](https://api.codeclimate.com/v1/badges/e74c0fa6bfc3dbf80d33/test_coverage)](https://codeclimate.com/github/gfw-api/gfw-biomass-loss-api/test_coverage)

This repository is the microservice that it implement the biomass loss funcionality and exposed the /biomass-loss endpoint in the api-gateway

[View the documentation for this
API](http://gfw-api.github.io/swagger-ui/?url=https://raw.githubusercontent.com/gfw-api/gfw-biomass-loss-api/master/app/microservice/swagger.yml#/BIOMASS)

## First time user
Perform the following steps:
* [Install docker](https://docs.docker.com/engine/installation/)
* Clone this repository: ```git clone git@github.com:Vizzuality/gfw-biomass-loss-api.git```
* Enter in the directory (cd gfw-biomass-loss-api)
* After, you open a terminal (if you have mac or windows, open a terminal with the 'Docker Quickstart Terminal') and execute the next command:

```bash
    docker-compose -f docker-compose-develop.yml build

```

## Run in develop mode (Watch mode)
Remember: In windows and Mac, open the terminal with 'Docker Quickstart Terminal'

```bash
docker-compose -f docker-compose-develop.yml build
//this command up the machine. If you want up in background mode, you add the -d option
```


## Execute test
Remember: In windows and Mac, open the terminal with 'Docker Quickstart Terminal'
```
docker-compose -f docker-compose-test.yml run test
```

## Install in heroku

Is necessary define the next environment variables:
* API_GATEWAY_URI => Url the register of the API Gateway. Remember: If the authentication is active in API Gateway, add the username and password in the url
* NODE_ENV => Environment (prod, staging, dev)
* CARTODB_APIKEY => API key to connect to CartoDB
* CARTODB_USER => User to connect to CartoDB

Is necessary the pem file of Google Earth Engine authentication in the root of the project



# Config

## register.json
This file contain the configuration about the endpoints that public the microservice. This json will send to the apigateway. it can contain variables:
* #(service.id) => Id of the service setted in the config file by environment
* #(service.name) => Name of the service setted in the config file by environment
* #(service.uri) => Base uri of the service setted in the config file by environment

Example:
````
{
    "id": "#(service.id)",
    "name": "#(service.name)",
    "urls": [{
        "url": "/story",
        "method": "POST",
        "endpoints": [{
            "method": "POST",
            "baseUrl": "#(service.uri)",
            "path": "/api/v1/story",
            "data": ["loggedUser"]
        }]
    }, {
        "url": "/story/:id",
        "method": "GET",
        "endpoints": [{
            "method": "GET",
            "baseUrl": "#(service.uri)",
            "path": "/api/v1/story/:id"
        }]
    }, {
        "url": "/user",
        "method": "GET",
        "endpoints": [{
            "method": "GET",
            "baseUrl": "#(service.uri)",
            "path": "/api/v1/story"
        }]
    }]
}


```
