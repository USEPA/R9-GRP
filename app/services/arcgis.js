/**
 * Created by Travis on 10/5/2016.
 */
/*globals angular */
angular.module('GRPApp').factory('arcgisService', function ($q, esriLoader, $mdToast, esriAuth) {
    'use strict';
    var deferred = $q.defer(),
        FeatureLayer,
        Query,
        SpatialReference,
        Graphic;

    function _loadModules() {
        esriLoader.require(['esri/tasks/query', 'esri/layers/FeatureLayer', 'esri/SpatialReference', 'esri/graphic'],
            function (_Query, _FeatureLayer, _SpatialReference, _Graphic) {
                Query = _Query;
                FeatureLayer = _FeatureLayer;
                SpatialReference = _SpatialReference;
                Graphic = _Graphic;
                deferred.resolve();
            });
        return deferred.promise;
    }

    _loadModules();


    function grpPromise(promise) {
        promise.finally(function () {
            arcgisService.loading = false;
        });
        return promise;
    }

    function grpDefer() {
        arcgisService.loading = true;
        return $q.defer();
    }

    var arcgisService = {
        projectPoint: function (point, outSR) {
            var pointDeferred = grpDefer();
            if (point === undefined || point.type === 'polygon') {
                pointDeferred.resolve(undefined);
            } else {
                esriLoader.require(['esri/tasks/ProjectParameters', 'esri/tasks/GeometryService'],
                    function (ProjectParameters, GeometryService) {

                        // if no outSR set to wgs84
                        outSR = outSR !== undefined ? outSR : new SpatialReference(4326);
                        var params = new ProjectParameters(),
                            geometryService = new GeometryService('https://tasks.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer');

                        params.geometries = [point];
                        params.outSR = outSR;
                        geometryService.project(params, function (projectedPoint) {
                            pointDeferred.resolve(projectedPoint[0]);
                        });
                    });
            }
            return grpPromise(pointDeferred.promise);
        },
        getFeature: function (layer, globalId, objectId) {
            var featureDeferred = grpDefer();

            _loadModules().then(function () {
                var query = new Query();

                if (globalId) {
                    query.where = "GlobalID='" + globalId + "'";
                } else if (objectId) {
                    query.objectIds = [objectId];
                }

                query.outFields = ["*"];
                layer.selectFeatures(query, FeatureLayer.SELECTION_NEW, function (features) {
                    var site = {};

                    arcgisService.projectPoint(features[0].geometry)
                        .then(function (point) {
                            if (point !== undefined) {
                                features[0].coordinates = point;
                            }
                            site.feature = features[0];
                            featureDeferred.resolve(site);
                        });
                }, function (e) {
                    featureDeferred.reject(e);
                    $mdToast.showSimple(e.message);
                });
            });
            return grpPromise(featureDeferred.promise);
        },
        addFeature: function (layer, feature) {
            var resultsDeferred = grpDefer();
            if (feature.geometry !== undefined && feature.geometry.type === 'polygon' && feature.geometry.isSelfIntersecting()) {
                $mdToast.show({
                    template: '<md-toast ><div class="md-toast-content" md-colors="{background:\'warn-600\'}">' +
                    'Polygons cannot be self intersecting. ' +
                    'Save canceled.</div></md-toast>',
                    hideDelay: 6000
                });
                resultsDeferred.reject();
            } else {
                _loadModules().then(function () {
                    var tempFeature = new Graphic({attributes: feature.attributes});

                    arcgisService.loading = true;
                    arcgisService.projectPoint(feature.coordinates, new SpatialReference(3857))
                        .then(function (point) {
                            if (point !== undefined) {
                                tempFeature.geometry = point;
                            } else {
                                tempFeature.geometry = feature.geometry;
                            }

                            if (tempFeature.attributes.hasOwnProperty('actual_created_user') &&
                                tempFeature.attributes.hasOwnProperty('actual_last_edited_user')) {
                                tempFeature.attributes.actual_created_user = esriAuth.userName;
                                tempFeature.attributes.actual_last_edited_user = esriAuth.userName;
                            }

                            layer.applyEdits([tempFeature], null, null, function (results) {
                                resultsDeferred.resolve(results);
                            }, function (e) {
                                resultsDeferred.reject(e);
                                $mdToast.showSimple(e.message);
                            });
                        }).finally(function () {
                        arcgisService.loading = false;
                    });
                });
            }
            return grpPromise(resultsDeferred.promise);
        },
        updateFeature: function (layer, feature) {
            var resultsDeferred = grpDefer();
            if (feature.geometry !== undefined && feature.geometry.type === 'polygon' && feature.geometry.isSelfIntersecting()) {
                $mdToast.show({
                    template: '<md-toast ><div class="md-toast-content" md-colors="{background:\'warn-600\'}">' +
                    'Polygons cannot be self intersecting. ' +
                    'Save canceled.</div></md-toast>',
                    hideDelay: 6000
                });
                resultsDeferred.reject();
            } else {
                _loadModules().then(function () {
                    var tempFeature = new Graphic({attributes: feature.attributes});

                    arcgisService.projectPoint(feature.coordinates, new SpatialReference(3857))
                        .then(function (point) {
                            //savedFeature.geometry =
                            if (point !== undefined) {
                                tempFeature.geometry = point;
                            } else {
                                tempFeature.geometry = feature.geometry;
                            }

                            if (tempFeature.attributes.hasOwnProperty('actual_last_edited_user')) {
                                tempFeature.attributes.actual_last_edited_user = esriAuth.userName;
                            }

                            layer.applyEdits(null, [tempFeature], null, function (results) {
                                resultsDeferred.resolve(results);
                                $mdToast.showSimple("Saved");
                                arcgisService.loading = false;
                            }, function (e) {
                                resultsDeferred.reject(e);
                                $mdToast.showSimple(e.message);
                                arcgisService.loading = false;
                            });
                        });
                });
            }
            return grpPromise(resultsDeferred.promise);
        },
        deleteFeature: function (layer, feature) {
            var resultsDeferred = grpDefer();

            layer.applyEdits(null, null, [feature], function (results) {
                resultsDeferred.resolve(results);
                $mdToast.showSimple('Deleted');
            }, function (e) {
                resultsDeferred.reject(e);
                $mdToast.showSimple(e.message);
            });

            return grpPromise(resultsDeferred.promise);
        },

        getRelatedFeatures: function (layer, searchField, globalId, objectId) {
            var featureDeferred = grpDefer();
            _loadModules().then(function () {
                var query = new Query(),
                    data = {};

                arcgisService.loading = true;

                if (globalId) {
                    query.where = searchField + "='" + globalId + "'";
                } else if (objectId) {
                    query.objectIds = [objectId];
                }

                query.outFields = ["*"];
                layer.queryFeatures(query, function (featureSet) {
                    data.features = featureSet.features;

                    data.features.fields = {};
                    angular.forEach(layer.fields, function (field) {
                        data.features.fields[field.name] = field;
                    });

                    featureDeferred.resolve(data.features);
                    arcgisService.loading = false;
                }, function (e) {
                    featureDeferred.reject(e);
                    $mdToast.showSimple(e.message);
                    arcgisService.loading = false;
                });
            });
            return grpPromise(featureDeferred.promise);
        },

        addRelatedFeature: function (layer, feature) {
            arcgisService.loading = true;

            if (!angular.isArray(feature) && feature) {
                feature = [feature];
            }

            angular.forEach(feature, function (f, i) {
                if (f.attributes.hasOwnProperty('actual_created_user') &&
                    f.attributes.hasOwnProperty('actual_last_edited_user')) {
                    f.attributes.actual_created_user = esriAuth.userName;
                    f.attributes.actual_last_edited_user = esriAuth.userName;
                }
            });

            var resultsDeferred = grpDefer();

            layer.applyEdits(feature, null, null, function (results) {
                resultsDeferred.resolve(results);
                $mdToast.showSimple("Created");
                arcgisService.loading = false;
            }, function (e) {
                resultsDeferred.reject(e);
                $mdToast.showSimple(e.message);
                arcgisService.loading = false;
            });
            return grpPromise(resultsDeferred.promise);
        },
        updateRelatedFeature: function (layer, feature) {
            arcgisService.loading = true;

            if (!angular.isArray(feature) && feature) {
                feature = [feature];
            }

            angular.forEach(feature, function (f, i) {
                if (f.attributes.hasOwnProperty('actual_last_edited_user')) {
                    f.attributes.actual_last_edited_user = esriAuth.userName;
                }
            });

            var resultsDeferred = grpDefer();

            layer.applyEdits(null, feature, null,
                function (add_result, update_result) {
                    resultsDeferred.resolve(update_result[0]);
                    $mdToast.showSimple("Saved");
                    arcgisService.loading = false;
                }, function (e) {
                    resultsDeferred.reject(e);
                    $mdToast.showSimple(e.message);
                    arcgisService.loading = false;
                });

            return grpPromise(resultsDeferred.promise);
        },
        deleteRelatedFeature: function (layer, feature) {
            arcgisService.loading = true;
            if (typeof feature === 'object' && feature) {
                feature = [feature];
            }
            var resultsDeferred = grpDefer();

            layer.applyEdits(null, null, feature, function (add_result, update_result, delete_result) {
                resultsDeferred.resolve(delete_result);
                $mdToast.showSimple("Deleted");
                arcgisService.loading = false;
            }, function (e) {
                resultsDeferred.reject(e);
                $mdToast.showSimple(e.message);
                arcgisService.loading = false;
            });
            return grpPromise(resultsDeferred.promise);
        },
        deleteRelationship: function (layer, relationship, foreignKeyField) {
            var resultsDeferred = grpDefer();

            // this is weird can not include foreign key b/c it throws an error... but its a delete!
            delete relationship.attributes.Contact_FK;
            delete relationship.attributes[foreignKeyField];

            layer.applyEdits(null, null, [relationship],
                function () {
                    resultsDeferred.resolve();
                    $mdToast.showSimple("Relationship Deleted");
                }, function (e) {
                    resultsDeferred.reject(e);
                    $mdToast.showSimple(e.message);
                });

            return grpPromise(resultsDeferred.promise);
        },
        getAttachments: function (layer, objectId) {
            var attachmentsDeferred = grpDefer();
            layer.queryAttachmentInfos(objectId, function (attachments) {
                angular.forEach(attachments, function (attachment) {
                    if (attachment.contentType.substring(0, 5) === 'image') {
                        attachment.previewUrl = attachment.url;
                    } else {
                        attachment.previewUrl = 'images/very-basic-file-icon.png';
                        attachment.extension = attachment.name.split('.').pop();
                    }
                });
                attachmentsDeferred.resolve(attachments);
            });
            return grpPromise(attachmentsDeferred.promise);
        },
        uploadAttachments: function (layer, objectId, data) {
            var deferredAttachment = grpDefer();
            layer.addAttachment(objectId, data, function (result) {
                deferredAttachment.resolve(result.attachmentId);
                $mdToast.showSimple("Attachment Added");
            }, function (e) {
                deferredAttachment.reject(e);
                $mdToast.showSimple(e.message);
            });
            return grpPromise(deferredAttachment.promise);
        },
        deleteAttachments: function (layer, objectId, attachmentId) {
            var responseDeferred = grpDefer();
            layer.deleteAttachments(objectId, [attachmentId], function (response) {
                responseDeferred.resolve(response);
                $mdToast.showSimple("Attachment Deleted");
            }, function (e) {
                responseDeferred.reject(e);
                $mdToast.showSimple(e.message);
            });
            return grpPromise(responseDeferred.promise);
        }
    };
    return arcgisService;
});