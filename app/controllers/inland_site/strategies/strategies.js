/**
 * Created by Travis on 12/24/2015.
 */
/*globals angular */
angular.module('GRPApp')
    .controller('InlandStrategiesCtrl', function ($scope, $q, inlandSiteService, $state, $stateParams, SimpleLineSymbol, Color, UniqueValueRenderer) {
        'use strict';
        var strategiesDeferred = $q.defer(),
            renderer;

        $scope.strategiesPromise = strategiesDeferred.promise;

        if (inlandSiteService.Sites.layer.loaded === true) {
            loadStrategies();
        } else {
            inlandSiteService.Sites.layer.on('load', function () {
                loadStrategies();
            });
        }

        function loadStrategies() {
            inlandSiteService.Sites.Strategies.get($stateParams.siteid).then(function (data) {
                $scope.inlandSites.site.strategies = data;
                //$scope.GRP.inland_site.strategies.fields = data.fields;

                strategiesDeferred.resolve();

                if (inlandSiteService.Sites.Strategies.Booms.defaultSymbol === null) {
                    inlandSiteService.Sites.Strategies.Booms.defaultSymbol = inlandSiteService.Sites.Strategies.Booms.layer.renderer.symbol;

                    inlandSiteService.Sites.Strategies.Booms.highlightedSymbol = new SimpleLineSymbol(inlandSiteService.Sites.Strategies.Booms.defaultSymbol.toJson());
                    inlandSiteService.Sites.Strategies.Booms.highlightedSymbol.setWidth(4);
                    inlandSiteService.Sites.Strategies.Booms.highlightedSymbol.setColor(new Color([255, 170, 0, 1]));
                }

                loadBooms();
            });
        }

        function loadBooms() {
            renderer = new UniqueValueRenderer(inlandSiteService.Sites.Strategies.Booms.defaultSymbol, "Strategy_FK");

            angular.forEach($scope.inlandSites.site.strategies, function (strategy, i) {
                inlandSiteService.Sites.Strategies.Booms.get(strategy.attributes.GlobalID, null, strategy.visible)
                    .then(function (boom) {
                        strategy.booms = boom.features;
                    });
            });
        }

        $scope.viewStrategy = function (id) {
            $state.go('main.inland_site.strategies.strategy', {strategyid: id});
        };

        $scope.toggleBooms = function (id, visible) {
            inlandSiteService.Sites.Strategies.setVisibility(id, visible);
        };


        // reload booms in case some where added/edited/deleted
        $scope.$on('$stateChangeSuccess', function () {
            if ($state.current.name === 'main.inland_site.strategies') {
                loadBooms();
            }
        });

        // when leaving this state clear boom features
        $scope.$on('$destroy', function () {
            inlandSiteService.Sites.Strategies.Booms.layer.clearSelection();
        });

        inlandSiteService.Sites.Strategies.Booms.layer.on('click', function (e) {
            $state.go('main.inland_site.strategies.strategy.boom', {
                strategyid: e.graphic.attributes.Strategy_FK,
                boomid: e.graphic.attributes.GlobalID
            });
        });

        $scope.highlightStrategy = function (strategy) {
            renderer.addValue(strategy.attributes.GlobalID, inlandSiteService.Sites.Strategies.Booms.highlightedSymbol);
            inlandSiteService.Sites.Strategies.Booms.resetRenderer(renderer);
        };

        $scope.removeStrategyHighlight = function (strategy) {
            renderer.removeValue(strategy.attributes.GlobalID);
            inlandSiteService.Sites.Strategies.Booms.resetRenderer(renderer);
        };
    });