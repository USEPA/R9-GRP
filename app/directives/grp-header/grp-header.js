/**
 * Created by Travis on 12/30/2015.
 */
/**
 * Created by Travis on 12/24/2015.
 */
angular.module('GRPApp')
    .directive('grpHeader', function (esriAuth, $state) {
        return {
            restrict: 'E',
            templateUrl: 'directives/grp-header/grp-header.html',
            link: function (scope, element) {
                scope.$state = $state;
                scope.fullName = esriAuth.fullName;
                scope.userName = esriAuth.userName;
                scope.authenticated = esriAuth.authenticated;

                scope.authenticate = function () {
                    esriAuth.authenticate();
                };

                scope.$watch(function () {
                    return esriAuth.authenticated;
                }, function (newValue, oldValue) {
                    if (newValue !== oldValue) {
                        scope.authenticated = newValue;
                    }
                });

                scope.$watch(function () {
                    return esriAuth.userName;
                }, function (newValue, oldValue) {
                    if (newValue !== oldValue) {
                        scope.userName = newValue;
                    }
                });

                scope.$watch(function () {
                    return esriAuth.fullName;
                }, function (newValue, oldValue) {
                    if (newValue !== oldValue) {
                        scope.fullName = newValue;
                    }
                });

                scope.logout = function (e) {
                    esriAuth.logout();
                };
            }
        };
    });