/**
 * Created by Travis on 12/24/2015.
 */
'use strict';
/*global angular */
angular.module('GRPApp')
    .controller('CoastalStrategyCtrl', function ($scope, $q, coastalSiteService, $state, $stateParams, strategy, $filter, $mdDialog,
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
                $scope.strategy = new Graphic(coastalSiteService.Sites.Strategies.layer.templates[0].prototype.toJson());
                $scope.strategy.attributes.Site_FK = $scope.coastalSites.site.attributes.GlobalID;

                $scope.strategy.fields = {};
                angular.forEach(coastalSiteService.Sites.Strategies.layer.fields, function (field, i) {
                    $scope.strategy.fields[field.name] = field;
                });

                coastalSiteService.Sites.Strategies.Booms.layer.clearSelection();
            } else {
                angular.forEach($scope.coastalSites.site.strategies, function (s, i) {
                    if (s.attributes.GlobalID === $stateParams.strategyid) {
                        $scope.strategy.attributes = $scope.coastalSites.site.strategies[i].attributes;
                        $scope.strategy.fields = {};
                        angular.forEach(coastalSiteService.Sites.Strategies.layer.fields, function (field, i) {
                            $scope.strategy.fields[field.name] = field;
                        });
                        loadBooms();
                    }
                });
            }
        }

        function loadBooms() {
            $scope.strategy.boom = {};

            coastalSiteService.Sites.Strategies.Booms.layer.clearSelection();

            coastalSiteService.Sites.Strategies.Booms.get($stateParams.strategyid).then(function (boom) {
                $scope.strategy.boom.features = boom.features;
                $scope.strategy.boom.fields = boom.fields;

                renderer = new UniqueValueRenderer(coastalSiteService.Sites.Strategies.Booms.defaultSymbol, "GlobalID");

                boomsDeferred.resolve();
            });
        }

        $scope.toggleBoom = function (id, visible) {
            coastalSiteService.Sites.Strategies.Booms.setVisiblity(id, visible);
        };

        $scope.saveStrategy = function () {
            if ($scope.strategy.attributes.GlobalID) {
                coastalSiteService.Sites.Strategies.update($scope.strategy).then(function (results) {
                    $state.go('main.coastal_site.strategies');
                });
            } else {
                $scope.strategy.attributes.Site_FK = $scope.coastalSites.site.attributes.GlobalID;
                coastalSiteService.Sites.Strategies.add($scope.strategy).then(function (results) {
                    coastalSiteService.Sites.Strategies.get(null, results[0].objectId).then(function (data) {
                        $scope.coastalSites.site.strategies.push(data[0]);
                        $state.go('main.coastal_site.strategies.strategy', {strategyid: data[0].attributes.GlobalID});
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
                coastalSiteService.Sites.Strategies.delete($scope.strategy).then(function (results) {
                    var deleted_strategy,
                        delete_index;
                    deleted_strategy = $filter('filter')($scope.coastalSites.site.strategies,
                        {attributes: {OBJECTID: results[0].objectId}})[0];
                    delete_index = $scope.coastalSites.site.strategies.indexOf(deleted_strategy);
                    $scope.coastalSites.site.strategies.splice(delete_index, 1);
                    $state.go('main.coastal_site.strategies');
                });
            });
        };

        $scope.highlightBoom = function (boom) {
            renderer.addValue(boom.attributes.GlobalID, coastalSiteService.Sites.Strategies.Booms.highlightedSymbol);
            coastalSiteService.Sites.Strategies.Booms.resetRenderer(renderer);
        };

        $scope.removeBoomHighlight = function (boom) {
            renderer.removeValue(boom.attributes.GlobalID);
            coastalSiteService.Sites.Strategies.Booms.resetRenderer(renderer);
        };

        //reload booms in case some where added/edited/deleted
        $scope.$on('$stateChangeSuccess', function () {
            if ($state.current.name === 'main.coastal_site.strategies.strategy' && $state.params.strategyid !== 'new') {
                loadBooms();
            }
        });
    })
    .filter('boomType', function ($filter) {
        return function (input, domain) {
            return $filter('filter')(domain, {code: input})[0].name;
        };
    });