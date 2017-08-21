/**
 * Created by Travis on 12/24/2015.
 */
/*globals angular */
angular.module('GRPApp')
    .controller('CoastalContactsCtrl', function ($scope, coastalSiteService, $stateParams, $state ) {
        'use strict';
        $scope.$on('$stateChangeSuccess', function () {
            if ($state.is('main.coastal_site.contacts')) {
                coastalSiteService.RelatedContacts.load($stateParams.siteid).then(function (contacts) {
                    $scope.contacts = contacts;
                });
            }
        });


    })
    .filter('contactType', function () {
        'use strict';
        return function (input, string) {
            if (input === 1) {
                return string;
            }
        };
    });