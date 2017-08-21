/**
 * Created by Travis on 12/22/2016.
 */
/*global angular */
angular.module('GRPApp').controller('ContactsListController', function (contactService, $scope, $mdDialog, $state, $q) {
    'use strict';
    $scope.state = $state;
    $scope.query = {
        order: 'attributes.Name',
        limit: 25,
        page: 1,
        searchText: ''
    };
    $scope.selected = [];
    contactService.Contacts.query('', 'Name', $scope.query.limit, 0).then(function (contacts) {
        $scope.contacts = contacts;
    });

    $scope.search = function (searchText) {
        if (searchText !== $scope.query.order) {
            $scope.query.searchText = searchText;
        } else if ($scope.query.searchText === undefined) {
            $scope.query.searchText = '';
        }
        var deferred = $q.defer();
        var sortOrder = $scope.query.order.replace('attributes.', '');
        if (sortOrder.indexOf('-') === 0) {
            sortOrder = sortOrder.replace('-', '') + ' DESC';
        }

        var offset = ($scope.query.page - 1) * $scope.query.limit;
        $scope.promise = contactService.Contacts.query($scope.query.searchText, sortOrder, $scope.query.limit, offset).then(function (contacts) {
            $scope.contacts = contacts;
            deferred.resolve(contacts);
        });
        return deferred.promise;
    };

    $scope.paginate = function () {
        var deferred = $q.defer();
        var sortOrder = $scope.query.order.replace('attributes.', '');
        if (sortOrder.indexOf('-') === 0) {
            sortOrder = sortOrder.replace('-', '') + ' DESC';
        }

        var offset = ($scope.query.page - 1) * $scope.query.limit;
        $scope.promise = contactService.Contacts.query($scope.query.searchText, sortOrder, $scope.query.limit, offset).then(function (contacts) {
            $scope.contacts = contacts;
            deferred.resolve(contacts);
        });
        return deferred.promise;
    };

    $scope.edit = function (contact, ev) {
        $mdDialog.show({
            controller: function ($scope, $mdDialog, regex) {
                var pre_edit_contact = angular.copy(contact);
                $scope.contact = contact;
                $scope.regex = regex;
                $scope.save = function () {
                    $scope.contact.save().then(function () {
                        $mdDialog.hide();
                    });
                };

                $scope.cancel = function () {
                    angular.copy(pre_edit_contact, contact);
                    $mdDialog.cancel();
                };
            },
            templateUrl: 'controllers/contacts/modal.html',
            parent: angular.element(document.body),
            targetEvent: ev
        });
    };

    $scope.deleteSelected = function (ev) {
        var confirm = $mdDialog.confirm()
            .title('Delete?')
            .textContent("Are you sure you want to delete these contacts?")
            .ariaLabel('')
            .targetEvent(ev)
            .ok('Yes')
            .cancel('No');
        $mdDialog.show(confirm).then(function () {
            angular.forEach($scope.selected, function (contact) {
                contact.delete().then(function () {
                    var index = $scope.contacts.indexOf(contact);
                    $scope.contacts.splice(index, 1);
                });
            });
        });
    };
});