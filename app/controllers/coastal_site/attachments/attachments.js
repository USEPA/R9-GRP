/**
 * Created by Travis on 12/24/2015.
 */
/*globals angular */
angular.module('GRPApp')
    .controller('CoastalAttachmentsCtrl', function ($scope, coastalSiteService) {
        'use strict';
        $scope.layer = coastalSiteService.Sites;
    });