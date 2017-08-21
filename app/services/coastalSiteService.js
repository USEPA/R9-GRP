/**
 * Created by Travis on 11/20/2015.
 */
/*jslint todo: true */
/*global angular */
/*global window */
/*global console */
angular.module('GRPApp')
    .service('coastalSiteService', ['$q', 'arcgisService', 'esriLoader', 'contactService', '$state', 'editService', 'mapService', 'drawService', 'relatedContactFactory', '$mdToast', 'iapService', 'configService',
        function ($q, arcgis, esriLoader, contactService, $state, editService, mapService, drawService, relatedContactFactory, $mdToast, iapService, configService) {
            'use strict';
            var Coastal = {},
                config = configService.getConfig();

            function _startEditing(feature) {
                editService.move(feature, function (geometry) {
                    Coastal.projectPoint(geometry).then(function (point) {
                        Coastal.site.coordinates = point;
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
                listener;

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
                    Coastal.loading = false;
                });
                return promise;
            }

            function grpDefer() {
                Coastal.loading = true;
                return $q.defer();
            }

            Coastal = {
                getModules: function () {
                    return deferred.promise;
                },
                site: {},
                createSite: function () {
                    Coastal.getModules().then(function () {
                        Coastal.site = new Graphic(Coastal.Sites.layer.templates[0].prototype.toJson());

                        // geometry needs to be initialized separately otherwise direct user entry will not work
                        Coastal.site.geometry = new Point();

                        Coastal.site.attributes.OBJECTID = 'new';

                        Coastal.site.fields = {};
                        angular.forEach(Coastal.Sites.layer.fields, function (field) {
                            Coastal.site.fields[field.name] = field;
                        });

                        Coastal.site.setSymbol(symbol);

                        // draw.activate(Draw.POINT);
                        iapService.clickListener.remove();
                        drawService.drawPoint(function (geometry) {

                            Coastal.site.setGeometry(geometry);
                            mapService.addGraphic(Coastal.site);

                            Coastal.projectPoint(geometry).then(function (point) {
                                Coastal.site.coordinates = point;
                            });
                            drawService.stop();
                            iapService.clickListener.add();

                            _startEditing(Coastal.site);
                        });
                    });
                },
                editSite: function (id) {
                    if (Coastal.site.attributes === undefined || Coastal.site.attributes.GLOBALID !== id) {
                        Coastal.Sites.get(id).then(function (site) {
                            if (Coastal.site.fields === undefined) {
                                Coastal.site.fields = {};
                                angular.forEach(Coastal.Sites.layer.fields, function (field) {
                                    Coastal.site.fields[field.name] = field;
                                });
                            }
                            Coastal.site.attributes = site.feature.attributes;
                            Coastal.site.coordinates = site.feature.coordinates;
                            Coastal.site.geometry = site.feature.geometry;

                            //Coastal.site = temp;
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
                    Coastal.getModules().then(function () {
                        var query = new Query();
                        query.where = "Name like '%" + searchText + "%'";
                        query.returnGeometry = false;
                        Coastal.Sites.layer.queryFeatures(query, function (featureSet) {
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
                            listener = Coastal.Sites.layer.on('click', function (e) {
                                $state.go('main.coastal_site.general', {siteid: e.graphic.attributes.GlobalID});
                            });
                            Coastal.Sites.clickListener.active = true;
                        },
                        remove: function () {
                            listener.remove();
                            Coastal.Sites.clickListener.active = false;
                        },
                        active: false
                    },
                    init: function () {
                        Coastal.getModules().then(function () {
                            Coastal.Sites.layer = new FeatureLayer(config.serviceRoot + config.coastal_sites,
                                {outFields: ["*"]});
                            Coastal.Sites.layer.setSelectionSymbol(symbol);
                            Coastal.Sites.clickListener.add();
                            mapService.addLayer(Coastal.Sites.layer);
                            // draw = new Draw(map);
                        });
                    },
                    layer: null,
                    get: function (globalId, objectId) {
                        return arcgis.getFeature(Coastal.Sites.layer, globalId, objectId);
                    },
                    add: function (feature) {
                        var deferred = $q.defer();
                        arcgis.addFeature(Coastal.Sites.layer, feature).then(function (result) {
                            $mdToast.showSimple("Created");
                            deferred.resolve(result);
                        });
                        return deferred.promise;
                    },
                    update: function (feature) {
                        return arcgis.updateFeature(Coastal.Sites.layer, feature);
                    },
                    delete: function (feature) {
                        return arcgis.deleteFeature(Coastal.Sites.layer, feature);
                    },
                    print: function (feature) {

                        var defered = grpDefer();
                        Coastal.getModules().then(function () {
                            mapService.getMap().then(function (map) {
                                var printTask = PrintTask();
                                var mapjson = printTask._getPrintDefinition(map, {'map': map});

                                var print_gp = new Geoprocessor(config.coastal_report_service),
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
                        return arcgis.getAttachments(Coastal.Sites.layer, objectId);
                    },
                    uploadAttachment: function (objectId, formData) {
                        return arcgis.uploadAttachments(Coastal.Sites.layer, objectId, formData);
                    },
                    deleteAttachment: function (objectId, attachmentId) {
                        return arcgis.deleteAttachments(Coastal.Sites.layer, objectId, attachmentId);
                    },
                    Strategies: {
                        init: function () {
                            Coastal.getModules().then(function () {
                                Coastal.Sites.Strategies.layer = new FeatureLayer(config.serviceRoot + config.coastal_strategies,
                                    {outFields: ["*"]});
                            });
                        },
                        layer: null,
                        get: function (globalId, objectId) {
                            return arcgis.getRelatedFeatures(Coastal.Sites.Strategies.layer, 'Site_FK', globalId, objectId);
                        },
                        add: function (feature) {
                            return arcgis.addRelatedFeature(Coastal.Sites.Strategies.layer, feature);
                        },
                        update: function (feature) {
                            return arcgis.updateRelatedFeature(Coastal.Sites.Strategies.layer, feature);
                        },
                        delete: function (feature) {
                            return arcgis.deleteRelatedFeature(Coastal.Sites.Strategies.layer, feature);
                        },
                        setVisibility: function (globalId, visible) {
                            Coastal.getModules().then(function () {
                                var selection_mode,
                                    query;
                                if (visible === false) {
                                    selection_mode = FeatureLayer.SELECTION_SUBTRACT;
                                } else if (visible === true) {
                                    selection_mode = FeatureLayer.SELECTION_ADD;
                                }

                                query = new Query();
                                query.where = "Strategy_FK='" + globalId + "'";

                                Coastal.Sites.Strategies.Booms.layer.selectFeatures(query, selection_mode);
                            });
                        },
                        Booms: {
                            init: function () {
                                Coastal.getModules().then(function () {
                                    Coastal.Sites.Strategies.Booms.layer = new FeatureLayer(config.serviceRoot + config.coastal_booms,
                                        {
                                            outFields: ["*"],
                                            mode: FeatureLayer.MODE_SELECTION
                                        });
                                    mapService.addLayer(Coastal.Sites.Strategies.Booms.layer);
                                });
                            },
                            layer: null,
                            defaultSymbol: null,
                            highlightedSymbol: null,
                            resetRenderer: function (renderer) {
                                // remove old render, set new render and redraw layer
                                Coastal.Sites.Strategies.Booms.layer.render = null;
                                Coastal.Sites.Strategies.Booms.layer.setRenderer(renderer);
                                Coastal.Sites.Strategies.Booms.layer.redraw();
                            },
                            get: function (strategy_globalId, boom_globalId, visible, boom_objectId) {
                                var featureDeferred = grpDefer();
                                Coastal.getModules().then(function () {
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

                                    Coastal.Sites.Strategies.Booms.layer.selectFeatures(query, selection_mode, function (features) {
                                        var data = {features: features};

                                        data.fields = {};
                                        angular.forEach(Coastal.Sites.Strategies.Booms.layer.fields, function (field) {
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
                                Coastal.getModules().then(function () {
                                    var selection_mode,
                                        query = new Query();
                                    if (visible === false) {
                                        selection_mode = FeatureLayer.SELECTION_SUBTRACT;
                                    } else if (visible === true) {
                                        selection_mode = FeatureLayer.SELECTION_ADD;
                                    }

                                    query.where = "GlobalID='" + globalId + "'";

                                    Coastal.Sites.Strategies.Booms.layer.selectFeatures(query, selection_mode);
                                });
                            },
                            add: function (feature) {
                                return arcgis.addRelatedFeature(Coastal.Sites.Strategies.Booms.layer, feature);
                            },
                            update: function (feature) {
                                return arcgis.updateRelatedFeature(Coastal.Sites.Strategies.Booms.layer, feature);
                            },
                            delete: function (feature) {
                                return arcgis.deleteRelatedFeature(Coastal.Sites.Strategies.Booms.layer, feature);
                            }
                        }
                    }

                },
                //Nest under Coastal rather than site
                // RelatedContacts: new relatedContactFactory(config.coastal_contacts, 'Site_FK'),
                initialize: function () {
                    clearLayer(Coastal);
                    Coastal.RelatedContacts = new relatedContactFactory(config.coastal_contacts, 'Site_FK');
                    runInit(Coastal);
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
            // runInit(Coastal);

            return Coastal;
        }]);