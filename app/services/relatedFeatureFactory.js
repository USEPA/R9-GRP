/**
 * Created by Travis on 10/5/2016.
 */
/*globals angular */
angular.module('GRPApp').factory('relatedFeatureFactory',
    function ($q, esriLoader, $mdToast, $filter, $mdDialog, $state, esriAuth) {
        'use strict';
        var relatedFactory = function (feature, foreignKeyField, foreignKey) {
            var deferred = $q.defer(),
                Query,
                Graphic,
                arcgisService;

            esriLoader.require(['esri/tasks/query', 'esri/graphic'],
                function (_Query, _Graphic) {
                    Query = _Query;
                    Graphic = _Graphic;
                    deferred.resolve();
                });

            function isLoaded() {
                return deferred.promise;
            }

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

            function initFields(obj) {
                angular.forEach(obj.layer.fields, function (field) {
                    obj.fields[field.name] = field;
                });
            }

            function add(showMessage) {
                arcgisService.loading = true;
                var feature = arcgisService;

                if (!angular.isArray(feature) && feature) {
                    feature = [feature];
                }

                var resultsDeferred = grpDefer();

                arcgisService.layer.applyEdits(feature, null, null, function (results) {
                    arcgisService.get(null, results[0].objectId).then(function () {
                        resultsDeferred.resolve(results);
                    });
                    if (showMessage || showMessage === undefined) {
                        $mdToast.showSimple("Created");
                    }
                    arcgisService.loading = false;
                }, function (e) {
                    resultsDeferred.reject(e);
                    $mdToast.showSimple(e.message);
                    arcgisService.loading = false;
                });
                return grpPromise(resultsDeferred.promise);
            }

            function update(showMessage) {
                arcgisService.loading = true;
                var feature = arcgisService;

                if (!angular.isArray(feature) && feature) {
                    feature = [feature];
                }
                var resultsDeferred = grpDefer();

                arcgisService.layer.applyEdits(null, feature, null, function (add_result, update_result) {
                    resultsDeferred.resolve(update_result[0]);
                    if (showMessage || showMessage === undefined) {
                        $mdToast.showSimple("Saved");
                    }
                    arcgisService.loading = false;
                }, function (e) {
                    resultsDeferred.reject(e);
                    $mdToast.showSimple(e.message);
                    arcgisService.loading = false;
                });

                return grpPromise(resultsDeferred.promise);
            }

            function _delete(deleteDeferred, nextState) {
                if (arcgisService.attributes.GlobalID !== 'new') {
                    arcgisService.loading = true;
                    var feature = arcgisService;
                    if (typeof feature === 'object' && feature) {
                        feature = [feature];
                    }
                    // var resultsDeferred = grpDefer();

                    arcgisService.layer.applyEdits(null, null, feature, function () {
                        // resultsDeferred.resolve(delete_result);
                        $mdToast.showSimple("Deleted");
                        deleteDeferred.resolve();
                        arcgisService.loading = false;
                        // delete arcgisService;
                        if (nextState) {
                            $state.go(nextState);
                        }
                    }, function (e) {
                        // resultsDeferred.reject(e);
                        $mdToast.showSimple(e.message);
                        arcgisService.loading = false;
                    });
                }
            }

            arcgisService = {
                layer: feature._layer,
                attributes: feature.attributes,
                fields: {},
                // list: [],
                instance: {},
                foreignKeyField: foreignKeyField,
                // isLoaded: function () {
                //     return layerIsLoaded.promise;
                // },
                // getList: function (globalId, objectId) {
                //     var featureDeferred = grpDefer();
                //     _loadModules().then(function () {
                //         var query = new Query(),
                //             data = {};
                //
                //         arcgisService.loading = true;
                //
                //         if (globalId) {
                //             query.where = arcgisService.foreignKeyField + "='" + globalId + "'";
                //         } else if (objectId) {
                //             query.objectIds = [objectId];
                //         }
                //
                //         query.outFields = ["*"];
                //         arcgisService.layer.queryFeatures(query, function (featureSet) {
                //             // data.features = featureSet.features;
                //
                //             // if (globalId === null) {
                //             //     arcgisService.list.push();
                //             // } else {
                //             //     arcgisService.list = data;
                //             // }
                //             // arcgisService.list = featureSet.features;
                //             angular.forEach(featureSet.features, function (feature, i) {
                //                 var fac = new relatedFactory(arcgisService.layer, arcgisService.foreignKeyField, feature);
                //                 featureSet.features[i] = angular.extend(fac, feature);
                //             });
                //             featureDeferred.resolve(featureSet.features);
                //             arcgisService.loading = false;
                //         }, function (e) {
                //             featureDeferred.reject(e);
                //             $mdToast.showSimple(e.message);
                //             arcgisService.loading = false;
                //         });
                //     });
                //
                //     //angular.forEach(iapService.plan.ics234, function (objective) {
                //     //    iapService.ICS234.Strategies.get(objective.attributes.GlobalID);
                //     //    iapService.ICS234.Tasks.get(objective.attributes.GlobalID);
                //     //});
                //     return grpPromise(featureDeferred.promise);
                //
                // },
                get: function (globalId, objectId) {
                    var deferredResults = grpDefer();
                    if (globalId === 'new' && !objectId) {
                        angular.extend(arcgisService, new Graphic(arcgisService.layer.templates[0].prototype.toJson()));
                        arcgisService.attributes.GlobalID = 'new';
                        deferredResults.resolve();
                    } else {
                        var feature;
                        if (globalId !== null) {
                            feature = $filter('filter')(arcgisService.list, {attributes: {GlobalID: globalId}})[0];
                        }
                        if (feature !== undefined) {
                            angular.extend(arcgisService, feature);
                            deferredResults.resolve();
                        } else {
                            var field;
                            if (globalId !== null) {
                                field = 'GlobalID';
                            } else {
                                field = 'OBJECTID';
                            }
                            var featureDeferred = grpDefer();
                            isLoaded().then(function () {
                                var query = new Query(),
                                    data = {};

                                arcgisService.loading = true;

                                if (globalId) {
                                    query.where = field + "='" + globalId + "'";
                                } else if (objectId) {
                                    query.objectIds = [objectId];
                                }

                                query.outFields = ["*"];
                                arcgisService.layer.queryFeatures(query, function (featureSet) {
                                    // data.features = featureSet.features;

                                    // data.features.fields = {};
                                    // angular.forEach(layer.fields, function (field) {
                                    //     data.features.fields[field.name] = field;
                                    // });

                                    angular.extend(arcgisService, featureSet.features[0]);
                                    deferredResults.resolve();

                                    arcgisService.loading = false;
                                }, function (e) {
                                    featureDeferred.reject(e);
                                    $mdToast.showSimple(e.message);
                                    arcgisService.loading = false;
                                });
                            });
                        }
                    }
                    return grpPromise(deferredResults.promise);
                },
                save: function (state, showMessage) {
                    var promise;
                    if (arcgisService.attributes.GlobalID === 'new' || arcgisService.attributes.GlobalID === undefined) {
                        if (arcgisService.attributes.hasOwnProperty('actual_created_user') &&
                            arcgisService.attributes.hasOwnProperty('actual_last_edited_user')) {
                            arcgisService.attributes.actual_created_user = esriAuth.userName;
                            arcgisService.attributes.actual_last_edited_user = esriAuth.userName;
                        }
                        promise = add(showMessage);
                    } else {
                        if (arcgisService.attributes.hasOwnProperty('actual_last_edited_user')) {
                            arcgisService.attributes.actual_last_edited_user = esriAuth.userName;
                        }
                        promise = update(showMessage);
                    }
                    return promise.then(function () {
                        if (state) {
                            $state.go(state);
                        }
                    });
                },
                delete: function (text, ev, nextState) {
                    var deleteDeferred = grpDefer();
                    if (text === undefined && ev === undefined && nextState === undefined) {
                        _delete(deleteDeferred);
                    } else {
                        var confirm = $mdDialog.confirm()
                            .title('Delete?')
                            .textContent(text)
                            .ariaLabel('')
                            .targetEvent(ev)
                            .ok('Yes')
                            .cancel('No');
                        $mdDialog.show(confirm).then(function () {
                            _delete(deleteDeferred, nextState);
                        }).catch(function () {
                            deleteDeferred.reject();
                        });
                    }
                    return grpPromise(deleteDeferred.promise);
                },
                // deleteRelationship: function (layer, relationship, foreignKeyField) {
                //     var resultsDeferred = grpDefer();
                //
                //     // this is weird can not include foreign key b/c it throws an error... but its a delete!
                //     delete relationship.attributes.Contact_FK;
                //     delete relationship.attributes[foreignKeyField];
                //
                //     layer.applyEdits(null, null, [relationship],
                //         function () {
                //             resultsDeferred.resolve();
                //             $mdToast.showSimple("Relationship Deleted");
                //         }, function (e) {
                //             resultsDeferred.reject(e);
                //             $mdToast.showSimple(e.message);
                //         });
                //
                //     return grpPromise(resultsDeferred.promise);
                // },
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

            // angular.extend(feature, arcgisService);
            initFields(arcgisService);

            // initialize foreign key field if new object
            if (arcgisService.attributes.GlobalID === 'new' && foreignKeyField !== undefined) {
                arcgisService.attributes[foreignKeyField] = foreignKey;
            }

            return arcgisService;
        };
        return relatedFactory;
    });