sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast",
    "sap/ui/core/Fragment",
    "sap/ui/model/Sorter",
      
     
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, JSONModel, Filter, FilterOperator, MessageToast, Fragment, Sorter) {
        "use strict";

        const searchCache = {};
        
        return Controller.extend("bupamap.controller.Main", {
                onInit: function () {
                this._mDialogs = {};
                const oMapModel = new JSONModel();
                this.getView().setModel(oMapModel, "Map");
                const oItemsBinding = this.byId("table").getBindingInfo("items");
                oItemsBinding.events = {
                    "dataReceived" : () => {
                        this.rebuildBupaPoints();
                    }
                };
            },

            _openDialog : function (sName, sPage, fInit) {
                var oView = this.getView();
               
                            
                // creates requested dialog if not yet created
                if (!this._mDialogs[sName]) {
                this._mDialogs[sName] = Fragment.load({
                id: oView.getId(),
                name: "bupamap.view." + sName,
                controller: this
                }).then(function(oDialog){
                oView.addDependent(oDialog);
                if (fInit) {
               fInit(oDialog);
               }
                return oDialog;
                });
                }
                this._mDialogs[sName].then(function(oDialog){
               // opens the requested dialog
                 oDialog.open(sPage);
                });
                },

                // Opens View Settings Dialog
handleOpenDialog: function () {
    this._openDialog("Dialog");
   },
            
            onButtonPress: function () { var welcometext1 = this.getView().getModel("i18n").getResourceBundle().getText("welcometext");
            MessageToast.show(welcometext1); },
       
        findRestaurants: async function() {
            const coord = this.getCoordinates("Altenessener Straße 402 45329 Essen DE");
            const query = `[out:json];
            area[name="Essen"]->.a;
            node(area.a)["amenity"="restaurant"];
            out;`;
            const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
            const response = await fetch(url);
            const data = await response.json();
            const restaurants = data.elements.filter(elem => elem.tags && elem.tags.amenity === "restaurant");
            return restaurants;
          },
                       

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
			            const oBinding = oList.getBinding([oFilter1, oFilter2, oFilter3, oFilter4, oFilter5]);
           
		    this.byId("table").getBinding("items").filter(oBinding);
            }
        },
        	            
            getCoordinates: function(sValue) {
                const googleMapsApiToken = "AIzaSyB5T8aWSEsK0bMuYiSjUtzQRp9GUCE6mDA";
                if(!(sValue in searchCache)) {
                    searchCache[sValue] = new Promise(function(resolve, reject) {
                        /*fetch("https://maps.googleapis.com/maps/api/geocode/json?address=" + encodeURIComponent(sValue) + "&key=" + googleMapsApiToken).then(function(oResponse) {
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
                        }); */
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

                // shows selected filters
		handleConfirm: function (oEvent) {
            var oTable = this.byId("table"),
 mParams = oEvent.getParameters(),
 oBinding = oTable.getBinding("items"),
 sPath,
 bDescending,
 aSorters = [],
                aFilters = [];

sPath = mParams.sortItem.getKey();
 bDescending = mParams.sortDescending;
 aSorters.push(new Sorter(sPath, bDescending));

 // apply the selected sort and group settings
 oBinding.sort(aSorters);
mParams.filterItems.forEach(function(oItem) {
    var aSplit = oItem.getKey().split("___"),
   sPath = aSplit[0],
   sOperator = aSplit[1],
    sValue1 = aSplit[2],
    sValue2 = aSplit[3],
 oFilter = new Filter(sPath, sOperator, sValue1, sValue2);
  aFilters.push(oFilter);
  });
    
     // apply filter settings
     oBinding.filter(aFilters);
   var vGroup,
 aGroups = [];

 if (mParams.groupItem) {
sPath = mParams.groupItem.getKey();
 bDescending = mParams.groupDescending;
 vGroup = true; 
 aGroups.push(new Sorter(sPath, bDescending, vGroup));
 // apply the selected group settings
 oBinding.sort(aGroups);
 }
			if (oEvent.getParameters().filterString) {
				MessageToast.show(oEvent.getParameters().filterString);
			}
		}
                        
        });
    });
