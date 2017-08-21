/**
 * Created by Travis on 12/24/2015.
 */
/*global angular */

angular.module('GRPApp')
    .controller('CategoryCtrl', function ($scope, iapService, $state, $stateParams, $filter, $mdDialog) {
        'use strict';
        if ($stateParams.categoryid === 'new') {
            iapService.IncidentCategories.create($stateParams.planid).then(function (category) {
                $scope.category = category;
                $scope.category.objectives = [];
            });
        } else {
            $scope.category = $filter('filter')($scope.categories, {attributes: {GlobalID: $stateParams.categoryid}})[0];
        }

        $scope.saveCategory = function () {
            angular.forEach($scope.category.objectives, function (objective) {
                objective.save();
            });

            $scope.category.save().then(function () {
                if ($stateParams.categoryid === 'new') {
                    $scope.categories.push($scope.category);
                    $state.go('main.iap.objectives.category', {categoryid: $scope.category.attributes.GlobalID});
                } else {
                    $state.go('^');
                }
            });
        };

        $scope.deleteCategory = function (ev) {
            // Appending dialog to document.body to cover sidenav in docs app
            $scope.category.delete('Are you sure you want to delete this category and its objectives?', ev, '^');
        };

        $scope.addObjective = function () {
            iapService.IncidentObjectives.create($scope.category.attributes.GlobalID).then(function (category) {
                $scope.category.objectives.push(category);
            });
        };

        $scope.deleteObjective = function (objective, ev) {
            var index = $scope.category.objectives.indexOf(objective);
            if (objective.attributes.GlobalID === 'new') {
                $scope.category.objectives.splice(index, 1);
            } else {
                objective.delete('Are you sure you want to delete this objective?', ev).then(function () {
                    $scope.category.objectives.splice(index, 1);
                    angular.forEach($scope.category.objectives, function (objective) {
                        objective.save();
                    });
                });
            }
        };
    });