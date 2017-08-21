/**
 * Created by Travis on 1/13/2016.
 */
angular.module('GRPApp')
    .directive('fileUpload', function () {
        return {
            restrict: 'E',
            templateUrl: 'directives/file-upload/file-upload.html'
        };
    })
    .directive('myOnChange', function () {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                var onChangeHandler = scope.$eval(attrs.myOnChange);
                element.bind('change', onChangeHandler);
            }
        };
    });