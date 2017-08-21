/**
 * Created by Travis on 1/6/2017.
 */
/*global angular */

angular.module('GRPApp')
    .controller('AssignmentsDefaultsController', function ($scope, iapService, $state, $stateParams) {
        'use strict';

        function load() {
            iapService.AssignmentList.defaults.load(null, null, "GlobalID like '%'").then(function (assignments) {
                $scope.assignments = assignments;
            });
        }
        load();

        $scope.viewAssignment = function (assignment) {
            $scope.assignment = assignment;
        };

        $scope.addAssignment = function () {
            iapService.AssignmentList.defaults.create().then(function (assignment) {
                $scope.assignment = assignment;
            });
        };

        $scope.saveAssignment = function () {
            angular.forEach($scope.assignment.contacts, function (contact) {
                contact.save();
            });

            $scope.assignment.save().then(function () {
                load();
            });
        };

        $scope.deleteAssignment = function (ev) {
            // Appending dialog to document.body to cover sidenav in docs app
            $scope.assignment.delete('Are you sure you want to delete this assignment list?', ev).then(function () {
                delete $scope.assignment;
                load();
            });
        };

        $scope.cancel = function () {
            delete $scope.assignment;
        };
    });