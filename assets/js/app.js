// Register the service worker

 if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js");
  console.log("App: service worker registered");
}




getDog()




let myDogElement=document.getElementById("dog")

function getDog() {
  fetch("https://dog.ceo/api/breeds/image/random")
    .then(response => response.json())
    .then(data => {
      // data.message is the image url
      myDogElement.innerHTML = `<img src="${data.message}" alt="Random dog">`
    })
    .catch(error => {
      console.error("No dog today:", error)
      myDogElement.textContent = "Could not fetch a dog 😢"
    })
}




// PUSH: spørg brugeren om lov til at vise notifikationer
let notifyBtn = document.getElementById("notifyBtn")

notifyBtn.addEventListener("click", () => {
  Notification.requestPermission().then(permission => {
    console.log("App: notification permission", permission)

    if (permission === "granted") {
      // Vis en test-notifikation via service workeren
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification("Notifikationer er slået til 🐶")
      })
    }
  })
})


