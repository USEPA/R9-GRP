/**
 * Created by Travis on 12/15/2016.
 */
/*global angular */
angular.module('GRPApp').factory('relatedObjectFactory',
    function (configService, esriLoader, $q, relatedFeatureFactory, $mdToast) {
        'use strict';
        var createRelatedObject = function (layerId, foreignKeyField, defaultLayerId) {
            var deferred = $q.defer(),
                FeatureLayer,
                Query,
                Graphic,
                myRelatedObject,
            config = configService.getConfig();

            function grpPromise(promise) {
                promise.finally(function () {
                    myRelatedObject.loading = false;
                });
                return promise;
            }

            function grpDefer() {
                myRelatedObject.loading = true;
                return $q.defer();
            }

            esriLoader.require(['esri/tasks/query', 'esri/layers/FeatureLayer', 'esri/graphic'],
                function (_Query, _FeatureLayer, _Graphic) {
                    Query = _Query;
                    FeatureLayer = _FeatureLayer;
                    Graphic = _Graphic;
                    deferred.resolve();
                });

            function isLoaded() {
                return deferred.promise;
            }

            myRelatedObject = {
                layerIsLoaded: $q.defer(),
                foreignKeyField: foreignKeyField,
                foreignKey: '',
                init: function () {
                    isLoaded().then(function () {
                        myRelatedObject.layer = new FeatureLayer(config.serviceRoot + layerId,
                            {outFields: ["*"]});
                        myRelatedObject.layer.on('load', function () {
                            myRelatedObject.layerIsLoaded.resolve();
                        });
                    });
                },
                isLoaded: function () {
                    return myRelatedObject.layerIsLoaded.promise;
                },
                load: function (globalId, objectId, where) {
                    var featureDeferred = grpDefer();
                    isLoaded().then(function () {
                        var query = new Query();
                        myRelatedObject.loading = true;

                        if (globalId) {
                            query.where = myRelatedObject.foreignKeyField + "='" + globalId + "'";
                        } else if (objectId) {
                            query.objectIds = [objectId];
                        } else if (where) {
                            query.where = where;
                        }

                        query.outFields = ["*"];
                        myRelatedObject.layer.queryFeatures(query, function (featureSet) {
                            angular.forEach(featureSet.features, function (feature, i) {
                                featureSet.features[i] = new relatedFeatureFactory(feature, myRelatedObject.foreignKeyField, globalId);
                            });
                            featureDeferred.resolve(featureSet.features);
                            myRelatedObject.loading = false;
                        }, function (e) {
                            featureDeferred.reject(e);
                            $mdToast.showSimple(e.message);
                            myRelatedObject.loading = false;
                        });
                    });
                    return grpPromise(featureDeferred.promise);
                },
                create: function (foreignKey) {
                    var createDeferred = $q.defer();
                    myRelatedObject.isLoaded().then(function () {
                        var feature = new Graphic(myRelatedObject.layer.templates[0].prototype.toJson());
                        feature._layer = myRelatedObject.layer;
                        feature.attributes.GlobalID = 'new';
                        // feature.attributes[myRelatedObject.foreignKeyField] = myRelatedObject.foreignKey;
                        createDeferred.resolve(new relatedFeatureFactory(feature, myRelatedObject.foreignKeyField, foreignKey));
                    });
                    return createDeferred.promise;
                }
            };

            // if default layer id provided setup defaults
            if (defaultLayerId !== undefined) {
                myRelatedObject.defaults = createRelatedObject(defaultLayerId, foreignKeyField);
            }
            return myRelatedObject;
        };
        return createRelatedObject;
    });