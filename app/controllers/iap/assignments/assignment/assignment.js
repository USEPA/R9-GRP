/**
 * Created by Travis on 6/16/2016.
 */
/**
 * Created by Travis on 12/24/2015.
 */
/*global angular */

angular.module('GRPApp')
    .controller('AssignmentCtrl', function ($scope, iapService, $state, $filter, $stateParams) {
        'use strict';

        if ($stateParams.assignmentid === 'new') {
            iapService.AssignmentList.create($stateParams.planid).then(function (assignment) {
                $scope.assignment = assignment;
                $scope.assignment.contacts = [];
                $scope.assignment.resources = [];
            });
        } else if ($scope.assignments !== undefined) {
            $scope.assignment = $filter('filter')($scope.assignments, {attributes: {GlobalID: $stateParams.assignmentid}})[0];
        }


        $scope.saveAssignment = function () {
            angular.forEach($scope.assignment.contacts, function (contact) {
                contact.save();
            });

            $scope.assignment.save().then(function () {
                if ($stateParams.assignmentid === 'new') {
                    $state.go('main.iap.assignments.assignment', {assignmentid: $scope.assignment.attributes.GlobalID}, {notify: false});
                } else {
                    $state.go('^');
                }
            });
        };

        $scope.deleteAssignment = function (ev) {
            // Appending dialog to document.body to cover sidenav in docs app
            $scope.assignment.delete('Are you sure you want to delete this assignment list?', ev, '^');
        };

        // $scope.addContact = function () {
        //     iapService.AssignmentListContacts.create($stateParams.assignmentid).then(function (contact) {
        //         $scope.assignment.contacts.push(contact);
        //     });
        // };

        // $scope.removeContact = function (index, ev) {
        //     // todo: check if new contact and remove from array and return
        //     $scope.assignment.contact[index].relationship.remove(ev);
        // };

        $scope.$on('$stateChangeSuccess', function () {
            if ($state.is('main.iap.assignments.assignment') && $scope.assignment !== undefined) {
                iapService.AssignmentListContacts.load($scope.assignment.attributes.GlobalID).then(function (contacts) {
                    $scope.assignment.contacts = contacts;
                });
                iapService.AssignmentListResources.load($scope.assignment.attributes.GlobalID).then(function (resources) {
                    $scope.assignment.resources = resources;
                });
            }
        });
    });