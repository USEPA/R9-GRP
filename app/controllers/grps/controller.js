/*global angular */
angular.module('GRPApp')
    .controller('GRPsController', function ($scope, esriAuth, $state, esriLoader, Portal, $q, configService, mapService,
                                            $mdToast, loadingService) {
        'use strict';

        $scope.state = $state;
        var epaPortal;
        mapService.destroy();

        //make sure we've authenticated prior to loading secure layer
        if (esriAuth.authenticated === true) {
            loadingService.start();
            Portal.getPortal().then(function (_epaPortal) {
                epaPortal = _epaPortal;
                epaPortal.queryItems({q: 'tags: "GRP App" type:"Feature Service"', num:9}).then(function (response) {
                    $scope.items = response.results;
                    $scope.nextParams = response.nextQueryParams;
                    $scope.$apply();
                });
            }).finally(function () {
                loadingService.stop();
            });
        } else {
            esriAuth.authenticate();
        }

        $scope.search = function (searchText) {
            var deferred = $q.defer();
            epaPortal.queryItems({q: 'tags: "GRP App" type:"Feature Service"' + 'title: "' + searchText + '"', num:9}).then(function (response) {
                $scope.items = response.results;
                $scope.nextParams = response.nextQueryParams;
                deferred.resolve();
                $scope.$apply();
            });
            return deferred.promise;
        };

        $scope.load = function (item) {

            $scope.loading = {};
            $scope.loading[item.id] = true;
            $state.go('main', {grpid: item.id}).catch(function () {
                $scope.loading[item.id] = false;
                $mdToast.show({
                    template: '<md-toast ><div class="md-toast-content" md-colors="{background:\'warn-600\'}">' +
                    'Error</div></md-toast>',
                    hideDelay: 6000
                });
            });
        };
        $scope.loadMore = function () {
            var deferred = $q.defer();
            epaPortal.queryItems($scope.nextParams).then(function (response) {
                $scope.items = $scope.items.concat(response.results);
                $scope.nextParams = response.nextQueryParams;
                deferred.resolve();
                $scope.$apply();
            });
            return deferred.promise;
        }
    });