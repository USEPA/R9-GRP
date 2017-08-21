/**
 * Created by Travis on 1/27/2017.
 */
/*global angular */
angular.module('GRPApp').directive('drag', function (dragged) {
    'use strict';
    return {
        scope: {
            priority: '@',
            drop: '&',
            type: '@'
        },
        link: function (scope, element) {
            var el = element[0];
            el.draggable = true;


            el.addEventListener('dragstart', function (e) {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text', scope.priority);
                if (scope.type) {
                    dragged.type = scope.type;
                }
            }, false);

            el.addEventListener('dragenter', function (e) {
                // console.log(e);
            }, false);

            el.addEventListener('dragend', function (e) {
                // console.log(e);
            }, false);

            el.addEventListener('dragover', function (e) {
                if (dragged.type === scope.type || scope.type === undefined) {
                    e.preventDefault(); // Necessary. Allows us to drop.
                }
            }, false);

            el.addEventListener('dragleave', function (e) {
                // console.log(e);
            }, false);

            el.addEventListener('drop', function (e) {
                // var movedItem = scope.list.splice(e.dataTransfer.getData('index'), 1)[0];
                // scope.list.splice(scope.index, 0, movedItem);
                scope.drop({oldPriority: e.dataTransfer.getData('text'), newPriority: scope.priority});
                e.preventDefault();
                // scope.$apply();
                // console.log();
            }, false);
        }
    };
}).service('dragged', function () {
    'use strict';
    return {
        type: ''
    };
});