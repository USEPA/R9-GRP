/**
 * Created by Travis on 12/15/2016.
 */
/*global angular */
angular.module('GRPApp').factory('relatedContactFactory', function (configService, esriLoader, $q, relationshipFactory, $mdToast, contactService, $filter) {
    'use strict';
    var createRelatedContact = function (layerId, foreignKeyField) {
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

        // function isLoaded() {
            esriLoader.require(['esri/tasks/query', 'esri/layers/FeatureLayer', 'esri/graphic'],
                function (_Query, _FeatureLayer, _Graphic) {
                    Query = _Query;
                    FeatureLayer = _FeatureLayer;
                    Graphic = _Graphic;
                    deferred.resolve();
                });
        //     return deferred.promise;
        // }
        
        function  isLoaded() {
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
            load: function (globalId, objectId) {
                var featureDeferred = grpDefer();
                isLoaded().then(function () {
                    var query = new Query();
                    myRelatedObject.loading = true;

                    if (globalId) {
                        query.where = myRelatedObject.foreignKeyField + "='" + globalId + "'";
                    } else if (objectId) {
                        query.objectIds = [objectId];
                    }

                    query.outFields = ["*"];
                    myRelatedObject.layer.queryFeatures(query, function (featureSet) {
                        var queryString = '';

                        angular.forEach(featureSet.features, function (feature, i) {
                            if (feature.attributes.Contact_FK) {
                                queryString += "GlobalID ='" + feature.attributes.Contact_FK + "'";
                                if (i < featureSet.features.length - 1) {
                                    queryString += " OR ";
                                }
                            }
                        });

                        contactService.Contacts.get(null, queryString).then(function (contacts) {
                            // angular.forEach(contactSet.features, function (feature, i) {
                            //     featureSet.features[i] = new relatedFeatureFactory(feature);
                            //     featureSet.features[i].relationship =
                            // });
                            angular.forEach(featureSet.features, function (relationship) {
                                // angular.forEach(contacts, function (contact, i) {
                                $filter('filter')(contacts, {attributes: {GlobalID: relationship.attributes.Contact_FK}})[0].relationship = new relationshipFactory(relationship, foreignKeyField, 'Contact_FK');
                                // contacts[i].relationship = new relationshipFactory()
                                // });
                            });
                            featureDeferred.resolve(contacts);
                            myRelatedObject.loading = false;
                        });

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
                    contactService.Contacts.create().then(function (contact) {
                        var relationship = new Graphic(myRelatedObject.layer.templates[0].prototype.toJson());
                        relationship._layer = myRelatedObject.layer;
                        // relationship.attributes. = 'new';
                        // feature.attributes[myRelatedObject.foreignKeyField] = myRelatedObject.foreignKey;
                        contact.relationship = new relationshipFactory(relationship, foreignKeyField, 'Contact_FK');
                        // contact.relationship.attributes.Contact_FK = contactKey;
                        contact.relationship.attributes[myRelatedObject.foreignKeyField] = foreignKey;
                        createDeferred.resolve(contact);
                    });
                });

                return createDeferred.promise;
            }
        };
        return myRelatedObject;
    };
    return createRelatedContact;
});