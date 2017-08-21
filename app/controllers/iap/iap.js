/**
 * Created by Travis on 5/19/2016.
 */
/**
 * Created by Travis on 12/24/2015.
 */
/*global angular */
angular.module('GRPApp')
    .controller('IAPCtrl', function ($scope, $q, iapService, $state, $stateParams, coastalSiteService, inlandSiteService,
                                     $mdDialog, $mdToast, mapService, editService, drawService, $http, $window) {
        "use strict";

        $scope.iapMode = true;
        $scope.IAP = iapService;

        var iapDeferred = $q.defer();
        $scope.iapPromise = iapDeferred.promise;

        $scope.$on('$destroy', function () {
            editService.stop();
            drawService.stop();
            mapService.clearMap();
        });

        $scope.save = function () {
            iapService.save().then(function () {
                $state.go('main.iap.general', {planid: iapService.plan.attributes.GlobalID});
            });
        };

        $scope.delete = function (iap, ev) {
            // Appending dialog to document.body to cover sidenav in docs app
            var confirm = $mdDialog.confirm()
                .title('Delete?')
                .textContent('Are you sure you want to delete this Incident Action Plan and all related information?')
                .ariaLabel('Delete')
                .targetEvent(ev)
                .ok('Yes')
                .cancel('No');
            $mdDialog.show(confirm).then(function () {
                iapService.delete(iap).then(function () {
                    $state.go('main');
                });
            });
        };

        $scope.export = function (iap) {
            $mdToast.show({
                'template': '<md-toast><div class="md-toast-content">Loading... <span flex></span>' +
                            '<md-progress-circular md-mode="indeterminate" class="md-accent" md-diameter="25"></md-progress-circular>' +
                            '</div></md-toast>',
                'hideDelay': 0
            });
            $scope.exportLoading = true;
            iapService.print(iap).finally(function () {
                $scope.exportLoading = false;
                $mdToast.hide();
            });
        };

        $scope.$watch('IAP.plan.attributes.CoverImage', function (newValue, oldValue) {
            if (newValue !== oldValue && newValue !== iapService.plan.originalImageId && newValue !== '!' && newValue !== undefined) {
                $scope.save();
            }
        });

        mapService.getMap().then(function (map) {
            if (iapService.layer.loaded === true) {
                iapService.get($stateParams.planid);
            } else {
                map.on('layers-add-result', function () {
                    iapService.get($stateParams.planid);
                });
            }
        });
    });