/**
 * Created by Travis on 12/24/2015.
 */
/*global angular */
angular.module('GRPApp')
    .directive('grpMap', function () {
        'use strict';
        return {
            restrict: 'E',
            scope: {
                layers: '='
            },
            templateUrl: 'directives/grp-map/template.html',
            replace: true,
            controller: function ($scope, mapService, esriLoader, grpFeatureService) {
                mapService.loadMap('mapDiv');
                $scope.map = mapService;
                esriLoader.require(['esri/basemaps', 'esri/virtualearth/VETiledLayer'], function (basemaps, VETiledLayer) {


                        var usaTopo = {
                            baseMapLayers: [{url: "https://services.arcgisonline.com/ArcGIS/rest/services/USA_Topo_Maps/MapServer"}],
                            thumbnailUrl: "http://www.arcgis.com/sharing/rest/content/items/931d892ac7a843d7ba29d085e0433465/info/thumbnail/usa_topo.jpg",
                            title: 'USA Topo'
                        };
                        var bingHybrid = {
                            baseMapLayers: "bingHybrid",
                            thumbnailUrl: "https://epa.maps.arcgis.com/sharing/rest/content/items/a9ecd9030ddb4a9b96e13ce524447fdd/info/thumbnail/tempbing_hybrid_manchester2.png",
                            title: "Bing Maps Hybrid"
                        };
                        $scope.basemaps = [
                            bingHybrid,
                            basemaps.streets,
                            basemaps.terrain,
                            basemaps.topo,
                            usaTopo
                        ];
                });
            }
        };
    });