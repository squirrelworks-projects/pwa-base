# PWA-udvikling – Pensumoversigt

Oct 22, 2026 · @Bo

## Pensum

På tre dage har vi gjort en almindelig webapp til en installerbar PWA, der også virker offline. Vi har arbejdet med de tre filer, der adskiller en PWA fra en normal webside – **ikoner**, **manifest** og **service worker** – og med hvordan service workeren cacher filer og vælger caching-strategi.

| Dag | Emne | Det skal du kunne bagefter |
| --- | --- | --- |
| 1 | Minimum installable | Skrive et manifest med de members, styresystemet skal bruge for at installere appen |
| 2 | Service worker | Registrere en service worker, kende dens lifecycle og cache statiske filer med *cache first* |
| 3 | Caching-strategier | Bygge en fetch-listener, der vælger *cache first* eller *network first* ud fra request-URL'en |

Gennemgående eksempel: appen **doggy**, der viser hundebilleder fra dog.ceo-API'et.

## Dag 1 – Minimum installable

En webapp bliver installerbar, når browseren finder et gyldigt manifest med ikon, og siden serveres over HTTPS (eller fra localhost).

### De tre ting der gør det til en PWA

| Fil | Hvad den gør |
| --- | --- |
| `manifest.json` | Fortæller styresystemet, hvad appen hedder, hvor den starter, og hvordan den vises |
| Ikon (fx `dog.png`) | Bruges på hjemmeskærm, i app-listen og på splash-skærmen |
| `sw.js` (service worker) | Gør appen hurtig og offline-klar – det arbejder vi med på dag 2 og 3 |

### Vores manifest

```json
{
  "name": "doggy",
  "start_url": "./",
  "display": "standalone",
  "icons": [
    {
      "src": "./assets/img/dog.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

| Member | Betydning |
| --- | --- |
| `name` | Appens navn, som det vises ved installation |
| `start_url` | Siden appen åbner på, når den startes fra hjemmeskærmen |
| `display` | `standalone` = appen åbner i sit eget vindue uden browserens adresselinje |
| `icons` | Liste af ikoner med sti (`src`), størrelse (`sizes`) og filtype (`type`) |

### Link manifestet ind i HTML

```html
<link rel="manifest" href="./manifest.json">
```

**Tip:** Chrome/Android forventer i praksis et ikon i både 192x192 og 512x512. Tilføj et 192-ikon, hvis appen ikke vil installere. Tjek det i DevTools → *Application* → *Manifest*.

## Dag 2 – Service worker

En service worker er et script, der kører i baggrunden mellem appen og netværket. Den kan opsnappe alle requests og svare fra en cache – det er det, der gør appen offline-klar.

### Registrering (i `app.js`)

```javascript
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js");
}
```

Vi tjekker først, om browseren understøtter service workers. Filen `sw.js` ligger i roden, så den styrer hele appen.

### Lifecycle

1. **install** – kører én gang, når en ny service worker opdages. Her gemmer vi de statiske filer i cachen (*cache statics on install*).
2. **activate** – service workeren overtager styringen. Vi gør ikke noget her endnu – kun en `console.log`.
3. **fetch** – kører ved hver eneste request fra appen. Her bestemmer vi, hvor svaret skal komme fra.

### Cache statics on install

```javascript
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(FILES))
  );
});
```

`event.waitUntil()` får browseren til at vente, til alle filer er gemt. Fejler én fil i `FILES`, fejler hele installationen – så tjek stierne.

### Cache first, then network

Vi kigger i cachen først. Findes filen, sender vi den. Ellers henter vi den fra netværket. Det er hurtigt og virker offline for alt, der blev cachet ved install.

## Dag 3 – Caching-strategier

Forskellige filer har brug for forskellige strategier. Fetch-listeneren kigger på `event.request.url` og vælger strategi ud fra, hvor requesten går hen.

| Strategi | Hvordan | Bruges til i doggy | Fordel | Ulempe |
| --- | --- | --- | --- | --- |
| Cache first | Cache → ellers netværk | HTML, CSS, JS, ikon, manifest | Hurtig, virker offline | Viser gammelt indhold, til cachen opdateres |
| Network first | Netværk → ellers cache | dog.ceo (API + hundebilleder) | Altid nyt indhold online | Langsommere, kræver net for nyt indhold |

### Fetch-listener der skelner

```javascript
self.addEventListener("fetch", (event) => {
  if (event.request.url.includes("dog.ceo")) {
    event.respondWith(networkFirst(event.request));
  } else {
    event.respondWith(cacheFirst(event.request));
  }
});
```

`event.respondWith()` erstatter browserens normale svar med det, vores funktion returnerer.

### Cache first

```javascript
function cacheFirst(request) {
  return caches.match(request).then((response) => {
    if (response) {
      return response;      // fundet i cachen
    } else {
      return fetch(request); // ikke i cachen, hent fra netværket
    }
  });
}
```

### Network first

```javascript
function networkFirst(request) {
  return fetch(request)
    .then((response) => {
      // online: gem en kopi i cachen og send svaret videre
      const copy = response.clone();
      caches.open(CACHE).then((cache) => cache.put(request, copy));
      return response;
    })
    .catch(() => {
      // offline: hent den sidste hund fra cachen
      return caches.match(request);
    });
}
```

`response.clone()` er nødvendig, fordi et response kun kan læses én gang: én kopi til cachen, én til siden.

**Hvad betyder det, at et response bliver "consumed"?**

&#32;Kroppen (body) i et response er en *stream* – data der løber igennem én gang, ligesom vand i et rør. Når noget læser kroppen – fx `response.json()`, `response.text()`, `cache.put()` eller browseren, der viser siden – er streamen brugt op. Prøver man at læse den igen, får man fejlen *"body has already been consumed"* (eller *"body used already"*). Derfor laver vi `response.clone()`, *før* noget læser svaret: klonen går i cachen, originalen sendes videre til siden.

### Hele service workeren (`sw.js`)

```javascript
const CACHE = "static-v2";

const FILES = [
  "./",
  "./index.html",
  "./assets/css/site.css",
  "./assets/js/app.js",
  "./assets/img/dog.png",
  "./manifest.json",
];

self.addEventListener("install", (event) => {
  console.log("Service worker: install");
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(FILES))
  );
});

self.addEventListener("activate", () => {
  console.log("Service worker: activate");
});

self.addEventListener("fetch", (event) => {
  if (event.request.url.includes("dog.ceo")) {
    event.respondWith(networkFirst(event.request));
    console.log("Service worker: network first", event.request.url);
  } else {
    event.respondWith(cacheFirst(event.request));
    console.log("Service worker: cache first", event.request.url);
  }
});

// + funktionerne cacheFirst() og networkFirst() fra ovenfor
```

## Fejlfinding og huskeregler

- **Ny service worker aktiveres ikke?** Den venter, til alle faner med appen er lukket. Luk fanerne, eller brug *Update on reload* i DevTools → *Application* → *Service workers*.
- **Ændret i en fil, men ser den gamle?** Cache first viser den cachede version. Skift cachenavnet (fx `static-v2` → `static-v3`), så filerne caches på ny.
- **Install fejler?** En sti i `FILES` er forkert. Se fejlen i konsollen.
- **Kan ikke installere?** Tjek *Application* → *Manifest* for fejl, og at siden kører på HTTPS eller localhost.
- **Test offline:** DevTools → *Network* → *Offline*. Doggy skal stadig vise siden og den sidste hund.

## Kilder

- [MDN: Progressive web apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps) – kursets hovedkilde

Vi bruger Cache API'et (`caches`) til at gemme svar lokalt i browseren, så appen kan svare uden netværk: `caches.open(CACHE)` åbner (eller opretter) vores cache, `cache.addAll(FILES)` gemmer de statiske filer ved install, `cache.put(request, copy)` gemmer det nyeste hundesvar i network first, og `caches.match(request)` finder et gemt svar, når vi skal svare fra cachen.

I fetch-listeneren bruger vi `event.request.url.includes("dog.ceo")` til at skelne mellem requests. `includes()` returnerer `true`, hvis URL'en indeholder teksten "dog.ceo" – så går requesten til network first. Alle andre URL'er (vores egne filer) giver `false` og går til cache first.
