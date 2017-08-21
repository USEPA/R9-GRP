/**
 * Created by Travis on 10/5/2016.
 */

/*globals angular */
angular.module('GRPApp').service('editService', function ($q, esriLoader, mapService) {
    'use strict';

    var deferred,
        MOVE,
        EDIT_VERTICIES;

    function _loadEdit() {
        deferred = $q.defer();
        esriLoader.require('esri/toolbars/edit').then(function (Edit) {
            mapService.getMap().then(function (map) {
                var edit = new Edit(map);
                MOVE = Edit.MOVE;
                EDIT_VERTICIES = Edit.EDIT_VERTICES;
                deferred.resolve(edit);
            });
        });
    }

    _loadEdit();

    var serviceObj = {
        point: {},
        get: function () {
            return deferred.promise;
        },
        move: function (feature, callback) {
            serviceObj.get().then(function (edit) {
                edit.on('graphic-move-stop', function (e) {
                    callback(e.graphic.geometry);
                });
                edit.activate(MOVE, feature);
            });
        },
        edit_verticies: function (feature, callback) {
            serviceObj.get().then(function (edit) {
                edit.on('vertex-move-stop', function (e) {
                    callback(e.graphic.geometry);
                });
                edit.activate(EDIT_VERTICIES, feature);
            });

        },
        stop: function () {
            serviceObj.get().then(function (edit) {
                edit.deactivate();
            });
        },
        center: function (geometry) {
            serviceObj.getMap().then(function (map) {
                map.centerAt(geometry);
            });
        },
        init: function () {
            _loadEdit();
        }
    };

    return serviceObj;
});