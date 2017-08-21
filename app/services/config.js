/**
 * Created by Travis on 12/14/2016.
 */
/*jslint todo: true */
/*global angular */
/*global window */
/*global console */
angular.module('GRPApp')
    .service('configService', function ($http, IdentityManager, $q, esriLoader, $filter) {
        'use strict';

        var configObj = {
            serviceRoot: '',
            coastal_sites: '',
            coastal_strategies: '',
            coastal_booms: '',
            coastal_contacts: '',
            coastal_report_service: 'https://utility.arcgis.com/usrsvcs/servers/bf1557e5b55542e4b38f40901dbca821/rest/services/R9GIS/CoastalZoneReport/GPServer/CoastalZoneReport',
            inland_sites: '',
            inland_strategies: '',
            inland_booms: '',
            inland_contacts: '',
            inland_report_service: 'https://utility.arcgis.com/usrsvcs/servers/17600b5384f14fda89834ec43be75b62/rest/services/R9GIS/GRPInlandZoneReport/GPServer/InlandZoneReport',
            iaps: '',
            iap_contacts: '',
            ics202_categories: '',
            ics202_category_defaults: '',
            ics202_objectives: '',
            ics202_objective_defaults: '',
            ics204_assignments: '',
            ics_204_assignment_defaults: '',
            ics204_contacts: '',
            ics204_resources: '',
            ics_206: '',
            ics_234_objectives: '',
            ics_234_strategies: '',
            ics_234_tactics: '',
            ics_234_objective_defaults: '',
            ics_234_strategy_defaults: '',
            ics_234_tactic_defaults: '',
            ics_205: '',
            iap_report_service: 'https://utility.arcgis.com/usrsvcs/servers/ae6d31d1feec464aadd8ac9726aeb35d/rest/services/R9GIS/IAPReport/GPServer/IAP',
            contacts: '',
            coastalZone: false,
            inlandZone: false
        };
        return {
            getConfig: function () {
                return configObj;
            },
            resetRoot: function (service_item) {
                var deferred = $q.defer();
                configObj.serviceRoot = service_item.url + '/';
                var grp_tag = $filter('filter')(service_item.tags, 'GRP App')[0].split(':');
                configObj.config_layer = grp_tag[1] ? grp_tag[1] : '5';
                configObj.coastalZone = false;
                configObj.inlandZone = false;
                esriLoader.require(['esri/tasks/query', 'esri/layers/FeatureLayer'], function (Query, FeatureLayer) {
                    var query = new Query(),
                        configLayer = new FeatureLayer(configObj.serviceRoot + configObj.config_layer);
                    query.where = "1=1";
                    query.outFields = ['*'];
                    query.returnGeometry = false;
                    configLayer.queryFeatures(query, function (featureSet) {
                        angular.forEach(featureSet.features, function (layerConfig) {
                            if (layerConfig.attributes.layer_index !== null) {
                                configObj[layerConfig.attributes.layer] = layerConfig.attributes.layer_index.toString();
                                if (layerConfig.attributes.layer === 'coastal_sites') {
                                    configObj.coastalZone = true;
                                } else if (layerConfig.attributes.layer === 'inland_sites') {
                                    configObj.inlandZone = true;
                                }
                            } else {
                                configObj[layerConfig.attributes.layer] = '';
                            }
                        });
                        deferred.resolve();
                    });
                });
                return deferred.promise;
            }
        };
    });