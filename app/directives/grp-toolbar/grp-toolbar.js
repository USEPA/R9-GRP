/**
 * Created by Travis on 12/24/2015.
 */
/*global angular */
angular.module('GRPApp')
    .directive('grpToolbar', function ($q, $state, site, strategy, esriAuth, coastalSiteService, inlandSiteService,
                                       iapService, contact, configService, $filter, grpFeatureService) {
        'use strict';
        return {
            restrict: 'E',
            scope: {
                state: '=state',
                altSearch: '&'
            },
            templateUrl: 'directives/grp-toolbar/grp-toolbar.html',
            controller: function ($scope) {
                var config = configService.getConfig();
                $scope.coastalSites = coastalSiteService;
                $scope.inlandSites = inlandSiteService;
                $scope.IAP = iapService;
                $scope.strategy = strategy;
                $scope.authenticated = esriAuth.authenticated;
                $scope.config = config;
                $scope.featureServiceName = grpFeatureService.name;

                $scope.getMatches = function (searchText) {
                    if (!$state.is('main.contacts') && !$state.is('grps')) {
                        var allPromises = [], allResults = [], deferredResults = $q.defer();

                        if (config.inlandZone) {allPromises.push(inlandSiteService.query(searchText));}
                        if (config.coastalZone) {allPromises.push(coastalSiteService.query(searchText));}
                        allPromises.push(iapService.query(searchText));

                        $q.all(allPromises).then(function (results) {
                            angular.forEach(results, function (result) {
                                allResults = allResults.concat(result);
                            });
                            var orderedResults = $filter('orderBy')(allResults, 'attributes.Name');
                            deferredResults.resolve(orderedResults);
                        });
                        return deferredResults.promise;
                    } else {
                        return $scope.altSearch({searchText: searchText});
                    }
                };

                $scope.selectedItemChange = function (item) {
                    if (item) {
                        $scope.searchText = '';
                        if (coastalSiteService.Sites.layer.name === item._layer.name) {
                            $scope.siteMode = true;
                            $state.go('main.coastal_site.general', {siteid: item.attributes.GlobalID});
                        } else if (inlandSiteService.Sites.layer.name === item._layer.name) {
                            $scope.siteMode = true;
                            $state.go('main.inland_site.general', {siteid: item.attributes.GlobalID});
                        } else if (iapService.layer.name === item._layer.name) {
                            $scope.iapMode = true;
                            $state.go('main.iap.general', {planid: item.attributes.GlobalID});
                        }
                    }
                };

                $scope.go = function (target) {
                    $state.go(target);
                };
            }
        };
    });