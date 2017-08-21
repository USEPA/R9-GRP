/**
 * Created by Travis on 11/20/2015.
 */
/*jslint todo: true */
/*global angular */
/*global window */
/*global console */
angular.module('GRPApp')
    .service('inlandSiteService', ['$q', 'arcgisService', 'esriLoader', 'contactService', '$state', 'editService', 'mapService', 'drawService', 'relatedContactFactory', '$mdToast', 'iapService', 'configService',
            function ($q, arcgis, esriLoader, contactService, $state, editService, mapService, drawService, relatedContactFactory, $mdToast, iapService, configService) {
                'use strict';
                function _startEditing(feature) {
                    editService.move(feature, function (geometry) {
                        Inland.projectPoint(geometry).then(function (point) {
                            Inland.site.coordinates = point;
                        });
                    });
                }

                var deferred = $q.defer(),
                    symbol,
                    Query,
                    FeatureLayer,
                    Geoprocessor,
                    Circle,
                    FeatureSet,
                    Graphic,
                    SpatialReference,
                    Point,
                    PrintTask,
                    listener,
                    Inland = {},
                    config = configService.getConfig();

                function _loadModules() {
                    esriLoader.require(['esri/symbols/SimpleMarkerSymbol', 'esri/symbols/SimpleLineSymbol', 'esri/Color',
                            'esri/tasks/query', 'esri/layers/FeatureLayer', 'esri/tasks/Geoprocessor', 'esri/geometry/Circle',
                            'esri/tasks/FeatureSet', 'esri/graphic', 'esri/SpatialReference', 'esri/geometry/Point',
                            'esri/tasks/PrintTask'],
                        function (SimpleMarkerSymbol, SimpleLineSymbol, Color, _Query, _FeatureLayer, _Geoprocessor,
                                  _Circle, _FeatureSet, _Graphic, _SpatialReference, _Point, _PrintTask) {
                            symbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 14,
                                new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0, 0, 0]), 1.25),
                                new Color([0, 255, 255]));
                            Query = _Query;
                            FeatureLayer = _FeatureLayer;
                            Geoprocessor = _Geoprocessor;
                            Circle = _Circle;
                            FeatureSet = _FeatureSet;
                            Graphic = _Graphic;
                            SpatialReference = _SpatialReference;
                            Point = _Point;
                            PrintTask = _PrintTask;
                            deferred.resolve();
                        });
                }

                _loadModules();

                function grpPromise(promise) {
                    promise.finally(function () {
                        Inland.loading = false;
                    });
                    return promise;
                }

                function grpDefer() {
                    Inland.loading = true;
                    return $q.defer();
                }

                Inland = {
                    getModules: function () {
                        return deferred.promise;
                    },
                    site: {},
                    createSite: function () {
                        Inland.getModules().then(function () {
                            Inland.site = new Graphic(Inland.Sites.layer.templates[0].prototype.toJson());

                            // geometry needs to be initialized separately otherwise direct user entry will not work
                            Inland.site.geometry = new Point();

                            Inland.site.attributes.OBJECTID = 'new';

                            Inland.site.fields = {};
                            angular.forEach(Inland.Sites.layer.fields, function (field) {
                                Inland.site.fields[field.name] = field;
                            });

                            Inland.site.setSymbol(symbol);

                            // draw.activate(Draw.POINT);
                            iapService.clickListener.remove();
                            drawService.drawPoint(function (geometry) {

                                Inland.site.setGeometry(geometry);
                                mapService.addGraphic(Inland.site);

                                Inland.projectPoint(geometry).then(function (point) {
                                    Inland.site.coordinates = point;
                                });
                                drawService.stop();
                                iapService.clickListener.add();

                                _startEditing(Inland.site);
                            });
                        });
                    },
                    editSite: function (id) {
                        if (Inland.site.attributes === undefined || Inland.site.attributes.GLOBALID !== id) {
                            Inland.Sites.get(id).then(function (site) {
                                if (Inland.site.fields === undefined) {
                                    Inland.site.fields = {};
                                    angular.forEach(Inland.Sites.layer.fields, function (field) {
                                        Inland.site.fields[field.name] = field;
                                    });
                                }
                                Inland.site.attributes = site.feature.attributes;
                                Inland.site.coordinates = site.feature.coordinates;
                                Inland.site.geometry = site.feature.geometry;

                                //Inland.site = temp;
                                _startEditing(site.feature);
                                mapService.center(site.feature.geometry);
                            });
                        }
                    },
                    loading: false,
                    projectPoint: function (point, outSR) {
                        return arcgis.projectPoint(point, outSR);
                    },
                    query: function (searchText) {
                        var deferredResults = grpDefer();
                        Inland.getModules().then(function () {
                            var query = new Query();
                            query.where = "Name like '%" + searchText + "%'";
                            query.returnGeometry = false;
                            Inland.Sites.layer.queryFeatures(query, function (featureSet) {
                                deferredResults.resolve(featureSet.features);
                            }, function (e) {
                                console.log(e);
                            });
                        });
                        return grpPromise(deferredResults.promise);
                    },
                    Sites: {
                        clickListener: {
                            add: function () {
                                listener = Inland.Sites.layer.on('click', function (e) {
                                    $state.go('main.inland_site.general', {siteid: e.graphic.attributes.GlobalID});
                                });
                                Inland.Sites.clickListener.active = true;
                            },
                            remove: function () {
                                listener.remove();
                                Inland.Sites.clickListener.active = false;
                            },
                            active: false
                        },
                        init: function () {
                            Inland.getModules().then(function () {
                                Inland.Sites.layer = new FeatureLayer(config.serviceRoot + config.inland_sites,
                                    {outFields: ["*"]});
                                Inland.Sites.layer.setSelectionSymbol(symbol);
                                Inland.Sites.clickListener.add();
                                mapService.addLayer(Inland.Sites.layer);
                            });
                        },
                        layer: null,
                        get: function (globalId, objectId) {
                            return arcgis.getFeature(Inland.Sites.layer, globalId, objectId);
                        },
                        add: function (feature) {
                            var deferred = $q.defer();
                            arcgis.addFeature(Inland.Sites.layer, feature).then(function (result) {
                                $mdToast.showSimple("Created");
                                deferred.resolve(result);
                            });
                            return deferred.promise;
                        },
                        update: function (feature) {
                            return arcgis.updateFeature(Inland.Sites.layer, feature);
                        },
                        delete: function (feature) {
                            return arcgis.deleteFeature(Inland.Sites.layer, feature);
                        },
                        print: function (feature) {

                            var defered = grpDefer();
                            Inland.getModules().then(function () {
                                mapService.getMap().then(function (map) {
                                    var printTask = PrintTask();
                                    var mapjson = printTask._getPrintDefinition(map, {'map': map});

                                    var print_gp = new Geoprocessor(config.inland_report_service),
                                        gp_params = {
                                            f: 'json',
                                            webmap_json: JSON.stringify(mapjson),
                                            site_id: feature.attributes.GlobalID,
                                            service_root: config.serviceRoot,
                                            config_layer: config.config_layer
                                        };

                                    print_gp.submitJob(gp_params, function (e) {
                                        // in geoprocessing service the output paramater must be name ReportName
                                        // todo: add config for report name field name?
                                        if (e.jobStatus === "esriJobFailed") {
                                            $mdToast.show({
                                                template: '<md-toast ><div class="md-toast-content" md-colors="{background:\'warn-600\'}">' +
                                                'Error</div></md-toast>',
                                                hideDelay: 6000
                                            });
                                        } else {
                                            print_gp.getResultData(e.jobId, 'ReportName', function (result) {
                                                window.open(result.value.url);
                                            });
                                        }
                                        defered.resolve(e);
                                    });
                                });
                            });
                            return grpPromise(defered.promise);
                        },
                        getAttachments: function (objectId) {
                            return arcgis.getAttachments(Inland.Sites.layer, objectId);
                        },
                        uploadAttachment: function (objectId, formData) {
                            return arcgis.uploadAttachments(Inland.Sites.layer, objectId, formData);
                        },
                        deleteAttachment: function (objectId, attachmentId) {
                            return arcgis.deleteAttachments(Inland.Sites.layer, objectId, attachmentId);
                        },
                        Strategies: {
                            init: function () {
                                Inland.getModules().then(function () {
                                    Inland.Sites.Strategies.layer = new FeatureLayer(config.serviceRoot + config.inland_strategies,
                                        {outFields: ["*"]});
                                });
                            },
                            layer: null,
                            get: function (globalId, objectId) {
                                return arcgis.getRelatedFeatures(Inland.Sites.Strategies.layer, 'Site_FK', globalId, objectId);
                            },
                            add: function (feature) {
                                return arcgis.addRelatedFeature(Inland.Sites.Strategies.layer, feature);
                            },
                            update: function (feature) {
                                return arcgis.updateRelatedFeature(Inland.Sites.Strategies.layer, feature);
                            },
                            delete: function (feature) {
                                return arcgis.deleteRelatedFeature(Inland.Sites.Strategies.layer, feature);
                            },
                            setVisibility: function (globalId, visible) {
                                Inland.getModules().then(function () {
                                    var selection_mode,
                                        query;
                                    if (visible === false) {
                                        selection_mode = FeatureLayer.SELECTION_SUBTRACT;
                                    } else if (visible === true) {
                                        selection_mode = FeatureLayer.SELECTION_ADD;
                                    }

                                    query = new Query();
                                    query.where = "Strategy_FK='" + globalId + "'";

                                    Inland.Sites.Strategies.Booms.layer.selectFeatures(query, selection_mode);
                                });
                            },
                            Booms: {
                                init: function () {
                                    Inland.getModules().then(function () {
                                        Inland.Sites.Strategies.Booms.layer = new FeatureLayer(config.serviceRoot + config.inland_booms,
                                            {
                                                outFields: ["*"],
                                                mode: FeatureLayer.MODE_SELECTION
                                            });
                                    });
                                    mapService.addLayer(Inland.Sites.Strategies.Booms.layer);
                                },
                                layer: null,
                                defaultSymbol: null,
                                highlightedSymbol: null,
                                resetRenderer: function (renderer) {
                                    // remove old render, set new render and redraw layer
                                    Inland.Sites.Strategies.Booms.layer.render = null;
                                    Inland.Sites.Strategies.Booms.layer.setRenderer(renderer);
                                    Inland.Sites.Strategies.Booms.layer.redraw();
                                },
                                get: function (strategy_globalId, boom_globalId, visible, boom_objectId) {
                                    var featureDeferred = grpDefer();
                                    Inland.getModules().then(function () {
                                        var query = new Query(),
                                            selection_mode;

                                        if (strategy_globalId !== null) {
                                            query.where = "Strategy_FK='" + strategy_globalId + "'";

                                        } else if (boom_globalId !== null) {
                                            query.where = "GlobalID='" + boom_globalId + "'";
                                        } else if (boom_objectId !== null) {
                                            query.where = "OBJECTID='" + boom_objectId + "'";
                                        }
                                        if (visible === false) {
                                            selection_mode = FeatureLayer.SELECTION_SUBTRACT;
                                        } else {
                                            selection_mode = FeatureLayer.SELECTION_ADD;
                                        }

                                        query.outFields = ["*"];

                                        Inland.Sites.Strategies.Booms.layer.selectFeatures(query, selection_mode, function (features) {
                                            var data = {features: features};

                                            data.fields = {};
                                            angular.forEach(Inland.Sites.Strategies.Booms.layer.fields, function (field) {
                                                data.fields[field.name] = field;
                                            });

                                            featureDeferred.resolve(data);

                                        }, function (e) {
                                            featureDeferred.reject(e);
                                        });
                                    });
                                    return grpPromise(featureDeferred.promise);
                                },
                                setVisiblity: function (globalId, visible) {
                                    Inland.getModules().then(function () {
                                        var selection_mode,
                                            query = new Query();
                                        if (visible === false) {
                                            selection_mode = FeatureLayer.SELECTION_SUBTRACT;
                                        } else if (visible === true) {
                                            selection_mode = FeatureLayer.SELECTION_ADD;
                                        }

                                        query.where = "GlobalID='" + globalId + "'";

                                        Inland.Sites.Strategies.Booms.layer.selectFeatures(query, selection_mode);
                                    });
                                },
                                add: function (feature) {
                                    return arcgis.addRelatedFeature(Inland.Sites.Strategies.Booms.layer, feature);
                                },
                                update: function (feature) {
                                    return arcgis.updateRelatedFeature(Inland.Sites.Strategies.Booms.layer, feature);
                                },
                                delete: function (feature) {
                                    return arcgis.deleteRelatedFeature(Inland.Sites.Strategies.Booms.layer, feature);
                                }
                            }
                        }

                    },
                    //Nest under Inland rather than site
                    // RelatedContacts: new relatedContactFactory(config.inland_contacts, 'Site_FK'),
                    initialize: function () {
                        clearLayer(Inland);
                        Inland.RelatedContacts = new relatedContactFactory(config.inland_contacts, 'Site_FK');
                        runInit(Inland);
                    }
                };

                var clearLayer = function (obj) {
                    angular.forEach(obj, function (value, key) {
                        if (key === 'layer' && value !== null) {
                            obj[key] = null;
                        } else if (angular.isObject(value) && !angular.isArray(value) && key !== 'layer' && key !== 'geometry' && key !== 'symbol' && key.charAt(0) !== '_') {
                            clearLayer(value);
                        }
                    });
                };
                // run all init functions
                var runInit = function (obj) {
                    angular.forEach(obj, function (value, key) {
                        if (key === 'init') {
                            value();
                        } else if (angular.isObject(value) && !angular.isArray(value) && key !== 'layer' && key !== 'geometry' && key !== 'symbol' && key.charAt(0) !== '_') {
                            runInit(value);
                        }
                    });
                };
                // runInit(Inland);

                return Inland;
            }
        ]
    );