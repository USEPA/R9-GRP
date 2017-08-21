/**
 * Created by Travis on 12/24/2015.
 */
/*global angular */

angular.module('GRPApp')
    .controller('ContactCtrl', function ($scope, $q, $filter, iapService, $state, $stateParams, $timeout, contactService, regex) {
        'use strict';
        $scope.regex = regex;

        if ($stateParams.contactid === 'new') {
            iapService.AssignmentListContacts.create($stateParams.assignmentid).then(function (contact) {
                $scope.contact = contact;
            });
        } else {
            $scope.contact = $filter('filter')($scope.assignment.contacts, {attributes: {GlobalID: $stateParams.contactid}})[0];
        }

        $scope.queryContacts = function (searchText) {
            var deferredResults = $q.defer();
            contactService.Contacts.query(searchText).then(function (contacts) {
                deferredResults.resolve(contacts);
            });
            return deferredResults.promise;
        };

        $scope.selectedItemChange = function (contact) {
            if (contact) {
                var relationship = $scope.contact.relationship;

                $scope.contact = contact;
                $scope.contact.relationship = relationship;
                $scope.contact.relationship.attributes.Contact_FK = $scope.contact.attributes.GlobalID;

                var found = $filter('filter')($scope.assignment.contacts, {attributes: {GlobalID: $scope.contact.attributes.GlobalID}});
                if (contact.attributes.GlobalID && found !== undefined) {
                    $timeout(function () {
                        $state.go('main.iap.assignments.assignment.contact', {contactid: $scope.contact.attributes.GlobalID}, {notify: false});
                    }, 500);
                }
            }
        };

        $scope.saveContact = function () {
            $scope.contact.save().then(function () {
                $scope.contact.relationship.attributes.Contact_FK = $scope.contact.attributes.GlobalID;
                $scope.contact.relationship.save().then(function () {
                    $state.go('^');
                });
            });
        };

        $scope.deleteContact = function (ev) {
            $scope.contact.relationship.delete('Are you sure you want to remove this contact from this assignment list?', ev, '^');
        };
    });