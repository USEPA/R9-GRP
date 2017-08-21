/**
 * Created by Travis on 10/12/2016.
 */
/**
 * Created by Travis on 10/5/2016.
 */
/*globals angular */
angular.module('GRPApp').service('drawService', function ($q, esriLoader, mapService) {
    'use strict';

    var deferred,
        POINT,
        POLYLINE,
        POLYGON,
        _callback;

    function _loadDraw() {
        deferred = $q.defer();
        esriLoader.require('esri/toolbars/draw').then(function (Draw) {
            mapService.getMap().then(function (map) {
                var draw = new Draw(map);
                POINT = Draw.POINT;
                POLYLINE = Draw.POLYLINE;
                POLYGON = Draw.POLYGON;
                draw.on('draw-complete', function (e) {
                    //editDeferred.resolve(e.graphic.geometry);
                    //editDeferred = $q.defer();
                    _callback(e.geometry);
                });
                deferred.resolve(draw);
            });
        });
    }

    // _loadDraw();

    var serviceObj = {
        get: function () {
            return deferred.promise;
        },
        drawPoint: function (callback) {
            _callback = callback;
            serviceObj.get().then(function (draw) {
                draw.activate(POINT);
            });
            //return editDeferred.promise;
        },
        drawPolyline: function (callback) {
            _callback = callback;
            serviceObj.get().then(function (draw) {
                draw.activate(POLYLINE);
            });
        },
        drawPolygon: function (callback) {
            _callback = callback;
            serviceObj.get().then(function (draw) {
                draw.activate(POLYGON);
            });
        },
        stop: function () {
            serviceObj.get().then(function (draw) {
                draw.deactivate();
            });
        },
        init: function () {
            _loadDraw();
        }
    };


    return serviceObj;
    //var deferred = $q.defer();
    //esriLoader.require(['esri/tasks/query', 'esri/layers/FeatureLayer', 'esri/SpatialReference',
    //        'esri/tasks/ProjectParameters', 'esri/tasks/GeometryService', 'esri/graphic'],
    //    function (Query, FeatureLayer, SpatialReference, ProjectParameters, GeometryService, Graphic) {
    //
    //        deferred.resolve(arcgisService);
    //    });
    //return deferred.promise;
});