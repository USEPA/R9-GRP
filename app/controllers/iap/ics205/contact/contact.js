/**
 * Created by Travis on 12/24/2015.
 */
/*globals angular */
angular.module('GRPApp')
    .controller('ICS205ContactController', function ($scope, $q, $filter, iapService, contactService, $state, $stateParams, $timeout, regex) {
        'use strict';
        $scope.regex = regex;
        $scope.positions = [
            'Incident Commander', 'Incident Commander Deputy', 'Safety Officer', 'Safety Officer Assistant',
            'Public Information Officer', 'Public Information Officer Assistant', 'Liaison Officer', 'Liaison Officer Assistant',
            'Operations Section Chief', 'Planning Section Chief', 'Logistics Section Chief', 'Law Enforcement Section Chief'
        ];

        if ($stateParams.contactid === 'new') {
            iapService.ICS205Contacts.create($stateParams.planid).then(function (contact) {
                $scope.contact = contact;
                $scope.contact.relationship.attributes.Team = $stateParams.team;
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
            $scope.contact.relationship.delete('Are you sure you want to remove this contact from this ICS 205?', ev, '^');
        };

        $scope.positionQuery = function (searchText) {
            if (searchText) {
                return $filter('filter')($scope.positions, searchText);
            }
            else {
                return $scope.positions;
            }
        };
    });