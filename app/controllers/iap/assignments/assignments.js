/**
 * Created by Travis on 6/16/2016.
 */
/**
 * Created by Travis on 12/24/2015.
 */
/*global angular */

angular.module('GRPApp')
    .controller('AssignmentsCtrl', function ($scope, iapService, $state, $stateParams) {
        'use strict';
        $scope.viewAssignment = function (assignment) {
            $state.go('main.iap.assignments.assignment', {assignmentid: assignment.attributes.GlobalID});
        };

        $scope.addAssignment = function () {
            $state.go('main.iap.assignments.assignment', {assignmentid: 'new'});
        };
        // reload categories in case some where added/edited/deleted
        $scope.$on('$stateChangeSuccess', function () {
            if ($state.is('main.iap.assignments')) {
                iapService.AssignmentList.load($stateParams.planid).then(function (assignments) {
                    $scope.assignments = assignments;
                });
            }
        });
    });