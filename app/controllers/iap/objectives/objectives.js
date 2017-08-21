/**
 * Created by Travis on 12/24/2015.
 */
/*global angular */
angular.module('GRPApp')
    .controller('ObjectivesCtrl', function ($scope, $q, iapService, iap, $state, $stateParams) {
        'use strict';
        $scope.viewCategory = function (category) {
            $state.go('main.iap.objectives.category', {categoryid: category.attributes.GlobalID});
        };

        $scope.addCategory = function () {
            $state.go('main.iap.objectives.category', {categoryid: 'new'});
        };

        // reload categories in case some where added/edited/deleted
        $scope.$on('$stateChangeSuccess', function () {
            if ($state.is('main.iap.objectives')) {
                iapService.IncidentCategories.load($stateParams.planid).then(function (categories) {
                    $scope.categories = categories;
                    angular.forEach($scope.categories, function (category, i) {
                        iapService.IncidentObjectives.load(category.attributes.GlobalID).then(function (objectives) {
                            $scope.categories[i].objectives = objectives;
                        });
                    });
                });
            }
        });

        $scope.drop = function (oldPriority, newPriority) {
            oldPriority = parseInt(oldPriority);
            newPriority = parseInt(newPriority);
            angular.forEach($scope.categories, function (category, i) {
                if (oldPriority < newPriority) {
                    if (category.attributes.SortOrder === oldPriority) {
                        $scope.categories[i].attributes.SortOrder = newPriority;
                    } else if (category.attributes.SortOrder <= newPriority && category.attributes.SortOrder > oldPriority) {
                        $scope.categories[i].attributes.SortOrder--;
                    }
                } else if (oldPriority > newPriority) {
                    if (category.attributes.SortOrder === oldPriority) {
                        $scope.categories[i].attributes.SortOrder = newPriority;
                    } else if (category.attributes.SortOrder >= newPriority && category.attributes.SortOrder < oldPriority) {
                        $scope.categories[i].attributes.SortOrder++;
                    }
                }
                $scope.categories[i].save(false, false);
            });
            $scope.$apply();
        };
    });