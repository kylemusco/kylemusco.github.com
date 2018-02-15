var app = angular.module("portfolio", ["ngRoute"]);
app.config(function($routeProvider) {
    $routeProvider
    .when("/", {
        templateUrl : "views/main.html"
    })
    .when("/projects", {
        templateUrl : "views/projects.html"
    })
    .when("/experience", {
        templateUrl : "views/experience.html"
    });
});