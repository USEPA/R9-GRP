/**
 * Created by Travis on 5/9/2017.
 */
angular.module('GRPApp').service('AGOLItems', function (esriLoader, Portal) {
    'use strict';
    esriLoader.require("esri/arcgis/Portal", function (arcgisPortal) {
        Portal.getPortal().then(function (epaPortal) {
            epaPortal.queryItems({q: 'tags: "GRP App"'}).then(function (response){
                response.results;
            });
        });
    });
});