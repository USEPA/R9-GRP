/**
 * Created by Travis on 1/6/2017.
 */
/*global angular */
/*global angular */
angular.module('GRPApp')
    .controller('ObjectivesDefaultsController', function ($scope, $q, iapService, iap, $state, $stateParams) {
        'use strict';

        function load() {
            iapService.IncidentCategories.defaults.load(null, null, "GlobalID like '%'").then(function (categories) {
                $scope.categories = categories;
                angular.forEach($scope.categories, function (category, i) {
                    iapService.IncidentObjectives.defaults.load(category.attributes.GlobalID).then(function (objectives) {
                        $scope.categories[i].objectives = objectives;
                    });
                });
            });
        }
        load();

        $scope.viewCategory = function (category) {
            $scope.category = category;
        };

        $scope.addCategory = function () {
            iapService.IncidentCategories.defaults.create().then(function (category) {
                $scope.category = category;
                $scope.category.objectives = [];
            });
        };

        $scope.saveCategory = function () {
            angular.forEach($scope.category.objectives, function (objective) {
                objective.save();
            });

            $scope.category.save().then(function () {
                load();
            });
        };

        $scope.cancel = function () {
            delete $scope.category;
        };

        $scope.deleteCategory = function (ev) {
            // Appending dialog to document.body to cover sidenav in docs app
            $scope.category.delete('Are you sure you want to delete this category and its objectives?', ev).then(function () {
                delete $scope.category;
                load();
            });
        };

        $scope.addObjective = function () {
            iapService.IncidentObjectives.defaults.create($scope.category.attributes.GlobalID).then(function (category) {
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