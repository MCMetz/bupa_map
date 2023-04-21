sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast",
    
       
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, JSONModel, Filter, FilterOperator, MessageToast) {
        "use strict";

        const searchCache = {};

        return Controller.extend("bupamap.controller.Main", {
                onInit: function () {
                const oMapModel = new JSONModel();
                this.getView().setModel(oMapModel, "Map");
                const oItemsBinding = this.byId("table").getBindingInfo("items");
                oItemsBinding.events = {
                    "dataReceived" : () => {
                        this.rebuildBupaPoints();
                    }
                };
            },
            onButtonPress: function () { var welcometext1 = this.getView().getModel("i18n").getResourceBundle().getText("welcometext");
            MessageToast.show(welcometext1); },
            onButtonPress2: function () { var welcometext2 = this.getView().getModel("i18n").getResourceBundle().getText("welcometext2");
            MessageToast.show(welcometext2); },
                       

                rebuildBupaPoints: function() {
                const oMapModel = this.getView().getModel("Map");
                const oDataModel = this.getView().getModel();
                const aBusinessPartner = this.byId("table").getBinding("items").getAllCurrentContexts().map(oContext => oDataModel.getProperty(oContext.getPath()));
                const aFeaturePromises = aBusinessPartner.map(oBusinessPartner => {
                    return this.getCoordinates(oBusinessPartner.AddressLine1Text);
                });
                Promise.all(aFeaturePromises).then(aFeatures => {
                    const oData = {features: aFeatures};
                    oMapModel.setData(oData);
                });
            },
            onAddfeature: function() {
                const oBupaVectorSource= this.byId("vectorSource");
                const aExtent = oBupaVectorSource.getExtent();
                if(aExtent && aExtent[0] !== Infinity) {
                    this.byId("map").viewFit(aExtent, true);
                }
            },
/*             onFilterBupa: function(oEvent) {
                const sSearch = oEvent.getParameter("query");
                if(sSearch) {
                    this.byId("table").getBinding("items").filter([new Filter("Name", FilterOperator.Contains, sSearch)])
                    this.byId("table").getBinding("items").filter([new Filter("AddressLine1Text", FilterOperator.Contains, sSearch)]);
                    this.byId("table").getBinding("items").filter([new Filter("Region", FilterOperator.Contains, sSearch)]);
                    this.byId("table").getBinding("items").filter([new Filter("Role", FilterOperator.Contains, sSearch)])
                    this.byId("table").getBinding("items").filter([new Filter("FirstName", FilterOperator.Contains, sSearch)])
                } 
                else {
                    this.byId("table").getBinding("items").filter([]);
                }
            }, */

            onFilterBupa: function(oEvent) {
                const sSearch = oEvent.getParameter("query");
                if(sSearch) {
                    const oFilter1 = new Filter("Name", FilterOperator.Contains, sSearch);
                    const oFilter2 = new Filter("AddressLine1Text", FilterOperator.Contains, sSearch);
                    const oFilter3 = new Filter("Region", FilterOperator.Contains, sSearch);
                    const oFilter4 = new Filter("Role", FilterOperator.Contains, sSearch);
                    const oFilter5 = new Filter("FirstName", FilterOperator.Contains, sSearch);
                    
                    // Combine the filters using logical OR
                    const oCombinedFilter = new Filter({
                        filters: [oFilter1, oFilter2, oFilter3, oFilter4, oFilter5],
                        and: false
                    });
            
                    this.byId("table").getBinding("items").filter([oCombinedFilter]);
                } 
                else {
                    this.byId("table").getBinding("items").filter([]);
                }
            },

            
		onFilterBupa2 : function (oEvent) {
			// build filter array
			const sQuery = oEvent.getParameter("query");
			if (sQuery) {
			const oFilter1 = new Filter("Name", FilterOperator.Contains, sQuery);
            const oFilter2 = new Filter("AdressLineText", FilterOperator.Contains, sQuery);
            const oFilter3 = new Filter("Region", FilterOperator.Contains, sQuery);
            const oFilter4 = new Filter("Role", FilterOperator.Contains, sQuery);
            const oFilter5 = new Filter("FirstName", FilterOperator.Contains, sQuery);
			

			// filter binding
            			const oList = this.byId("items");
			            const oBinding = oList.getBinding("items");
           
			oBinding.filter("items");
            }
        },
		
            
            getCoordinates: function(sValue) {
                const googleMapsApiToken = "AIzaSyB5T8aWSEsK0bMuYiSjUtzQRp9GUCE6mDA";
                if(!(sValue in searchCache)) {
                    searchCache[sValue] = new Promise(function(resolve, reject) {
                        fetch("https://maps.googleapis.com/maps/api/geocode/json?address=" + encodeURIComponent(sValue) + "&key=" + googleMapsApiToken).then(function(oResponse) {
                            return oResponse.json();
                        }).then(function(oLocation) {
                            try {
                                if ("results" in oLocation && oLocation.results.length > 0) {
                                    var dGoogleLongitude = oLocation.results[0].geometry.location.lng;
                                    var dGoogleLatitude = oLocation.results[0].geometry.location.lat;
                                    console.log(searchCache[sValue]);
                                    // POINT(11.3932675123215 48.2635197942589)
                                    resolve({"wkt": "POINT("+dGoogleLongitude+" "+dGoogleLatitude+")"});
                                }
                            } catch (e) {
                                console.log(e);
                                reject(e);
                            }
                        });
                    });
                }
                return searchCache[sValue];
            },
            
                _getMapExtent: function() {
               const oMap = this.byId("map");
                 const aExtent = oMap.getView().calculateExtent();
                const sExtent = `${aExtent[1]},${aExtent[0]},${aExtent[3]},${aExtent[2]}`;
               return sExtent;
                },
            onToggleSwitchChange: function(oEvent) {
                var oSwitch = oEvent.getSource();
                var oLabel = this.byId("dwd");
                var bIsOn = oSwitch.getState();
                oLabel._layer.setVisible(bIsOn);
            }
        });
    });
