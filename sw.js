// The name of our cache
const CACHE = "static-v2";

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







// 3. FETCH: to caching strategier
//    - dog.ceo (api + billeder): NETWORK FIRST -> ny hund når vi er online, sidste hund når vi er offline
//    - alt andet (statiske filer): CACHE FIRST

self.addEventListener("fetch", (event) => {


  if (event.request.url.includes("dog.ceo")) {
    event.respondWith(networkFirst(event.request));
      console.log("Service worker: network first", event.request.url);
  } else {
    event.respondWith(cacheFirst(event.request));
          console.log("Service worker: network first", event.request.url);
  }
});














// CACHE FIRST: kig i cachen først, ellers hent fra netværket
function cacheFirst(request) {
  return caches.match(request).then((response) => {
    if (response) {
      // Fundet i cachen
      return response;
    } else {
      // Ikke i cachen, hent fra netværket
      return fetch(request);
    }
  });
}



// NETWORK FIRST: hent fra netværket først, ellers brug cachen
function networkFirst(request) {
  return fetch(request)
    .then((response) => {
      // Vi er online: gem en kopi i cachen og send svaret videre
      const copy = response.clone();
      caches.open(CACHE).then((cache) => cache.put(request, copy));
      return response;
    })
    .catch(() => {
      // Vi er offline: hent den sidste hund fra cachen
      return caches.match(request);
    });
}





// 4. PUSH: der kommer en besked -> vis en notifikation
self.addEventListener("push", (event) => {
  console.log("Service worker: push");

  // Teksten fra beskeden (DevTools sender "Test push message from DevTools.")
  const text = event.data ? event.data.text() : "Ny hund klar!";

  event.waitUntil(
    self.registration.showNotification("My dog", {
      body: text,
      icon: "./assets/img/dog.png",
    })
  );
});



/*

// 5. NOTIFICATIONCLICK: brugeren klikker på notifikationen -> åbn appen
self.addEventListener("notificationclick", (event) => {
  console.log("Service worker: notification click");

  event.notification.close();
  event.waitUntil(clients.openWindow("./"));
});

*/

/* hvis du vil teste push notifikationer i DevTools, så skal du først have registreret service workeren og givet lov til notifikationer. Derefter kan du i DevTools -> Application -> Service Workers -> Push en besked til service workeren.

hvis du vil prøve uden en side åben kan du finde service workeren i devtools, og inspecte den og skrive self.registration.showNotification("My dog", { body: "Hej fra service workeren!", icon: "./assets/img/dog.png" })  husk at ændre info så det passer til din kode...*/
