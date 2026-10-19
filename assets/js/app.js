// Register the service worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js");
  console.log("App: service worker registered");
}
