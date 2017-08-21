/**
 * Created by Travis on 6/22/2016.
 */
/*global angular */
angular.module('GRPApp')
    .controller('MedicalCtrl', ['$scope', 'iapService', '$stateParams', '$state',
        function ($scope, iapService, $stateParams, $state) {
            'use strict';


            $scope.saveMedical = function () {
                iapService.save();
            };

            $scope.addContact = function (type) {
                iapService.MedicalPlan.create($stateParams.planid).then(function (medicalContact) {
                    $scope.medicalContact = medicalContact;
                    $scope.medicalContact.attributes.Type = type;
                    $state.go('main.iap.medical.contact');
                });
            };

            $scope.viewContact = function (contact) {
                $scope.medicalContact = contact;
                $state.go('main.iap.medical.contact');
            };
            $scope.$on('$stateChangeSuccess', function () {
                if ($state.is('main.iap.medical')) {
                    iapService.MedicalPlan.load($stateParams.planid).then(function (medicalContacts) {
                        $scope.medicalContacts = medicalContacts;
                    });
                }
            });
        }]);