// The name of our cache
const CACHE = "static-v1";

// static files til offline brug
const FILES = [
  "./",
  "./index.html",
  "./assets/css/site.css",
  "./assets/js/app.js",
  "./assets/img/dog.png",
  "./manifest.json",
];

// 1. INSTALL: gem filerne i cache
self.addEventListener("install", (event) => {
  console.log("Service worker: install");

  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(FILES))
  
  );
});





// 2. ACTIVATE: serviceworker aktiveres og den er klar til brug  husk at lukke åbne tabs i browseren for at aktivere den nye service worker
self.addEventListener("activate", () => {
  console.log("Service worker: activate");
});







// 3. FETCH: strategi cache first hvor vi først tjekker om filen findes i cache, hvis ikke henter vi den fra netværket
self.addEventListener("fetch", (event) => {

  console.log("Service worker: event", event);
   console.log("Service worker: fetch", event.request.url);

  event.respondWith(

    caches.match(event.request).then((response) => {
      if (response) {
        // Found in the cache
        return response;
      } else {
        // Not in the cache, get it from the network
        return fetch(event.request);
      }
    })


  ); 
});
