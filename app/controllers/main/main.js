/*global angular */
angular.module('GRPApp')
    .controller('MainCtrl', function ($scope, coastalSiteService, inlandSiteService, iapService, esriAuth, $state, $rootScope, iap, configService) {
        'use strict';

        $scope.$state = $state;
        $scope.iap = iap;
        $scope.coastalSites = coastalSiteService;
        $scope.inlandSites = inlandSiteService;

        //make sure we've authenticated prior to loading secure layer
        if (esriAuth.authenticated === true) {
            $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState) {
                if ($state.is('main')) {
                    if (coastalSiteService.Sites.layer !== null) coastalSiteService.Sites.layer.clearSelection();
                    if (inlandSiteService.Sites.layer !== null) inlandSiteService.Sites.layer.clearSelection();
                    if (iapService.layer !== null) iapService.layer.clearSelection();
                    if (iapService.clickListener.active === false) {
                        iapService.clickListener.add();
                    }
                    if (coastalSiteService.Sites.clickListener.active === false) {
                        coastalSiteService.Sites.clickListener.add();
                    }
                    if (inlandSiteService.Sites.clickListener.active === false) {
                        inlandSiteService.Sites.clickListener.add();
                    }
                }
                if (!$state.includes('main.coastal_site') && coastalSiteService.Sites.layer !== null) coastalSiteService.Sites.layer.clearSelection();
                if (!$state.includes('main.inland_site') && inlandSiteService.Sites.layer !== null) inlandSiteService.Sites.layer.clearSelection();
                if (!$state.includes('main.iap') && iapService.layer !== null) iapService.layer.clearSelection();
            });
        } else {
            esriAuth.authenticate();
        }
    });