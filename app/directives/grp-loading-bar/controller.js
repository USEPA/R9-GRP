/**
 * Created by Travis on 6/5/2017.
 */
/*global angular */
angular.module('GRPApp')
    .directive('grpLoadingBar', function () {
        'use strict';
        return {
            restrict: 'E',
            scope: true,
            template: '<md-progress-linear md-mode="indeterminate" ng-show="loadingService.loading" style="position: absolute; z-index: 9999;"></md-progress-linear>',
            controller: function ($scope, loadingService) {
                $scope.loadingService = loadingService;
            }
        };
    });