﻿// /// <reference path="knockout.d.ts" />
// /// <reference path="knockout.mapping.d.ts" />
// /// <reference path="require.d.ts" />

declare var ko;
declare var Prism;
declare var _;

class DemoViewModel {
    isHtml = ko.observable(false);
    htmlView = ko.observable("");
    htmlExpl = ko.observable("");
    csharpCode = ko.observable("");
    javaCode = ko.observable("");
    pythonCode = ko.observable("");
    currentDemo = ko.observable();
    optionsText = ko.observable();
    urlstring = ko.observable();
    isSimpleJson = ko.observable(false);
    columns = ko.observableArray([]);
    rows = ko.observableArray([]);
    inProgress = ko.observable(false);

    currentClientTime = ko.observable("N/A");
    currentServerTime = ko.observable("N/A");

    presenter: DemoViewModelPresenter = new DemoViewModelPresenter();

    currentDemoCategory = ko.observable();
    demoCategories = ko.observableArray(['']);
    isDemoCategorySelected = ko.computed(() => {
        var category = this.currentDemoCategory();
        return category;
    });

    availableDemos = ko.observableArray();
    currentDemos = ko.computed(() => {
        var category = this.currentDemoCategory();

        return _.filter(this.availableDemos(), demo => demo.ControllerName === category);
    });

    currentDemoParameters = ko.observableArray();

    constructor() {
        this.currentDemo.subscribe(value => {
            this.reset();

            this.setDemoParameters(value);
        });

        $.ajax("/Menu/Index", "GET").done(data => {
            var demos = data["Demos"];

            demos.forEach(demo => {
                if (_.indexOf(this.demoCategories(), demo.ControllerName) === -1) {
                    this.demoCategories.push(demo.ControllerName);
                }

                this.availableDemos.push(demo);
            });
        }).fail(() => {
            this.availableDemos.push("Failed to retreive demos");
        });
    }

    runDemo(): void {
        this.presenter.showResults();

        var currentDemo = this.currentDemo();

        var url = this.getDemoUrl();
        url += this.getQueryString();

        this.isHtml(false);
        this.isSimpleJson(false);
        this.inProgress(true);
        $.ajax(url, "GET")
            .done(data => {
                this.inProgress(false);
                //console.log(data);

                var jsonObj = data;

                if (currentDemo.DemoOutputType === 'String') {
                    this.htmlView(data);
                    this.inProgress(false);
                    this.isHtml(true);
                    return;
                }

                if (data instanceof Array === false) {
                    jsonObj = [data];
                }

		        this.columns([]);
				this.rows([]);

				var newColumns = [];
				var newRows = [];

                for (var i = 0; i < jsonObj.length; i++) {

                    var item = jsonObj[i];
                    var newItem = {};

                    for (var key in item) {
                        if (i === 0)
                            newColumns.push(key);

                        if (typeof item[key] !== "object") {
                            newItem[key] = item[key];
                        } else {
                            if (currentDemo.DemoOutputType === 'Flatten') {
                                for (var deeperKey in item[key]) {
                                    if (i === 0)
                                        newColumns.push(deeperKey);
                                    if (typeof item[key][deeperKey] !== "object")
                                        newItem[deeperKey] = item[key][deeperKey];
                                    else
                                        newItem[deeperKey] = JSON.stringify(item[key][deeperKey]);
                                }
                            } else {
                                newItem[key] = JSON.stringify(item[key]);
                            }
                        }
                    }
                    newRows.push(newItem);
                }

				this.inProgress(false);
                this.isSimpleJson(true);

                this.columns(newColumns);
                this.rows(newRows);
            })
            .fail((jqXHR, textStatus, errorThrown) => {
                this.htmlView('Error Status : ' + jqXHR.status + '<br>' + jqXHR.responseText);
                this.inProgress(false);
                this.isHtml(true);
            })
            .always((a, b, request) => {
                var clientTime = request.getResponseHeader('Client-Time');
                var serverTime = request.getResponseHeader('Server-Time');

                if (clientTime) {
                    var clientTimeAsNumber = parseFloat(clientTime);
                    var clientTimeString = clientTimeAsNumber.toString();
                    if (clientTimeAsNumber <= 0) {
                        clientTimeString = " time<0.01";
                    }

                    this.currentClientTime(clientTimeString + " seconds");
                }
                else
                    this.currentClientTime("N/A");

                if (serverTime) {
                    var serverTimeAsNumber = parseFloat(serverTime);
                    var serverTimeString = serverTimeAsNumber.toString();
                    if (serverTimeAsNumber <= 0) {
                        serverTimeString = " time<0.01";
                    }

                    this.currentServerTime(serverTimeString + " seconds");
                }
                else
                    this.currentServerTime("N/A");
            });
    }

    getCode(): void {
        this.presenter.showCode();
        var demoUrl = this.getDemoUrl();
        $.ajax("/Menu/LoadData?url=" + demoUrl, "GET").done(data => {
            console.log(data);
            this.htmlExpl(data.HtmlExp);
            this.javaCode(data.JavaCode);
            this.csharpCode(data.CsharpCode);
            this.pythonCode(data.PythonCode);
            Prism.highlightAll();
        });
    }

    genUrl(): void {
        var url = window.location.href.replace(/\/$/, "") + this.getDemoUrl();
        url += this.getQueryString();

        this.urlstring(url);
    }

    getQueryString(): string {
        var queryString = '';
        var parameters = this.currentDemoParameters();
        var firstParameter = true;

        parameters.forEach(parameter => {
            var value = parameter.ParameterValue();
            if (value) {
                var parameterQueryString = parameter.ParameterName + "=" + value;

                if (firstParameter) {
                    firstParameter = false;
                    queryString += "?" + parameterQueryString;
                } else {
                    queryString += "&" + parameterQueryString;
                }
            }
        });

        return queryString;
    }

    getDemoUrl(): string {
        var demo = this.currentDemo();
        return "/" + demo.ControllerName + "/" + demo.DemoName;
    }

    openNewTab(): void {
        window.open(this.urlstring(), '_blank');
    }

    reset(): void {
        this.genUrl();
        this.isHtml(false);
        this.isSimpleJson(false);
        this.getCode();
        this.currentClientTime("N/A");
        this.currentServerTime("N/A");
    }

    setDemoParameters(demo) {
        this.currentDemoParameters([]);
        var parameters = demo.DemoParameters;
        parameters.forEach(parameter => {
            var demoParameter = {
                ParameterName: parameter.ParameterName,
                ParameterType: parameter.ParameterType,
                ParameterIsRequired: parameter.IsRequired,
                ParameterValue: ko.observable()
            };

            demoParameter.ParameterValue.subscribe(() => {
                this.genUrl();
            });

            this.currentDemoParameters.push(demoParameter);
        });
    }
}