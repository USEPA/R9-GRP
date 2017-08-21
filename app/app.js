/*global angular */

angular.module('GRPApp', ['oc.lazyLoad', 'ui.router', 'ngMaterial', 'LocalStorageModule', 'ngMessages', 'esri.core',
    'md.data.table'])
    .service('IdentityManager', function ($q, esriLoader, localStorageService) {
        'use strict';

        var identityManagerDeferred = $q.defer();

        function loadManager() {
            esriLoader.require(['esri/IdentityManager', 'esri/arcgis/OAuthInfo'],
                function (IdentityManager, OAuthInfo) {
                    var info = new OAuthInfo({
                        appId: "oSWT9pemf93LcH6q", //geoplatoform id
                        popup: false,
                        authNamespace: 'GuamGRPApp',
                        expiration: 1440,
                        portalUrl: "https://epa.maps.arcgis.com" // switch to this for production
                    });
                    if (localStorageService.get('arcgis_creds') !== null) {
                        IdentityManager.initialize(JSON.stringify(localStorageService.get('arcgis_creds')));
                    } else {
                        IdentityManager.registerOAuthInfos([info]);
                    }
                    identityManagerDeferred.resolve(IdentityManager);
                });
        }

        loadManager();
        return {
            getIdentityManager: function () {
                return identityManagerDeferred.promise;
            }
        };
    })
    .service('Portal', function ($q, esriLoader) {
        'use strict';
        var portalDeferred = $q.defer();

        function loadPortal() {
            esriLoader.require('esri/arcgis/Portal').then(function (Portal) {
                var portal = new Portal.Portal("https://epa.maps.arcgis.com");


                portalDeferred.resolve(portal);
            });
        }

        loadPortal();
        return {
            getPortal: function () {
                return portalDeferred.promise;
            }
        };
    })
    .service('esriAuth', function ($q, $window, localStorageService, IdentityManager, Portal) {
        'use strict';
        var portalUrl = "https://epa.maps.arcgis.com";

        return {
            fullName: '',
            userName: '',
            authenticated: false,
            authenticate: function (token, username, expires) {
                var myThis = this,
                    authenticateDefer = $q.defer();
                IdentityManager.getIdentityManager().then(function (IdentityManager) {
                    Portal.getPortal().then(function (portal) {

                        if (token !== undefined && username !== undefined) {
                            IdentityManager.registerToken({
                                expires: expires,
                                server: 'http://epa.maps.arcgis.com/sharing',
                                ssl: true,
                                token: token,
                                userId: username
                            });
                        }

                        IdentityManager.checkSignInStatus(portalUrl + "/sharing").then(
                            function () {
                                portal.signIn().then(
                                    function (portalUser) {
                                        myThis.fullName = portalUser.fullName;
                                        myThis.userName = portalUser.username;
                                        myThis.authenticated = true;

                                        var id_manager_json = IdentityManager.toJson();

                                        //id_manager_json.credentials[0].fullName = portalUser.fullName;

                                        //console.log("Signed in to the portal: ", portalUser);
                                        localStorageService.set('arcgis_creds', id_manager_json);
                                        authenticateDefer.resolve();
                                    }
                                ).otherwise(
                                    function () {
                                        //console.log("Error occurred while signing in: ", error);
                                        authenticateDefer.reject();
                                    }
                                );
                            }
                        ).otherwise(
                            function () {
                                IdentityManager.getCredential(portalUrl + "/sharing");
                                //console.log(e);
                            }
                        );


                    });
                });
                return authenticateDefer.promise;
            },
            logout: function () {
                //var w = wish.get();
                this.userName = null;
                this.fullName = null;
                this.authenticated = false;
                IdentityManager.getIdentityManager().then(function (IdentityManager) {
                    IdentityManager.destroyCredentials();
                });
                localStorageService.clearAll();
                $window.location.reload();
            },
            getUserDetails: function () {
                //var w = wish.get(),
                var myThis = this,
                    detailsDefer = $q.defer();
                IdentityManager.getIdentityManager().then(function (IdentityManager) {
                    Portal.getPortal().then(function (portal) {
                        //if (localStorageService.get('arcgis_creds') !== null) {
                        //    IdentityManager.initialize(JSON.stringify(localStorageService.get('arcgis_creds')));
                        //}

                        IdentityManager.checkSignInStatus(portalUrl + "/sharing").then(
                            function () {
                                portal.signIn().then(
                                    function (portalUser) {
                                        myThis.fullName = portalUser.fullName;
                                        myThis.userName = portalUser.username;
                                        myThis.authenticated = true;

                                        var id_manager_json = IdentityManager.toJson();

                                        //id_manager_json.credentials[0].fullName = portalUser.fullName;

                                        //console.log("Signed in to the portal: ", portalUser);
                                        localStorageService.set('arcgis_creds', id_manager_json);
                                        detailsDefer.resolve();
                                    }
                                ).otherwise(
                                    function () {
                                        detailsDefer.resolve();
                                    }
                                );
                            }
                        ).otherwise(
                            function () {
                                detailsDefer.resolve();
                            }
                        );
                    });
                });
                return detailsDefer.promise;
            }
        };
    })
    .service('site', function () {
        'use strict';
        this.attributes = [];
        this.geometry = {};
        this.fields = [];
    })
    .service('regex', function () {
        'use strict';
        this.phone = [];
        this.geometry = {};
        this.fields = [];
    })
    .service('iap', function () {
        'use strict';
        this.attributes = [];
        this.geometry = {};
        this.fields = [];
    })
    .service('strategy', function () {
        'use strict';
        this.attributes = [];
        this.fields = [];
    })
    .service('contact', function () {
        'use strict';
        this.attributes = {};
    })
    .service('category', function () {
        'use strict';
        this.attributes = [];
        this.fields = [];
    })
    .service('grpFeatureService', function () {
        'use strict';
        this.id = '';
        this.name = '';
        this.bingKey = '';
    })
    .service('regex', function () {
        'use strict';
        //create service to check phone format
        this.emailFormat = '\\S+@\\S+\\.\\S+';
        this.phoneFormat = '(?!8675309)((?:(?:\\+?1\\s*(?:[.-]\\s*)?)?(?:\\(\\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\\s*\\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\\s*(?:[.-]\\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\\s*(?:[.-]\\s*)?([0-9]{4})(?:\\s*(?:#|x\\.?|ext\\.?|extension)\\s*(\\d+))?|(911))';
        this.phoneMessage = 'Please enter a valid phone number.';
        this.emailMessage = 'Please enter a valid email.';
    })
    .service('loadingService', function ($timeout) {
        'use strict';
        var serviceObj = {
            loading: false,
            start: function () {
                serviceObj.loading = true;
            },
            stop: function () {
                $timeout(function () {
                    serviceObj.loading = false;
                }, 250);
            }
        };
        return serviceObj;
    })
    .config(['$stateProvider', '$urlRouterProvider', '$ocLazyLoadProvider', '$mdThemingProvider', '$mdIconProvider', '$locationProvider',
        function ($stateProvider, $urlRouterProvider, $ocLazyLoadProvider, $mdThemingProvider, $mdIconProvider, $locationProvider) {
            'use strict';

            $mdThemingProvider.theme('default').primaryPalette('blue')
                .accentPalette('blue-grey');

            $mdIconProvider
                .iconSet('social', 'img/icons/sets/social-icons.svg', 24)
                .defaultIconSet('img/icons/sets/core-icons.svg', 24);

            $ocLazyLoadProvider.config({
                debug: false,
                events: true
            });

            $urlRouterProvider.otherwise('/');

            $stateProvider
                .state('access_token', {
                    url: '/access_token={access_token:.*}&expires_in={expires_in:.*}&username={username:.*}&state={state:.*}',
                    template: '',
                    resolve: {},
                    controller: function ($stateParams, $state, esriAuth) {
                        var datetime = new Date(),
                            expires = datetime.getTime() + (parseInt($stateParams.expires_in, 10) * 1000);
                        esriAuth.authenticate($stateParams.access_token, $stateParams.username, expires);
                        $state.go('main');
                    }
                })
                .state('main', {
                    url: '/grp/:grpid',
                    templateUrl: 'controllers/main/main.html',
                    controller: 'MainCtrl',
                    resolve: {
                        checkConfig: ['configService', '$state', '$q', '$timeout', 'Portal', '$stateParams', 'iapService',
                            'inlandSiteService', 'coastalSiteService', 'contactService', 'editService', 'drawService', 'userInfo',
                            'grpFeatureService', 'mapService', 'loadingService',
                            function (configService, $state, $q, $timeout, Portal, $stateParams, iapService, inlandSiteService,
                                      coastalSiteService, contactService, editService, drawService, userInfo, grpFeatureService,
                                      mapService, loadingService) {
                                var deferred = $q.defer();
                                loadingService.start();
                                deferred.promise.finally(function () {
                                    loadingService.stop();
                                });
                                $timeout(function () {
                                    Portal.getPortal().then(function (epaPortal) {
                                        epaPortal.queryItems({q: 'id: "' + $stateParams.grpid + '"'}).then(function (response) {
                                            if (response.results.length !== 1) {
                                                $state.go('grps');
                                                deferred.reject();
                                            } else {
                                                var item = response.results[0];
                                                grpFeatureService.id = item.id;
                                                grpFeatureService.name = item.title;
                                                grpFeatureService.bingKey = item.portal.bingKey;
                                                configService.resetRoot(item).then(function () {
                                                    mapService.initialExtent = item.extent;
                                                    iapService.initialize();
                                                    inlandSiteService.initialize();
                                                    coastalSiteService.initialize();
                                                    contactService.Contacts.init();
                                                    editService.init();
                                                    drawService.init();
                                                    deferred.resolve();
                                                });
                                            }

                                        });
                                    });
                                });
                                return deferred.promise;
                            }],
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: [
                                    'directives/grp-toolbar/grp-toolbar.js',
                                    'directives/grp-map/grp-map.js',
                                    'directives/grp-header/grp-header.js',
                                    'controllers/main/main.js'
                                ]
                            });
                        },
                        userInfo: function ($q, esriAuth) {
                            var defer = $q.defer();
                            esriAuth.getUserDetails().then(function () {
                                defer.resolve();
                            });
                            return defer.promise;
                        },
                        esriConfig: function ($q, esriLoader) {
                            var defer = $q.defer();
                            esriLoader.require('esri/config', function (esriConfig){
                                //because for some reason utility.arcgis.com isn't in the corsEnabledServers array already
                                esriConfig.defaults.io.corsEnabledServers.push("utility.arcgis.com");
                                defer.resolve();
                            });
                            return defer.promise;
                        }
                    }
                })
                .state('main.coastal_site', {
                    url: '/coastal_site/:siteid',
                    templateUrl: 'controllers/coastal_site/site.html',
                    controller: 'CoastalSiteCtrl',
                    resolve: {
                        // coastal: function ($q, configService) {
                        //     var config = configService.getConfig();
                        //     if (config.coastalZone) {
                        //           return $q.resolve();
                        //       } else {
                        //           return $q.reject();
                        //       }
                        // },
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: [
                                    'controllers/coastal_site/site.js',
                                    'directives/grp-form-buttons/grp-form-buttons.js'
                                ]
                            });
                        }
                    }
                })
                .state('main.coastal_site.general', {
                    url: '/general',
                    templateUrl: 'controllers/coastal_site/general/general.html',
                    controller: 'CoastalGeneralCtrl',
                    resolve: {
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: ['controllers/coastal_site/general/general.js']
                            });
                        }
                    }
                })
                .state('main.coastal_site.resources', {
                    url: '/resources',
                    templateUrl: 'controllers/coastal_site/resources/resources.html',
                    controller: 'CoastalResourcesCtrl',
                    resolve: {
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: ['controllers/coastal_site/resources/resources.js']
                            });
                        }
                    }
                })
                .state('main.coastal_site.contacts', {
                    url: '/contacts',
                    templateUrl: 'controllers/coastal_site/contacts/contacts.html',
                    controller: 'CoastalContactsCtrl',
                    resolve: {
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: ['controllers/coastal_site/contacts/contacts.js']
                            });
                        }
                    }
                })
                .state('main.coastal_site.contacts.contact', {
                    url: '/:contactid',
                    templateUrl: 'controllers/coastal_site/contacts/contact/contact.html',
                    controller: 'CoastalContactCtrl',
                    resolve: {
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: ['controllers/coastal_site/contacts/contact/contact.js']
                            });
                        }
                    }
                })
                .state('main.coastal_site.strategies', {
                    url: '/strategies',
                    templateUrl: 'controllers/coastal_site/strategies/strategies.html',
                    controller: 'CoastalStrategiesCtrl',
                    resolve: {
                        SimpleLineSymbol: function (esriLoader) {
                            return esriLoader.require('esri/symbols/SimpleLineSymbol').then(function (SimpleLineSymbol) {
                                return SimpleLineSymbol;
                            });
                        },
                        Color: function (esriLoader) {
                            return esriLoader.require('esri/Color').then(function (Color) {
                                return Color;
                            });
                        },
                        UniqueValueRenderer: function (esriLoader) {
                            return esriLoader.require('esri/renderers/UniqueValueRenderer').then(function (UniqueValueRenderer) {
                                return UniqueValueRenderer;
                            });
                        },
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: [
                                    'controllers/coastal_site/strategies/strategies.js'
                                ]
                            });
                        }
                    }
                })
                .state('main.coastal_site.strategies.strategy', {
                    url: '/:strategyid',
                    templateUrl: 'controllers/coastal_site/strategies/strategy/strategy.html',
                    controller: 'CoastalStrategyCtrl',
                    resolve: {
                        Graphic: function (esriLoader) {
                            return esriLoader.require('esri/graphic').then(function (Graphic) {
                                return Graphic;
                            });
                        },
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: [
                                    'controllers/coastal_site/strategies/strategy/strategy.js'
                                ]
                            });
                        }
                    }
                })
                .state('main.coastal_site.strategies.strategy.boom', {
                    url: '/boom/:boomid',
                    templateUrl: 'controllers/coastal_site/strategies/strategy/boom/boom.html',
                    controller: 'CoastalBoomCtrl',
                    resolve: {
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: [
                                    'controllers/coastal_site/strategies/strategy/boom/boom.js'
                                ]
                            });
                        }
                    }
                })
                .state('main.coastal_site.logistics', {
                    url: '/logistics',
                    templateUrl: 'controllers/coastal_site/logistics/logistics.html',
                    controller: 'CoastalLogisticsCtrl',
                    resolve: {
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: [
                                    'controllers/coastal_site/logistics/logistics.js'
                                ]
                            });
                        }
                    }
                })
                .state('main.coastal_site.attachments', {
                    url: '/attachments',
                    templateUrl: 'controllers/coastal_site/attachments/attachments.html',
                    controller: 'CoastalAttachmentsCtrl',
                    resolve: {
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: [
                                    'controllers/coastal_site/attachments/attachments.js',
                                    'directives/file-upload/file-upload.js',
                                    'directives/attachment-view/attachment-view.js'
                                ]
                            });
                        }
                    }
                })
                .state('main.inland_site', {
                    url: '/inland_site/:siteid',
                    templateUrl: 'controllers/inland_site/site.html',
                    controller: 'InlandSiteCtrl',
                    resolve: {
                        // inland: function ($q, configService) {
                        //     var config = configService.getConfig();
                        //     if (config.inlandZone) {
                        //         return $q.resolve();
                        //     } else {
                        //         return $q.reject();
                        //     }
                        // },
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: [
                                    'controllers/inland_site/site.js',
                                    'directives/grp-form-buttons/grp-form-buttons.js'
                                ]
                            });
                        }
                    }
                })
                .state('main.inland_site.general', {
                    url: '/general',
                    templateUrl: 'controllers/inland_site/general/general.html',
                    controller: 'InlandGeneralCtrl',
                    resolve: {
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: ['controllers/inland_site/general/general.js']
                            });
                        }
                    }
                })
                .state('main.inland_site.resources', {
                    url: '/resources',
                    templateUrl: 'controllers/inland_site/resources/resources.html',
                    controller: 'InlandResourcesCtrl',
                    resolve: {
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: ['controllers/inland_site/resources/resources.js']
                            });
                        }
                    }
                })
                .state('main.inland_site.contacts', {
                    url: '/contacts',
                    templateUrl: 'controllers/inland_site/contacts/contacts.html',
                    controller: 'InlandContactsCtrl',
                    resolve: {
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: ['controllers/inland_site/contacts/contacts.js']
                            });
                        }
                    }
                })
                .state('main.inland_site.contacts.contact', {
                    url: '/:contactid',
                    templateUrl: 'controllers/inland_site/contacts/contact/contact.html',
                    controller: 'InlandContactCtrl',
                    resolve: {
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: ['controllers/inland_site/contacts/contact/contact.js']
                            });
                        }
                    }
                })
                .state('main.inland_site.strategies', {
                    url: '/strategies',
                    templateUrl: 'controllers/inland_site/strategies/strategies.html',
                    controller: 'InlandStrategiesCtrl',
                    resolve: {
                        SimpleLineSymbol: function (esriLoader) {
                            return esriLoader.require('esri/symbols/SimpleLineSymbol').then(function (SimpleLineSymbol) {
                                return SimpleLineSymbol;
                            });
                        },
                        Color: function (esriLoader) {
                            return esriLoader.require('esri/Color').then(function (Color) {
                                return Color;
                            });
                        },
                        UniqueValueRenderer: function (esriLoader) {
                            return esriLoader.require('esri/renderers/UniqueValueRenderer').then(function (UniqueValueRenderer) {
                                return UniqueValueRenderer;
                            });
                        },
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: [
                                    'controllers/inland_site/strategies/strategies.js'
                                ]
                            });
                        }
                    }
                })
                .state('main.inland_site.strategies.strategy', {
                    url: '/:strategyid',
                    templateUrl: 'controllers/inland_site/strategies/strategy/strategy.html',
                    controller: 'InlandStrategyCtrl',
                    resolve: {
                        Graphic: function (esriLoader) {
                            return esriLoader.require('esri/graphic').then(function (Graphic) {
                                return Graphic;
                            });
                        },
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: [
                                    'controllers/inland_site/strategies/strategy/strategy.js'
                                ]
                            });
                        }
                    }
                })
                .state('main.inland_site.strategies.strategy.boom', {
                    url: '/boom/:boomid',
                    templateUrl: 'controllers/inland_site/strategies/strategy/boom/boom.html',
                    controller: 'InlandBoomCtrl',
                    resolve: {
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: [
                                    'controllers/inland_site/strategies/strategy/boom/boom.js'
                                ]
                            });
                        }
                    }
                })
                .state('main.inland_site.logistics', {
                    url: '/logistics',
                    templateUrl: 'controllers/inland_site/logistics/logistics.html',
                    controller: 'InlandLogisticsCtrl',
                    resolve: {
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: [
                                    'controllers/inland_site/logistics/logistics.js'
                                ]
                            });
                        }
                    }
                })
                .state('main.inland_site.attachments', {
                    url: '/attachments',
                    templateUrl: 'controllers/inland_site/attachments/attachments.html',
                    controller: 'InlandAttachmentsCtrl',
                    resolve: {
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: [
                                    'controllers/inland_site/attachments/attachments.js',
                                    'directives/file-upload/file-upload.js',
                                    'directives/attachment-view/attachment-view.js'
                                ]
                            });
                        }
                    }
                })
                .state('main.iap', {
                    url: '/iap/:planid',
                    templateUrl: 'controllers/iap/iap.html',
                    controller: 'IAPCtrl',
                    resolve: {
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: [
                                    'controllers/iap/iap.js',
                                    'directives/grp-form-buttons/grp-form-buttons.js'
                                ]
                            });
                        }
                    }
                })
                .state('main.iap.general', {
                    url: '/general',
                    templateUrl: 'controllers/iap/general/general.html',
                    controller: 'GeneralCtrl',
                    resolve: {
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: [
                                    'controllers/iap/general/general.js',
                                    'directives/attachment-view/attachment-view.js'
                                ]
                            });
                        }
                    }
                })
                .state('main.iap.objectives', {
                    url: '/objectives',
                    templateUrl: 'controllers/iap/objectives/objectives.html',
                    controller: 'ObjectivesCtrl',
                    resolve: {
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: [
                                    'controllers/iap/objectives/objectives.js',
                                    'directives/drag/controller.js'
                                ]
                            });
                        }
                    }
                })
                .state('main.iap.objectives.category', {
                    url: '',
                    params: {
                        categoryid: null
                    },
                    templateUrl: 'controllers/iap/objectives/category/category.html',
                    controller: 'CategoryCtrl',
                    resolve: {
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: [
                                    'controllers/iap/objectives/category/category.js'
                                ]
                            });
                        }
                    }
                })
                .state('main.iap.assignments', {
                    url: '/assignments',
                    templateUrl: 'controllers/iap/assignments/assignments.html',
                    controller: 'AssignmentsCtrl',
                    resolve: {
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: [
                                    'controllers/iap/assignments/assignments.js'
                                ]
                            });
                        },
                        assignments: function (iapService, $stateParams) {
                            return iapService.AssignmentList.load($stateParams.planid).then(function (assignments) {
                                return assignments;
                            });
                        }
                    }
                })
                .state('main.iap.assignments.assignment', {
                    url: '/:assignmentid',
                    templateUrl: 'controllers/iap/assignments/assignment/assignment.html',
                    controller: 'AssignmentCtrl',
                    resolve: {
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: [
                                    'controllers/iap/assignments/assignment/assignment.js'
                                ]
                            });
                        }
                    }
                })
                .state('main.iap.assignments.assignment.contact', {
                    url: '/contact',
                    params: {contactid: null},
                    templateUrl: 'controllers/iap/assignments/assignment/contact/contact.html',
                    controller: 'ContactCtrl',
                    resolve: {
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: [
                                    'controllers/iap/assignments/assignment/contact/contact.js'
                                ]
                            });
                        }
                    }
                })
                .state('main.iap.assignments.assignment.resource', {
                    url: '/resource',
                    params: {resourceid: null},
                    templateUrl: 'controllers/iap/assignments/assignment/resource/template.html',
                    controller: 'ResourceController',
                    resolve: {
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: [
                                    'controllers/iap/assignments/assignment/resource/controller.js'
                                ]
                            });
                        }
                    }
                })
                .state('main.iap.contacts', {
                    url: '/contacts',
                    templateUrl: 'controllers/iap/contacts/contacts.html',
                    controller: 'ContactsCtrl',
                    resolve: {
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: ['controllers/iap/contacts/contacts.js']
                            });
                        }
                    }
                })
                .state('main.iap.contacts.contact', {
                    url: '/:contactid',
                    templateUrl: 'controllers/iap/contacts/contact/contact.html',
                    controller: 'ContactCtrl',
                    resolve: {
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: ['controllers/iap/contacts/contact/contact.js']
                            });
                        }
                    }
                })
                .state('main.iap.medical', {
                    url: '/medical',
                    templateUrl: 'controllers/iap/medical/medical.html',
                    controller: 'MedicalCtrl',
                    resolve: {
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: ['controllers/iap/medical/medical.js']
                            });
                        }
                    }
                })
                .state('main.iap.medical.contact', {
                    url: '/contact',
                    templateUrl: 'controllers/iap/medical/contact/contact.html',
                    controller: 'MedicalContactCtrl',
                    resolve: {
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: ['controllers/iap/medical/contact/contact.js']
                            });
                        }
                    }
                })
                .state('main.iap.attachments', {
                    url: '/attachments',
                    templateUrl: 'controllers/iap/attachments/attachments.html',
                    controller: 'AttachmentsCtrl',
                    resolve: {
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: [
                                    'controllers/iap/attachments/attachments.js',
                                    'directives/file-upload/file-upload.js',
                                    'directives/attachment-view/attachment-view.js'
                                ]
                            });
                        }
                    }
                })
                .state('main.iap.ics234', {
                    url: '/ics234',
                    templateUrl: 'controllers/iap/ics234/objectives.html',
                    controller: 'ICS234Controller',
                    resolve: {
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: [
                                    'controllers/iap/ics234/objectives.js',
                                    'directives/drag/controller.js'
                                ]
                            });
                        }
                    }
                })
                .state('main.iap.ics234.objective', {
                    url: '',
                    params: {
                        objectiveid: null
                    },
                    templateUrl: 'controllers/iap/ics234/objective/objective.html',
                    controller: 'ICS234ObjectiveController',
                    resolve: {
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: [
                                    'controllers/iap/ics234/objective/objective.js'
                                ]
                            });
                        }
                    }
                })
                .state('main.contacts', {
                    url: '/contacts',
                    templateUrl: 'controllers/contacts/list/template.html',
                    controller: 'ContactsListController',
                    resolve: {
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: [
                                    'directives/grp-header/grp-header.js',
                                    'directives/grp-toolbar/grp-toolbar.js',
                                    'controllers/contacts/list/controller.js'
                                ]
                            });
                        }
                    }
                })
                .state('main.iap.ics205', {
                    url: '/ics205',
                    templateUrl: 'controllers/iap/ics205/template.html',
                    controller: 'ICS205Controller',
                    resolve: {
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: [
                                    'controllers/iap/ics205/controller.js'
                                ]
                            });
                        }
                    }
                })
                .state('main.iap.ics205.contact', {
                    url: '/:contactid',
                    params: {team: null},
                    templateUrl: 'controllers/iap/ics205/contact/contact.html',
                    controller: 'ICS205ContactController',
                    resolve: {
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: [
                                    'controllers/iap/ics205/contact/contact.js'
                                ]
                            });
                        }
                    }
                })
                .state('main.defaults', {
                    url: '/defaults',
                    templateUrl: 'controllers/defaults/template.html',
                    controller: 'DefaultsController',
                    resolve: {
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: [
                                    'controllers/defaults/controller.js',
                                    'directives/list-view/controller.js',
                                    'directives/form-view/controller.js',
                                    'directives/grp-form-buttons/grp-form-buttons.js'
                                ]
                            });
                        }
                    }
                })
                .state('main.defaults.objectives', {
                    url: '/objectives',
                    templateUrl: 'controllers/defaults/objectives/template.html',
                    controller: 'ObjectivesDefaultsController',
                    resolve: {
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: [
                                    'controllers/defaults/objectives/controller.js',
                                    'directives/drag/controller.js'
                                ]
                            });
                        }
                    }
                })
                .state('main.defaults.ics234', {
                    url: '/ics234',
                    templateUrl: 'controllers/defaults/ics234/template.html',
                    controller: 'ICS234DefaultsController',
                    resolve: {
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: [
                                    'controllers/defaults/ics234/controller.js',
                                    'directives/drag/controller.js'
                                ]
                            });
                        }
                    }
                })
                .state('main.defaults.assignments', {
                    url: '/assignments',
                    templateUrl: 'controllers/defaults/assignments/template.html',
                    controller: 'AssignmentsDefaultsController',
                    resolve: {
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: [
                                    'controllers/defaults/assignments/controller.js'
                                ]
                            });
                        }
                    }
                })
                .state('grps', {
                    url: '/',
                    templateUrl: 'controllers/grps/template.html',
                    controller: 'GRPsController',
                    resolve: {
                        userInfo: function ($q, esriAuth) {
                            var defer = $q.defer();
                            esriAuth.getUserDetails().then(function () {
                                defer.resolve();
                            });
                            return defer.promise;
                        },
                        loadMyCtrl: function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: 'GRPApp',
                                files: [
                                    'services/config.js',
                                    'directives/grp-toolbar/grp-toolbar.js',
                                    'directives/grp-header/grp-header.js',
                                    'controllers/grps/controller.js'
                                ]
                            });
                        }
                    }
                });
        }])
    .filter('display', function ($filter) {
        'use strict';
        return function (input, displayOptions) {
            if (displayOptions === 'boolean') {
                // TODO: fix boolean
                if (input === 1 || input === true) {
                    return "Yes";
                } else if (input === 0 || input === false) {
                    return "No";
                } else {
                    return "";
                }
            } else if (input === undefined || input === '') {
                return "";
            } else if (displayOptions !== undefined) {
                var displayObject = $filter('filter')(displayOptions, {code: input}, true)[0];
                return (displayObject ? displayObject.name : input);
            }
        };
    });
