/**
 * Created by Travis on 12/23/2016.
 */
/*global angular */
angular.module('GRPApp').controller('ICS205Controller',
    function ($scope, iapService, contactService, $state, $stateParams) {
        'use strict';
        $scope.$on('$stateChangeSuccess', function () {
            if ($state.is('main.iap.ics205')) {
                iapService.ICS205Contacts.load($stateParams.planid).then(function (contacts) {
                    $scope.contacts = contacts;
                });
            }
        });
    });