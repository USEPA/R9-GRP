/**
 * Created by Travis on 1/6/2017.
 */
/*global angular */
angular.module('GRPApp').directive('formView', function () {
    'use strict';
    return {
        restrict: 'E',
        scope: false,
        templateUrl: function (elem, attrs) {
            return attrs.templateUrl;
        }
    };
});