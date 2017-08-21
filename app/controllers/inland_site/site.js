/**
 * Created by Travis on 12/24/2015.
 */
/*global angular */
angular.module('GRPApp')
    .controller('InlandSiteCtrl', function ($scope, $q, site, $state, $stateParams, $mdDialog,
                                      $mdToast, inlandSiteService, mapService, editService, drawService) {
        'use strict';

        $scope.siteMode = true;
        //$scope.inland_site = inland_site;
        //$scope.inland_site = inlandSiteService.inland_site;
        var siteDeferred = $q.defer();
        $scope.sitePromise = siteDeferred.promise;

        function startEditing(feature) {
            editService.move(feature, function (geometry) {
                inlandSiteService.projectPoint(geometry).then(function (point) {
                    $scope.inlandSites.site.geometry = point;
                });
            });
        }

        function loadSite() {
            if ($stateParams.siteid === 'new') {
                inlandSiteService.createSite();
            } else {
                inlandSiteService.editSite($stateParams.siteid);
            }

            $scope.$on('$destroy', function () {
                editService.stop();
                drawService.stop();
                mapService.clearMap();
            });

            $scope.save = function () {
                if ($scope.inlandSites.site.attributes.OBJECTID === 'new') {

                    inlandSiteService.Sites.add($scope.inlandSites.site).then(function (result) {

                        mapService.clearMap();
                        inlandSiteService.Sites.layer.refresh();
                        inlandSiteService.Sites.get(null, result[0].objectId).then(function (site) {
                            $state.go('main.inland_site.general', {siteid: site.feature.attributes.GlobalID});
                        });

                    });
                } else {
                    inlandSiteService.Sites.update($scope.inlandSites.site);
                }

            };

            $scope.delete = function (site, ev) {
                // Appending dialog to document.body to cover sidenav in docs app
                var confirm = $mdDialog.confirm()
                    .title('Delete?')
                    .textContent('Are you sure you want to delete this sensitive inland_site and all related information?')
                    .ariaLabel('Delete')
                    .targetEvent(ev)
                    .ok('Yes')
                    .cancel('No');
                $mdDialog.show(confirm).then(function () {
                    inlandSiteService.Sites.delete(site).then(function () {
                        $state.go('main');
                    });
                });
            };

            $scope.export = function (site) {
                $mdToast.show({
                    'template': '<md-toast><div class="md-toast-content">Loading...<span flex></span>' +
                    '<md-progress-circular md-mode="indeterminate" class="md-accent" md-diameter="25"></md-progress-circular>' +
                    '</div></md-toast>',
                    'hideDelay': 0
                });
                $scope.exportLoading = true;
                inlandSiteService.Sites.print(site).finally(function () {
                    $scope.exportLoading = false;
                    $mdToast.hide();
                });

            };

        }

        mapService.getMap().then(function (map) {
            if (inlandSiteService.Sites.layer.loaded === true) {
                loadSite(map);
            } else {
                map.on('layers-add-result', function () {
                    loadSite(map);
                });
            }
        });

    });