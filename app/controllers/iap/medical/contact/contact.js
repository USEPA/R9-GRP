/**
 * Created by Travis on 12/24/2015.
 */
/*global angular */

angular.module('GRPApp')
    .controller('MedicalContactCtrl', function ($scope, $filter, iapService, contactService, $state, $mdDialog, $stateParams) {
        'use strict';

        // if ($stateParams.contactid === 'new') {
        //     iapService.MedicalPlan.create($stateParams.planid).then(function (medicalContact) {
        //         $scope.medicalContact = medicalContact;
        //     });
        // } else {
        //     $filter('filter')($scope.medicalContacts, {attributes: {GlobalID: $stateParams.contactid}});
        // }
        $scope.saveContact = function () {
            $scope.medicalContact.save().then(function () {
                $state.go('^');
            });
        };

        $scope.deleteContact = function (ev) {
            $scope.medicalContact.delete('Are you sure you want to delete this medical contact?', ev);
        };

        $scope.toggleType = function (attributes, field) {
            if (attributes[field] === 1) {
                attributes[field] = 0;
            } else if (attributes[field] === 0 || !attributes[field]) {
                attributes[field] = 1;
            }
        };
    });