/**
 * Created by Travis on 12/30/2015.
 */
'use strict';

angular.module('GRPApp')
    .directive('grpFormButtons', function () {
        return {
            restrict: 'E',
            transclude: true,
            scope: {
                title: '@',
                save: '&',
                delete: '&',
                hideDelete: '=',
                export: '&',
                hideExport: '=',
                exportLoading: '=',
                cancel: '&'
            },
            templateUrl: 'directives/grp-form-buttons/grp-form-buttons.html'
        };
    });