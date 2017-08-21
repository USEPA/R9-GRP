/**
 * Created by Travis on 10/12/2016.
 */
/**
 * Created by Travis on 10/5/2016.
 */
/*globals angular */
angular.module('GRPApp').service('mapService', function ($q, esriLoader, $timeout, loadingService, grpFeatureService) {
    'use strict';

    var mapDeferred = $q.defer(),
        bingHybrid;

    var serviceObj = {
        mapExists: false,
        loadMap: function (id) {
            loadingService.loading = true;
            esriLoader.require(['esri/map', 'esri/geometry/Extent', 'esri/SpatialReference', 'esri/virtualearth/VETiledLayer'],
                function (Map, Extent, SpatialReference, VETiledLayer) {
                    var map = new Map(id, {
                        // basemap: "hybrid",
                        center: [-140, 50],
                        zoom: 3,
                        autoResize: true,
                        slider: false
                    });

                    bingHybrid = new VETiledLayer({
                        bingMapsKey: grpFeatureService.bingKey,
                        mapStyle: VETiledLayer.MAP_STYLE_AERIAL_WITH_LABELS
                    });

                    map.addLayer(bingHybrid);

                    map.on('load', function () {
                        serviceObj.mapExists = true;
                        if (serviceObj.initialExtent !== null) {
                            var extent = new Extent(
                                serviceObj.initialExtent[0][0],
                                serviceObj.initialExtent[0][1],
                                serviceObj.initialExtent[1][0],
                                serviceObj.initialExtent[1][1],
                                new SpatialReference({wkid: 4326})
                            );
                            serviceObj.esriInitialExtent = extent;
                            $timeout(function () {
                                map.setExtent(extent);
                            }, 750);
                        }
                        mapDeferred.resolve(map);
                    });

                });
            mapDeferred.promise.finally(function () {
                loadingService.stop();
            });
            return mapDeferred.promise;
        },
        initialExtent: null,
        getMap: function () {
            return mapDeferred.promise;
        },
        clearMap: function () {
            serviceObj.getMap().then(function (map) {
                map.graphics.clear();
            });
        },
        addGraphic: function (graphic) {
            serviceObj.getMap().then(function (map) {
                map.graphics.add(graphic);
            });
        },
        addLayer: function (layer) {
            loadingService.loading = true;
            serviceObj.getMap().then(function (map) {
                map.addLayer(layer);
            }).finally(function () {
                loadingService.stop();
            });
        },
        addLayers: function (layers) {
            loadingService.start();
            serviceObj.getMap().then(function (map) {
                map.addLayers(layers);
            }).finally(function () {
                loadingService.stop();
            });
        },
        center: function (geometry) {
            serviceObj.getMap().then(function (map) {
                // timeout helps make sure the map has time to adjust after slideout opens
                // before trying to center the geometry not perfect but seems to resolve the
                // case 100% of the time
                $timeout(function () {
                    if (geometry.type === 'point') {
                        map.centerAt(geometry);
                    } else if (geometry.type === 'polygon') {
                        var center = geometry.getCentroid();
                        map.centerAt(center);
                    }
                }, 250);
            });
        },
        destroy: function () {
            if (serviceObj.mapExists) {
                serviceObj.getMap().then(function (map) {
                    map.destroy();
                    serviceObj.mapExists = false;
                    mapDeferred = $q.defer();
                });
            }
        },
        removeAllLayers: function () {
            if (serviceObj.mapExists) {
                serviceObj.getMap().then(function (map) {
                    map.removeAllLayers();
                });
            }
        },
        switchBasemap: function (basemap) {
            serviceObj.getMap().then(function (map) {
                if (basemap.baseMapLayers === "bingHybrid") {
                    if (!bingHybrid.visible) {
                        if (map.basemapLayerIds !== undefined) {
                            angular.forEach(map.basemapLayerIds, function (layerId) {
                            map.getLayer(layerId).setVisibility(false);
                            });
                        }
                        bingHybrid.show();

                    }
                } else {
                    if (bingHybrid.visible) {
                        if (map.basemapLayerIds !== undefined) {
                            angular.forEach(map.basemapLayerIds, function (layerId) {
                                map.getLayer(layerId).setVisibility(false);
                            });
                        }
                        bingHybrid.hide();
                    }
                    map.setBasemap(basemap);

                }
            });
        },
        zoomIn: function () {
            serviceObj.getMap().then(function (map) {
                map.setZoom(map.getZoom() + 1);
            });
        },
        zoomOut: function () {
            serviceObj.getMap().then(function (map) {
                map.setZoom(map.getZoom() - 1);
            });
        },
        resetExtent: function () {
            serviceObj.getMap().then(function (map) {
                map.setExtent(serviceObj.esriInitialExtent);
            });
        }
    };


    return serviceObj;
});