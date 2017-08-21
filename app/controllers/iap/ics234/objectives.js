/**
 * Created by Travis on 12/24/2015.
 */
/*global angular */
angular.module('GRPApp')
    .controller('ICS234Controller', function ($scope, iapService, $state, $stateParams) {
        'use strict';
        //var objectivesDeferred = $q.defer();

        // $scope.IAP = iapService;
        // $scope.objectives = objectives;
        // iapService.ICS234.isLoaded().then(function () {
        //     iapService.ICS234.load($stateParams.planid).then(function (objectives) {
        //         $scope.objectives = objectives;
        //     });
        // });
        //     iapService.ICS234.getList($stateParams.planid);
        // } else {
        //     iapService.layer.on('load', function () {
        //         iapService.ICS234.getList($stateParams.planid);
        //     });
        // }

        $scope.viewObjective = function (objective) {
            $state.go('main.iap.ics234.objective', {objectiveid: objective.attributes.GlobalID});
        };

        $scope.addObjective = function () {
            $state.go('main.iap.ics234.objective', {objectiveid: 'new'});
        };

        // reload categories in case some where added/edited/deleted
        $scope.$on('$stateChangeSuccess', function () {
            if ($state.is('main.iap.ics234')) {
                iapService.ICS234.load($stateParams.planid).then(function (objectives) {
                    $scope.objectives = objectives;
                    angular.forEach($scope.objectives, function (objective, i) {
                        iapService.ICS234Strategies.load(objective.attributes.GlobalID).then(function (strategies) {
                            $scope.objectives[i].strategies = strategies;
                        });
                        iapService.ICS234Tactics.load(objective.attributes.GlobalID).then(function (tactics) {
                            $scope.objectives[i].tactics = tactics;
                        });
                    });
                });
            }
        });

        //Use SortOrder instead of priority
        $scope.drop = function (oldPriority, newPriority) {
            oldPriority = parseInt(oldPriority);
            newPriority = parseInt(newPriority);
            angular.forEach($scope.objectives, function (objective, i) {
                if (oldPriority < newPriority) {
                    if (objective.attributes.SortOrder === oldPriority) {
                        $scope.objectives[i].attributes.SortOrder = newPriority;
                    } else if (objective.attributes.SortOrder <= newPriority && objective.attributes.SortOrder > oldPriority) {
                        $scope.objectives[i].attributes.SortOrder--;
                    }
                } else if (oldPriority > newPriority) {
                    if (objective.attributes.SortOrder === oldPriority) {
                        $scope.objectives[i].attributes.SortOrder = newPriority;
                    } else if (objective.attributes.SortOrder >= newPriority && objective.attributes.SortOrder < oldPriority) {
                        $scope.objectives[i].attributes.SortOrder++;
                    }
                }
                $scope.objectives[i].save(false, false);
            });
            $scope.$apply();
        };


    });