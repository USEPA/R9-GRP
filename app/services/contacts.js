/**
 * Created by Travis on 10/5/2016.
 */
/*globals angular */
angular.module('GRPApp').service('contactService', function ($q, esriLoader, $mdToast, $filter, relatedFeatureFactory, esriAuth, configService) {
        'use strict';
        var deferred = $q.defer(),
            Query,
            FeatureLayer,
            Graphic,
            QueryTask,
            contactService = {
                Contacts: {}
            },
            config = configService.getConfig();

        function _loadContacts() {
            esriLoader.require(['esri/tasks/query', 'esri/layers/FeatureLayer', 'esri/graphic', 'esri/tasks/QueryTask'],
                function (_Query, _FeatureLayer, _Graphic, _QueryTask) {
                    Query = _Query;
                    FeatureLayer = _FeatureLayer;
                    Graphic = _Graphic;
                    QueryTask = _QueryTask;
                    deferred.resolve();
                });
        }

        _loadContacts();

        function myPromise(promise) {
            promise.finally(function () {
                contactService.loading = false;
            });
            return promise;
        }

        function myDefer() {
            contactService.loading = true;
            return $q.defer();
        }


        contactService = {
            getContacts: function () {
                return deferred.promise;
            },
            Contacts: {
                loading: false,
                layer: null,
                init: function () {
                    contactService.Contacts.layer = null;
                    contactService.getContacts().then(function () {
                        contactService.Contacts.layer = new FeatureLayer(config.serviceRoot + config.contacts,
                            {outFields: ["*"]});
                    });
                },
                create: function () {
                    var createDeferred = $q.defer();
                    contactService.getContacts().then(function () {
                        var feature = new Graphic(contactService.Contacts.layer.templates[0].prototype.toJson());
                        // seriously ESRI why the space in the Name field?  B/c its not nullable? That can't be right...
                        feature.attributes.Name = "";
                        feature._layer = contactService.Contacts.layer;
                        feature.attributes.GlobalID = 'new';
                        createDeferred.resolve(new relatedFeatureFactory(feature));
                    });
                    return createDeferred.promise;
                },
                get: function (objectId, queryString) {
                    var data = {},
                        featureDeferred = myDefer();
                    contactService.getContacts().then(function () {
                        var contactQuery = new Query();

                        if (queryString && queryString !== '') {
                            contactQuery.where = queryString;
                        } else if (objectId) {
                            contactQuery.objectIds = [objectId];
                        }

                        contactQuery.outFields = ["*"];

                        if (contactQuery.objectIds || contactQuery.where !== '') {
                            contactService.Contacts.layer.queryFeatures(contactQuery, function (featureSet) {
                                // data.contacts = featureSet.features;
                                // data.fields = {};
                                // angular.forEach(featureSet.fields, function (field) {
                                //     data.fields[field.name] = field;
                                // });
                                angular.forEach(featureSet.features, function (feature, i) {
                                    featureSet.features[i] = new relatedFeatureFactory(feature);
                                });

                                featureDeferred.resolve(featureSet.features);
                                // featureDeferred.resolve(data);
                            }, function (e) {
                                featureDeferred.reject(e);
                                $mdToast.showSimple(e.message);
                            });
                        } else {
                            featureDeferred.resolve([]);
                        }
                    });
                    return myPromise(featureDeferred.promise);
                },
                add: function (feature) {
                    var resultsDeferred = myDefer();

                    if (feature.attributes.hasOwnProperty('actual_created_user') &&
                        feature.attributes.hasOwnProperty('actual_last_edited_user')) {
                        feature.attributes.actual_created_user = esriAuth.userName;
                        feature.attributes.actual_last_edited_user = esriAuth.userName;
                    }

                    contactService.Contacts.layer.applyEdits([feature], null, null, function (results) {
                        contactService.Contacts.get(results[0].objectId).then(function (data) {
                            resultsDeferred.resolve(data.contacts[0]);
                            $mdToast.showSimple("Contact Created");
                        });
                    }, function (e) {
                        resultsDeferred.reject(e);
                        $mdToast.showSimple(e.message);
                    });
                    return myPromise(resultsDeferred.promise);
                },
                update: function (contact) {
                    var resultsDeferred = myDefer();
                    if (contact.attributes.hasOwnProperty('actual_last_edited_user')) {
                        contact.attributes.actual_last_edited_user = esriAuth.userName;
                    }
                    contactService.Contacts.layer.applyEdits(null, [contact], null, function () {
                        resultsDeferred.resolve();
                    }, function (e) {
                        resultsDeferred.reject(e);
                        $mdToast.showSimple(e.message);
                    });

                    return myPromise(resultsDeferred.promise);
                },
                query: function (searchText, ordering, count, offset) {
                    var deferredResults = myDefer();

                    contactService.getContacts().then(function () {
                        var query = new Query();

                        query.where = "Name like '%" + searchText + "%'";
                        query.outFields = ['*'];
                        query.returnGeometry = false;

                        if (ordering !== undefined) {
                            query.orderByFields = [ordering];
                        }
                        if (count !== undefined && offset !== undefined) {
                            query.num = count;
                            query.start = offset;
                        }

                        contactService.Contacts.layer.queryFeatures(query, function (featureSet) {
                            contactService.Contacts.count().then(function (count) {
                                angular.forEach(featureSet.features, function (feature, i) {
                                    featureSet.features[i] = new relatedFeatureFactory(feature);
                                });
                                featureSet.features.total = count;
                                deferredResults.resolve(featureSet.features);
                            });
                        }, function (e) {
                            console.log(e);
                        });
                    });
                    return myPromise(deferredResults.promise);
                },
                count: function () {
                    // this is stupid... total count should be returned via any query... at least optionally
                    var deferredResults = myDefer();

                    contactService.getContacts().then(function () {
                        var query = new Query(), queryTask = new QueryTask(config.serviceRoot + config.contacts);

                        query.where = "Name like '%'";

                        queryTask.executeForCount(query, function (count) {
                            deferredResults.resolve(count);
                        }, function (e) {
                            console.log(e);
                        });
                    });
                    return myPromise(deferredResults.promise);

                }
            }
        };
        // contactService.Contacts.init();
        //deferred.resolve(contactService);

        return contactService;
    }
);