/**
 * Created by Travis on 12/24/2015.
 */
/*globals angular */
angular.module('GRPApp')
    .controller('ContactCtrl', function ($scope, $q, $filter, iapService, contactService, $state, $stateParams, $timeout, regex) {
        'use strict';
        $scope.regex = regex;

        if ($stateParams.contactid === 'new') {
            iapService.RelatedContacts.create($stateParams.planid).then(function (contact) {
                $scope.contact = contact;
            });
        } else {
            $scope.contact = $filter('filter')($scope.contacts, {attributes: {GlobalID: $stateParams.contactid}})[0];
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
                contact.relationship = $scope.contact.relationship;
                contact.fields = $scope.contact.fields;
                $scope.contact = contact;
                var found = $filter('filter')($scope.contacts, {attributes: {GlobalID: $scope.contact.attributes.GlobalID}});
                if (contact.attributes.GlobalID && found.length > 0) {
                    $timeout(function () {
                        $state.go('main.iap.contacts.contact', {contactid: $scope.contact.attributes.GlobalID});
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
            $scope.contact.relationship.delete('Are you sure you want to remove this contact from this coastal_site?', ev, '^');
        };
    });