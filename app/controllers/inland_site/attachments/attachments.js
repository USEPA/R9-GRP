/**
 * Created by Travis on 12/24/2015.
 */
/*globals angular */
angular.module('GRPApp')
    .controller('InlandAttachmentsCtrl', function ($scope, inlandSiteService) {
        'use strict';
        $scope.layer = inlandSiteService.Sites;
    });