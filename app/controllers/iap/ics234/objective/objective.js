/**
 * Created by Travis on 12/24/2015.
 */
/*global angular */

angular.module('GRPApp')
    .controller('ICS234ObjectiveController', function ($scope, iapService, $state, $stateParams, $filter, $mdDialog) {
        'use strict';
        if ($stateParams.objectiveid === 'new') {
            iapService.ICS234.create($stateParams.planid).then(function (objective) {
                $scope.objective = objective;
                $scope.objective.strategies = [];
                $scope.objective.tactics = [];
                $scope.objective.groups = [];
            });
        } else {
            $scope.objective = $filter('filter')($scope.objectives, {attributes: {GlobalID: $stateParams.objectiveid}})[0];
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
        }

        $scope.saveObjective = function () {
            angular.forEach($scope.objective.strategies, function (strategy) {
                strategy.save();
            });

            angular.forEach($scope.objective.tactics, function (tactic) {
                tactic.save();
            });

            $scope.objective.save().then(function () {
                if ($stateParams.objectiveid === 'new') {
                    $scope.objectives.push($scope.objective);
                    $state.go('main.iap.ics234.objective', {objectiveid: $scope.objective.attributes.GlobalID});
                } else {
                    $state.go('^');
                }
            });
        };

        $scope.deleteObjective = function (ev) {
            // Appending dialog to document.body to cover sidenav in docs app
            $scope.objective.delete('Are you sure you want to delete this category and its objectives?', ev, '^');
        };

        $scope.addStrategy = function (group) {
            iapService.ICS234Strategies.create($scope.objective.attributes.GlobalID).then(function (strategy) {
                strategy.attributes.Grouping = group;
                //strategy.attributes.SortOrder = $filter('filter')($scope.objective.strategies, {attributes:{Grouping: group}}).length.toString();
                $scope.objective.strategies.push(strategy);
            });
        };

        $scope.addTactic = function (group) {
            iapService.ICS234Tactics.create($scope.objective.attributes.GlobalID).then(function (tactic) {
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

        //Use SortOrder instead of priority
        //Handle for both strategies and tactics  objective.strategies and objective.tactics
        $scope.dropStrat = function (oldPriority, newPriority, group) {
            oldPriority = parseInt(oldPriority);
            newPriority = parseInt(newPriority);
            angular.forEach($scope.objective.strategies, function (strategy, i) {
                if (strategy.attributes.Grouping === group) {
                    if (oldPriority < newPriority) {
                        if (strategy.attributes.SortOrder === oldPriority) {
                            $scope.objective.strategies[i].attributes.SortOrder = newPriority;
                        } else if (strategy.attributes.SortOrder <= newPriority && strategy.attributes.SortOrder > oldPriority) {
                            $scope.objective.strategies[i].attributes.SortOrder--;
                        }
                    } else if (oldPriority > newPriority) {
                        if (strategy.attributes.SortOrder === oldPriority) {
                            $scope.objective.strategies[i].attributes.SortOrder = newPriority;
                        } else if (strategy.attributes.SortOrder >= newPriority && strategy.attributes.SortOrder < oldPriority) {
                            $scope.objective.strategies[i].attributes.SortOrder++;
                        }
                    }
                }
            });
            $scope.$apply();
        };

        $scope.dropTactic = function (oldPriority, newPriority, group) {
            oldPriority = parseInt(oldPriority);
            newPriority = parseInt(newPriority);
            angular.forEach($scope.objective.tactics, function (tactic, i) {
                if (tactic.attributes.Grouping === group) {
                    if (oldPriority < newPriority) {
                        if (tactic.attributes.SortOrder === oldPriority) {
                            $scope.objective.tactics[i].attributes.SortOrder = newPriority;
                        } else if (tactic.attributes.SortOrder <= newPriority && tactic.attributes.SortOrder > oldPriority) {
                            $scope.objective.tactics[i].attributes.SortOrder--;
                        }
                    } else if (oldPriority > newPriority) {
                        if (tactic.attributes.SortOrder === oldPriority) {
                            $scope.objective.tactics[i].attributes.SortOrder = newPriority;
                        } else if (tactic.attributes.SortOrder >= newPriority && tactic.attributes.SortOrder < oldPriority) {
                            $scope.objective.tactics[i].attributes.SortOrder++;
                        }
                    }
                }
            });
            $scope.$apply();
        };

        $scope.dropGroup = function (oldPriority, newPriority) {
            oldPriority = parseInt(oldPriority);
            newPriority = parseInt(newPriority);
            angular.forEach($scope.objective.strategies, function (strategy, i) {
                if (oldPriority < newPriority) {
                    if (strategy.attributes.Grouping === oldPriority) {
                        $scope.objective.strategies[i].attributes.Grouping = newPriority;
                    } else if (strategy.attributes.Grouping <= newPriority && strategy.attributes.Grouping > oldPriority) {
                        $scope.objective.strategies[i].attributes.Grouping--;
                    }
                } else if (oldPriority > newPriority) {
                    if (strategy.attributes.Grouping === oldPriority) {
                        $scope.objective.strategies[i].attributes.Grouping = newPriority;
                    } else if (strategy.attributes.Grouping >= newPriority && strategy.attributes.Grouping < oldPriority) {
                        $scope.objective.strategies[i].attributes.Grouping++;
                    }
                }
            });
            angular.forEach($scope.objective.tactics, function (tactic, i) {
                if (oldPriority < newPriority) {
                    if (tactic.attributes.Grouping === oldPriority) {
                        $scope.objective.tactics[i].attributes.Grouping = newPriority;
                    } else if (tactic.attributes.Grouping <= newPriority && tactic.attributes.Grouping > oldPriority) {
                        $scope.objective.tactics[i].attributes.Grouping--;
                    }
                } else if (oldPriority > newPriority) {
                    if (tactic.attributes.Grouping === oldPriority) {
                        $scope.objective.tactics[i].attributes.Grouping = newPriority;
                    } else if (tactic.attributes.Grouping >= newPriority && tactic.attributes.Grouping < oldPriority) {
                        $scope.objective.tactics[i].attributes.Grouping++;
                    }
                }
            });
            $scope.$apply();
        }

    });