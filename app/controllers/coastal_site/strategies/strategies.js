/**
 * Created by Travis on 12/24/2015.
 */
/*globals angular */
angular.module('GRPApp')
    .controller('CoastalStrategiesCtrl', function ($scope, $q, coastalSiteService, $state, $stateParams, SimpleLineSymbol, Color, UniqueValueRenderer) {
        'use strict';
        var strategiesDeferred = $q.defer(),
            renderer;

        $scope.strategiesPromise = strategiesDeferred.promise;

        if (coastalSiteService.Sites.layer.loaded === true) {
            loadStrategies();
        } else {
            coastalSiteService.Sites.layer.on('load', function () {
                loadStrategies();
            });
        }

        function loadStrategies() {
            coastalSiteService.Sites.Strategies.get($stateParams.siteid).then(function (data) {
                $scope.coastalSites.site.strategies = data;
                //$scope.GRP.coastal_site.strategies.fields = data.fields;

                strategiesDeferred.resolve();

                if (coastalSiteService.Sites.Strategies.Booms.defaultSymbol === null) {
                    coastalSiteService.Sites.Strategies.Booms.defaultSymbol = coastalSiteService.Sites.Strategies.Booms.layer.renderer.symbol;

                    coastalSiteService.Sites.Strategies.Booms.highlightedSymbol = new SimpleLineSymbol(coastalSiteService.Sites.Strategies.Booms.defaultSymbol.toJson());
                    coastalSiteService.Sites.Strategies.Booms.highlightedSymbol.setWidth(4);
                    coastalSiteService.Sites.Strategies.Booms.highlightedSymbol.setColor(new Color([255, 170, 0, 1]));
                }

                loadBooms();
            });
        }

        function loadBooms() {
            renderer = new UniqueValueRenderer(coastalSiteService.Sites.Strategies.Booms.defaultSymbol, "Strategy_FK");

            angular.forEach($scope.coastalSites.site.strategies, function (strategy, i) {
                coastalSiteService.Sites.Strategies.Booms.get(strategy.attributes.GlobalID, null, strategy.visible)
                    .then(function (boom) {
                        strategy.booms = boom.features;
                    });
            });
        }

        $scope.viewStrategy = function (id) {
            $state.go('main.coastal_site.strategies.strategy', {strategyid: id});
        };

        $scope.toggleBooms = function (id, visible) {
            coastalSiteService.Sites.Strategies.setVisibility(id, visible);
        };


        // reload booms in case some where added/edited/deleted
        $scope.$on('$stateChangeSuccess', function () {
            if ($state.current.name === 'main.coastal_site.strategies') {
                loadBooms();
            }
        });

        // when leaving this state clear boom features
        $scope.$on('$destroy', function () {
            coastalSiteService.Sites.Strategies.Booms.layer.clearSelection();
        });

        coastalSiteService.Sites.Strategies.Booms.layer.on('click', function (e) {
            $state.go('main.coastal_site.strategies.strategy.boom', {
                strategyid: e.graphic.attributes.Strategy_FK,
                boomid: e.graphic.attributes.GlobalID
            });
        });

        $scope.highlightStrategy = function (strategy) {
            renderer.addValue(strategy.attributes.GlobalID, coastalSiteService.Sites.Strategies.Booms.highlightedSymbol);
            coastalSiteService.Sites.Strategies.Booms.resetRenderer(renderer);
        };

        $scope.removeStrategyHighlight = function (strategy) {
            renderer.removeValue(strategy.attributes.GlobalID);
            coastalSiteService.Sites.Strategies.Booms.resetRenderer(renderer);
        };
    });