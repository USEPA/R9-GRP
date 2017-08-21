/**
 * Created by Travis on 1/6/2017.
 */
/*global angular */
angular.module('GRPApp')
    .controller('ICS234DefaultsController', function ($scope, iapService, $state, $stateParams, $mdDialog) {
        'use strict';
        function load() {
            iapService.ICS234.defaults.load(null, null, "GlobalID like '%'").then(function (objectives) {
                $scope.objectives = objectives;
                angular.forEach($scope.objectives, function (objective, i) {
                    iapService.ICS234Strategies.defaults.load(objective.attributes.GlobalID).then(function (strategies) {
                        $scope.objectives[i].strategies = strategies;
                    });
                    iapService.ICS234Tactics.defaults.load(objective.attributes.GlobalID).then(function (tactics) {
                        $scope.objectives[i].tactics = tactics;
                    });
                });
            });
        }
        load();

        $scope.viewObjective = function (objective) {
            $scope.objective = objective;
            $scope.objective.groups = [];
            angular.forEach($scope.objective.strategies, function (strategy) {
                if ($scope.objective.groups.indexOf(strategy.attributes.Grouping) === -1) {
                    $scope.objective.groups.push(strategy.attributes.Grouping);
                }
            });
            angular.forEach($scope.objective.tactics, function (tactic) {
                if ($scope.objective.groups.indexOf(tactic.attributes.Grouping) === -1) {
                    $scope.objective.groups.push(tactic.attributes.Grouping);
                }
            });
        };

        $scope.addObjective = function () {
            iapService.ICS234.defaults.create().then(function (objective) {
                $scope.objective = objective;
                $scope.objective.strategies = [];
                $scope.objective.tactics = [];
                $scope.objective.groups = [];
            });
        };
        $scope.saveObjective = function () {
            angular.forEach($scope.objective.strategies, function (strategy) {
                strategy.save();
            });

            angular.forEach($scope.objective.tactics, function (tactic) {
                tactic.save();
            });

            $scope.objective.save().then(function () {
                load();
            });
        };

        $scope.deleteObjective = function (ev) {
            // Appending dialog to document.body to cover sidenav in docs app
            $scope.objective.delete('Are you sure you want to delete this category and its objectives?', ev).then(function () {
                delete $scope.objective;
                load();
            });
        };

        $scope.addStrategy = function (group) {
            iapService.ICS234Strategies.defaults.create($scope.objective.attributes.GlobalID).then(function (strategy) {
                strategy.attributes.Grouping = group;
                $scope.objective.strategies.push(strategy);
            });
        };

        $scope.addTactic = function (group) {
            iapService.ICS234Tactics.defaults.create($scope.objective.attributes.GlobalID).then(function (tactic) {
                tactic.attributes.Grouping = group;
                $scope.objective.tactics.push(tactic);
            });
        };

        $scope.deleteStrategy = function (strategy, ev) {
            var index = $scope.objective.strategies.indexOf(strategy);
            if (strategy.attributes.GlobalID === 'new') {
                $scope.objective.strategies.splice(index, 1);
            } else {
                strategy.delete('Are you sure you want to remove this strategy?', ev).then(function () {
                    $scope.objective.strategies.splice(index, 1);
                    angular.forEach($scope.objective.strategies, function (strategy) {
                        strategy.save();
                    });
                });
            }
        };

        $scope.deleteTactic = function (tactic, ev) {
            var index = $scope.objective.tactics.indexOf(tactic);
            if (tactic.attributes.GlobalID === 'new') {
                $scope.objective.tactics.splice(index, 1);
            } else {
                tactic.delete('Are you sure you want to remove this tactic?', ev).then(function () {
                    $scope.objective.tactics.splice(index, 1);
                    angular.forEach($scope.objective.tactics, function (tactic) {
                        tactic.save();
                    });
                });
            }
        };

        $scope.addGroup = function () {
            if ($scope.objective.groups.length === 0) {
                $scope.objective.groups.push(0);
            } else {
                $scope.objective.groups.push(Math.max.apply(null, $scope.objective.groups) + 1);
            }
        };

        $scope.deleteGroup = function (group, ev) {
            var index = $scope.objective.groups.indexOf(group);
            var confirm = $mdDialog.confirm()
                .title('Delete?')
                .textContent('Are you sure you want to delete all strategies, tactics & tasks in this group?')
                .ariaLabel('')
                .targetEvent(ev)
                .ok('Yes')
                .cancel('No');
            $mdDialog.show(confirm).then(function () {
                angular.forEach($scope.objective.strategies, function (strategy) {
                    if (strategy.attributes.Grouping === group) {
                        strategy.delete();
                    }
                });
                angular.forEach($scope.objective.tactics, function (tactic) {
                    if (tactic.attributes.Grouping === group) {
                        tactic.delete();
                    }
                });
                $scope.objective.groups.splice(index, 1);
            });
        };

        $scope.cancel = function () {
            delete $scope.objective;
        };

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