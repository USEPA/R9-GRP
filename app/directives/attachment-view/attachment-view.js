/**
 * Created by Travis on 9/27/2016.
 */
/*global angular */
angular.module('GRPApp').directive('attachmentView', function () {
    'use strict';
    return {
        restrict: 'E',
        templateUrl: 'directives/attachment-view/attachment-view.html',
        scope: {
            layer: '=',
            objectId: '=',
            maxAttachments: '@',
            filterId: '='
        },
        controller: function ($scope, $mdDialog, $mdToast) {
            function loadAttachments() {
                $scope.layer.getAttachments($scope.objectId).then(function (attachments) {
                    $scope.attachments = attachments;
                }).catch(function () {
                    $mdToast.showSimple('Error');
                });
            }

            function DialogController($scope, layer, objectId) {
                $scope.uploading = false;
                $scope.uploadFile = function () {
                    if (document.getElementById("attachmentInput").value !== "") {
                        $scope.uploading = true;
                        layer.uploadAttachment(objectId, document.getElementById("attachmentForm"))
                            .then(function (attachmentId) {
                                loadAttachments();
                                $mdDialog.hide(attachmentId);
                            }).finally(function () {
                                $scope.uploading = false;
                            });
                    } else {
                        $mdToast.showSimple("Please Select a File to Attach");
                    }
                };

                $scope.cancel = function () {
                    $mdDialog.cancel();
                };
            }

            $scope.$watch('objectId', function (newValue) {
                if (newValue !== undefined) {
                    loadAttachments();
                }
            });

            $scope.$watch('filterId', function (newValue, oldValue) {
                if (newValue !== oldValue) {
                    if (newValue === undefined) {
                        $scope.filterId = '!';
                    }
                }
            });

            $scope.showUploadDialog = function (ev) {
                $mdDialog.show({
                    controller: DialogController,
                    templateUrl: 'directives/attachment-view/attachment-dialog.html',
                    parent: angular.element(document.body),
                    targetEvent: ev,
                    clickOutsideToClose: false,
                    locals: {layer: $scope.layer, objectId: $scope.objectId}
                }).then(function (attachmentId) {
                    $scope.filterId = attachmentId;
                });
            };
            $scope.showDeleteDialog = function (attachment, ev) {
                var confirm = $mdDialog.confirm()
                    .title('Delete?')
                    .textContent('Are you sure you want to delete this attachment?')
                    .ariaLabel('delete attachment')
                    .targetEvent(ev)
                    .ok('Yes')
                    .cancel('No');
                return $mdDialog.show(confirm).then(function () {
                    $scope.layer.deleteAttachment($scope.objectId, attachment.id).then(function () {
                        var index = $scope.attachments.indexOf(attachment);
                        $scope.attachments.splice(index, 1);
                        delete $scope.filterId;
                    });
                });
            };
        }
    };
});