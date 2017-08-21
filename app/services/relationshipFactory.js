/**
 * Created by Travis on 12/20/2016.
 */

/*globals angular */
angular.module('GRPApp').factory('relationshipFactory', function ($q, esriLoader, $mdToast, $filter, $mdDialog, $state) {
    'use strict';
    var createRelationship = function (feature, foreignKeyField, primaryKeyField) {
        var deferred = $q.defer(),
            Query,
            Graphic,
            relationship;

        function _loadModules() {
            esriLoader.require(['esri/tasks/query', 'esri/graphic'],
                function (_Query, _Graphic) {
                    Query = _Query;
                    Graphic = _Graphic;
                    deferred.resolve();
                });
            return deferred.promise;
        }

        _loadModules();

        function grpPromise(promise) {
            promise.finally(function () {
                relationship.loading = false;
            });
            return promise;
        }

        function grpDefer() {
            relationship.loading = true;
            return $q.defer();
        }

        function initFields(obj) {
            // obj.isLoaded().then(function () {
            angular.forEach(obj.layer.fields, function (field) {
                obj.fields[field.name] = field;
            });
            // });
        }

        function add() {
            relationship.loading = true;
            var feature = relationship;

            if (!angular.isArray(feature) && feature) {
                feature = [feature];
            }

            var resultsDeferred = grpDefer();

            relationship.layer.applyEdits(feature, null, null, function (results) {
                relationship.get(null, results[0].objectId).then(function () {
                    resultsDeferred.resolve(results);
                });
                $mdToast.showSimple("Created");
                relationship.loading = false;
            }, function (e) {
                resultsDeferred.reject(e);
                $mdToast.showSimple(e.message);
                relationship.loading = false;
            });
            return grpPromise(resultsDeferred.promise);
        }

        function update() {
            relationship.loading = true;
            var feature = relationship;

            delete feature.attributes[foreignKeyField];
            delete feature.attributes[primaryKeyField];

            if (!angular.isArray(feature) && feature) {
                feature = [feature];
            }
            var resultsDeferred = grpDefer();

            relationship.layer.applyEdits(null, feature, null, function (add_result, update_result) {
                resultsDeferred.resolve(update_result[0]);
                $mdToast.showSimple("Saved");
                relationship.loading = false;
            }, function (e) {
                resultsDeferred.reject(e);
                $mdToast.showSimple(e.message);
                relationship.loading = false;
            });

            return grpPromise(resultsDeferred.promise);
        }

        function _delete(deleteDeferred, nextState) {
            if (relationship.attributes.GlobalID !== 'new') {
                relationship.loading = true;
                var feature = relationship;
                if (typeof feature === 'object' && feature) {
                    feature = [feature];
                }
                // var resultsDeferred = grpDefer();

                relationship.layer.applyEdits(null, null, feature, function () {
                    // resultsDeferred.resolve(delete_result);
                    $mdToast.showSimple("Deleted");
                    deleteDeferred.resolve();
                    relationship.loading = false;
                    // delete relationship;
                    if (nextState) {
                        $state.go(nextState);
                    }
                }, function (e) {
                    // resultsDeferred.reject(e);
                    $mdToast.showSimple(e.message);
                    relationship.loading = false;
                });
            }
        }

        relationship = {
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
            //         relationship.loading = true;
            //
            //         if (globalId) {
            //             query.where = relationship.foreignKeyField + "='" + globalId + "'";
            //         } else if (objectId) {
            //             query.objectIds = [objectId];
            //         }
            //
            //         query.outFields = ["*"];
            //         relationship.layer.queryFeatures(query, function (featureSet) {
            //             // data.features = featureSet.features;
            //
            //             // if (globalId === null) {
            //             //     relationship.list.push();
            //             // } else {
            //             //     relationship.list = data;
            //             // }
            //             // relationship.list = featureSet.features;
            //             angular.forEach(featureSet.features, function (feature, i) {
            //                 var fac = new relatedFactory(relationship.layer, relationship.foreignKeyField, feature);
            //                 featureSet.features[i] = angular.extend(fac, feature);
            //             });
            //             featureDeferred.resolve(featureSet.features);
            //             relationship.loading = false;
            //         }, function (e) {
            //             featureDeferred.reject(e);
            //             $mdToast.showSimple(e.message);
            //             relationship.loading = false;
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
                    angular.extend(relationship, new Graphic(relationship.layer.templates[0].prototype.toJson()));
                    relationship.attributes.GlobalID = 'new';
                    deferredResults.resolve();
                } else {
                    var feature;
                    if (globalId !== null) {
                        feature = $filter('filter')(relationship.list, {attributes: {GlobalID: globalId}})[0];
                    }
                    if (feature !== undefined) {
                        angular.extend(relationship, feature);
                        deferredResults.resolve();
                    } else {
                        var field;
                        if (globalId !== null) {
                            field = 'GlobalID';
                        } else {
                            field = 'OBJECTID';
                        }
                        var featureDeferred = grpDefer();
                        _loadModules().then(function () {
                            var query = new Query(),
                                data = {};

                            relationship.loading = true;

                            if (globalId) {
                                query.where = field + "='" + globalId + "'";
                            } else if (objectId) {
                                query.objectIds = [objectId];
                            }

                            query.outFields = ["*"];
                            relationship.layer.queryFeatures(query, function (featureSet) {
                                // data.features = featureSet.features;

                                // data.features.fields = {};
                                // angular.forEach(layer.fields, function (field) {
                                //     data.features.fields[field.name] = field;
                                // });

                                angular.extend(relationship, featureSet.features[0]);
                                deferredResults.resolve();

                                relationship.loading = false;
                            }, function (e) {
                                featureDeferred.reject(e);
                                $mdToast.showSimple(e.message);
                                relationship.loading = false;
                            });
                        });
                    }
                }
                return grpPromise(deferredResults.promise);
            },
            save: function () {
                var promise;
                if (relationship.attributes.RID === undefined) {
                    promise = add();
                } else {
                    promise = update();
                }
                return promise;
            },
            delete: function (text, ev, nextState) {
                var deleteDeferred = grpDefer();
                if (text === undefined && ev === undefined && nextState === undefined) {
                    _delete(deleteDeferred);
                } else {
                    var confirm = $mdDialog.confirm()
                        .title('Remove?')
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

        // angular.extend(feature, relationship);
        initFields(relationship);

        // initialize foreign key field if new object
        // if (relationship.attributes.GlobalID === 'new' && foreignKeyField !== undefined) {
        //     relationship.attributes[foreignKeyField] = foreignKey;
        // }


        return relationship;
    };
    return createRelationship;
});