/**
 * Created by Travis on 12/24/2015.
 */
/*globals angular */
angular.module('GRPApp')
    .controller('CoastalBoomCtrl', function ($scope, coastalSiteService, $state, $stateParams, $mdToast, $mdDialog, $filter,
                                        Graphic, drawService, editService, mapService, iapService) {
        'use strict';
        function startEditing() {
            editService.edit_verticies($scope.boom, function (geometry) {
                $scope.boom.geometry = geometry;
            });
        }
        $scope.boomsPromise.then(function () {
            if ($stateParams.boomid === 'new') {

                $scope.boom = new Graphic(coastalSiteService.Sites.Strategies.Booms.layer.templates[0].prototype.toJson());
                $scope.boom.attributes.Strategy_FK = $scope.strategy.attributes.GlobalID;
                $scope.boom.fields = $scope.strategy.boom.fields;
                $scope.boom.symbol = coastalSiteService.Sites.Strategies.Booms.layer.renderer.defaultSymbol;

                iapService.clickListener.remove();
                drawService.drawPolyline(function (geometry) {
                    drawService.stop();
                    $scope.boom.geometry = geometry;
                    mapService.addGraphic($scope.boom);
                    iapService.clickListener.add();
                    startEditing();
                });
                $scope.drawActive = true;
            } else {
                angular.forEach($scope.strategy.boom.features, function (boom, i) {
                    if (boom.attributes.GlobalID === $stateParams.boomid) {

                        $scope.boom = boom;
                        //$scope.boom.attributes = $scope.strategy.boom.features[i].attributes;
                        $scope.boom.fields = $scope.strategy.boom.fields;

                        // in case things are highlight... clear the highlight prior to init edit
                        mapService.clearMap();
                        startEditing();
                        $scope.$parent.editActive = true;
                    } else {
                        coastalSiteService.Sites.Strategies.Booms.setVisiblity(boom.attributes.GlobalID, false);
                    }
                });
            }
        });

        $scope.saveBoom = function () {
            if ($scope.boom.attributes.GlobalID) {
                coastalSiteService.Sites.Strategies.Booms.update($scope.boom).then(function () {
                    $state.go('main.coastal_site.strategies.strategy');
                });
            } else {
                if ($scope.boom.geometry !== null) {
                    $scope.boom.attributes.Site_FK = $scope.coastalSites.site.attributes.GlobalID;
                    coastalSiteService.Sites.Strategies.Booms.add($scope.boom).then(function (results) {
                        coastalSiteService.Sites.Strategies.Booms.get(null, null, null, results[0].objectId).then(function (boom) {
                            $scope.strategy.boom.features.push(boom.features[0]);
                            $state.go('main.coastal_site.strategies.strategy');
                        });
                    });
                } else {
                    $mdToast.showSimple("Draw boom before saving.");
                }
            }
            mapService.clearMap();
        };

        $scope.deleteBoom = function (ev) {
            // Appending dialog to document.body to cover sidenav in docs app
            var confirm = $mdDialog.confirm()
                .title('Delete?')
                .textContent('Are you sure you want to delete this boom?')
                .ariaLabel('')
                .targetEvent(ev)
                .ok('Yes')
                .cancel('No');
            $mdDialog.show(confirm).then(function () {
                coastalSiteService.Sites.Strategies.Booms.delete($scope.boom).then(function (result) {
                    var deleted_strategy,
                        delete_index;
                    deleted_strategy = $filter('filter')($scope.strategy.boom.features,
                        {attributes: {OBJECTID: result.objectId}})[0];
                    delete_index = $scope.strategy.boom.features.indexOf(deleted_strategy);
                    $scope.strategy.boom.features.splice(delete_index, 1);
                    $state.go('main.coastal_site.strategies.strategy');
                });
            });
        };

        $scope.$on('$destroy', function () {
            editService.stop();
            drawService.stop();
            mapService.clearMap();
        });


    });