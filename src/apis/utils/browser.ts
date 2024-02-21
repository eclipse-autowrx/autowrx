export class IsBrowser {
    static Firefox() {
        return navigator.userAgent.toLowerCase().indexOf("firefox") > -1;
    }
    static Chrome() {
        console.log("CHROME", navigator.userAgent.toLowerCase().indexOf("chrome") > -1);
        return navigator.userAgent.toLowerCase().indexOf("chrome") > -1;
    }
    static Safari() {
        return typeof (window as any).safari !== "undefined";
    }
}
