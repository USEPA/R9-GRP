/**
 * Created by Travis on 12/21/2016.
 */
/*global angular */
angular.module('GRPApp').controller('ResourceController', function (iapService, $state, $stateParams, $scope, $filter) {
    'use strict';
    if ($stateParams.resourceid === 'new') {
        iapService.AssignmentListResources.create($stateParams.assignmentid).then(function (resource) {
            $scope.resource = resource;
        });
    } else if ($stateParams.resourceid) {
        $scope.resource = $filter('filter')($scope.assignment.resources, {attributes: {GlobalID: $stateParams.resourceid}})[0];
    }
});