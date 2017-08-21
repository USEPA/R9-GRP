/**
 * Created by Travis on 12/24/2015.
 */
'use strict';
/*global angular */
angular.module('GRPApp')
    .controller('InlandStrategyCtrl', function ($scope, $q, inlandSiteService, $state, $stateParams, strategy, $filter, $mdDialog,
                                          Graphic, UniqueValueRenderer) {
        var boomsDeferred,
            renderer;

        //$scope.editActive = false;

        boomsDeferred = $q.defer();
        $scope.boomsPromise = boomsDeferred.promise;

        $scope.strategy = strategy;

        $scope.strategiesPromise.then(function () {
            loadStrategy();
        });

        function loadStrategy() {
            // is this better than hitting the service again?
            if ($stateParams.strategyid === 'new') {
                $scope.strategy = new Graphic(inlandSiteService.Sites.Strategies.layer.templates[0].prototype.toJson());
                $scope.strategy.attributes.Site_FK = $scope.inlandSites.site.attributes.GlobalID;

                $scope.strategy.fields = {};
                angular.forEach(inlandSiteService.Sites.Strategies.layer.fields, function (field, i) {
                    $scope.strategy.fields[field.name] = field;
                });

                inlandSiteService.Sites.Strategies.Booms.layer.clearSelection();
            } else {
                angular.forEach($scope.inlandSites.site.strategies, function (s, i) {
                    if (s.attributes.GlobalID === $stateParams.strategyid) {
                        $scope.strategy.attributes = $scope.inlandSites.site.strategies[i].attributes;
                        $scope.strategy.fields = {};
                        angular.forEach(inlandSiteService.Sites.Strategies.layer.fields, function (field, i) {
                            $scope.strategy.fields[field.name] = field;
                        });
                        loadBooms();
                    }
                });
            }
        }

        function loadBooms() {
            $scope.strategy.boom = {};

            inlandSiteService.Sites.Strategies.Booms.layer.clearSelection();

            inlandSiteService.Sites.Strategies.Booms.get($stateParams.strategyid).then(function (boom) {
                $scope.strategy.boom.features = boom.features;
                $scope.strategy.boom.fields = boom.fields;

                renderer = new UniqueValueRenderer(inlandSiteService.Sites.Strategies.Booms.defaultSymbol, "GlobalID");

                boomsDeferred.resolve();
            });
        }

        $scope.toggleBoom = function (id, visible) {
            inlandSiteService.Sites.Strategies.Booms.setVisiblity(id, visible);
        };

        $scope.saveStrategy = function () {
            if ($scope.strategy.attributes.GlobalID) {
                inlandSiteService.Sites.Strategies.update($scope.strategy).then(function (results) {
                    $state.go('main.inland_site.strategies');
                });
            } else {
                $scope.strategy.attributes.Site_FK = $scope.inlandSites.site.attributes.GlobalID;
                inlandSiteService.Sites.Strategies.add($scope.strategy).then(function (results) {
                    inlandSiteService.Sites.Strategies.get(null, results[0].objectId).then(function (data) {
                        $scope.inlandSites.site.strategies.push(data[0]);
                        $state.go('main.inland_site.strategies.strategy', {strategyid: data[0].attributes.GlobalID});
                    });
                });
            }
        };

        $scope.deleteStrategy = function (ev) {

            // Appending dialog to document.body to cover sidenav in docs app
            var confirm = $mdDialog.confirm()
                .title('Delete?')
                .textContent('Are you sure you want to delete this strategy?')
                .ariaLabel('')
                .targetEvent(ev)
                .ok('Yes')
                .cancel('No');
            $mdDialog.show(confirm).then(function () {
                inlandSiteService.Sites.Strategies.delete($scope.strategy).then(function (results) {
                    var deleted_strategy,
                        delete_index;
                    deleted_strategy = $filter('filter')($scope.inlandSites.site.strategies,
                        {attributes: {OBJECTID: results[0].objectId}})[0];
                    delete_index = $scope.inlandSites.site.strategies.indexOf(deleted_strategy);
                    $scope.inlandSites.site.strategies.splice(delete_index, 1);
                    $state.go('main.inland_site.strategies');
                });
            });
        };

        $scope.highlightBoom = function (boom) {
            renderer.addValue(boom.attributes.GlobalID, inlandSiteService.Sites.Strategies.Booms.highlightedSymbol);
            inlandSiteService.Sites.Strategies.Booms.resetRenderer(renderer);
        };

        $scope.removeBoomHighlight = function (boom) {
            renderer.removeValue(boom.attributes.GlobalID);
            inlandSiteService.Sites.Strategies.Booms.resetRenderer(renderer);
        };

        //reload booms in case some where added/edited/deleted
        $scope.$on('$stateChangeSuccess', function () {
            if ($state.current.name === 'main.inland_site.strategies.strategy' && $state.params.strategyid !== 'new') {
                loadBooms();
            }
        });
    })
    .filter('boomType', function ($filter) {
        return function (input, domain) {
            return $filter('filter')(domain, {code: input})[0].name;
        };
    });