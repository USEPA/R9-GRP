/**
 * Created by Travis on 12/24/2015.
 */
angular.module('GRPApp')
    .controller('ContactsCtrl', function ($scope, iapService, $stateParams, $state) {
        'use strict';
        $scope.$on('$stateChangeSuccess', function () {
            if ($state.is('main.iap.contacts')) {
                iapService.RelatedContacts.load($stateParams.planid).then(function (contacts) {
                    $scope.contacts = contacts;
                });
            }
        });
    })
    .filter('contactType', function () {
        return function (input, string) {
            if (input === 1) {
                return string;
            }
        };
    });