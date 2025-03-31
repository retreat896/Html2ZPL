class ModuleLoader {
    constructor() {}

    moduleNameDictionary = {
        "navigation": "nav",
        "itemPicker": "items",
        "labelSizes": "labelSizes",
        "innerLeft": "innerLeft",
        "innerRight": "innerRight",
    }
    loadModule(moduleName) {
        //return the given module html file as a dom element using jquery
        if (this.moduleNameDictionary[moduleName]) {
            return fetch(`./modules/${this.moduleNameDictionary[moduleName]}.html`)
                .then((response) => response.text())
                .then((data) => {
                    return $.parseHTML(data);
                });
        }
    }
}