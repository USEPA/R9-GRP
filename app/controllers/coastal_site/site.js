/**
 * Created by Travis on 12/24/2015.
 */
/*global angular */
angular.module('GRPApp')
    .controller('CoastalSiteCtrl', function ($scope, $q, site, $state, $stateParams, $mdDialog,
                                      $mdToast, coastalSiteService, mapService, editService, drawService, iapService) {
        'use strict';

        $scope.siteMode = true;
        //$scope.coastal_site = coastal_site;
        //$scope.coastal_site = coastalSiteService.coastal_site;
        var siteDeferred = $q.defer();
        $scope.sitePromise = siteDeferred.promise;

        function startEditing(feature) {
            editService.move(feature, function (geometry) {
                coastalSiteService.projectPoint(geometry).then(function (point) {
                    $scope.coastalSites.site.geometry = point;
                });
            });
        }

        function loadSite() {
            if ($stateParams.siteid === 'new') {
                coastalSiteService.createSite();
            } else {
                coastalSiteService.editSite($stateParams.siteid);
            }

            $scope.$on('$destroy', function () {
                editService.stop();
                drawService.stop();
                mapService.clearMap();
            });

            $scope.save = function () {
                if ($scope.coastalSites.site.attributes.OBJECTID === 'new') {

                    coastalSiteService.Sites.add($scope.coastalSites.site).then(function (result) {

                        mapService.clearMap();
                        coastalSiteService.Sites.layer.refresh();
                        coastalSiteService.Sites.get(null, result[0].objectId).then(function (site) {
                            $state.go('main.coastal_site.general', {siteid: site.feature.attributes.GlobalID});
                        });

                    });
                } else {
                    coastalSiteService.Sites.update($scope.coastalSites.site);
                }

            };

            $scope.delete = function (site, ev) {
                // Appending dialog to document.body to cover sidenav in docs app
                var confirm = $mdDialog.confirm()
                    .title('Delete?')
                    .textContent('Are you sure you want to delete this sensitive coastal_site and all related information?')
                    .ariaLabel('Delete')
                    .targetEvent(ev)
                    .ok('Yes')
                    .cancel('No');
                $mdDialog.show(confirm).then(function () {
                    coastalSiteService.Sites.delete(site).then(function () {
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
                coastalSiteService.Sites.print(site).finally(function () {
                    $scope.exportLoading = false;
                    $mdToast.hide();
                });
            };
        }

        mapService.getMap().then(function (map) {
            if (coastalSiteService.Sites.layer.loaded === true) {
                loadSite(map);
            } else {
                map.on('layers-add-result', function () {
                    loadSite(map);
                });
            }
        });

    });