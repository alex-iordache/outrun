"use-strict";
//SELECTORS

const mapContainer = document.querySelector(".map-container");
const form = document.querySelector(".form");
const typeInput = document.getElementById("type");
const distanceInput = document.getElementById("distance");
const durationInput = document.getElementById("duration");
const cadenceInput = document.getElementById("cadence");
const elevGainInput = document.getElementById("elevGain");
const workoutsList = document.querySelector(".workouts");
const cadenceLabel = document.getElementById("cadence-label");
const elevGainLabel = document.getElementById("elevGain-label");
const listContainer = document.querySelector(".list-container");
const introMessage = document.querySelector(".intro-message");
const closeButton = document.querySelector(".close-button");
const sortBar = document.querySelector(".sort");
const sortRuns = document.querySelector(".runs");
const sortRides = document.querySelector(".rides");
const sortDistanceUp = document.querySelector(".sort-distance-up");
const sortDistanceDown = document.querySelector(".sort-distance-down");
const sortDistance = document.querySelector(".sort-distance");
const sortDurationUp = document.querySelector(".sort-duration-up");
const sortDurationDown = document.querySelector(".sort-duration-down");
const sortDuration = document.querySelector(".sort-duration");

// prettier-ignore
const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];

class App {
  #map;
  #markers = {};
  #coords = [];
  #workouts = [];
  #mapEvent;
  #workoutData = {};
  #currentWorkout;
  #localData;
  constructor() {
    this._getPosition();

    form.addEventListener("submit", this._processForm.bind(this));
    typeInput.addEventListener("change", this._switchWork);
    listContainer.addEventListener(
      "click",
      this._processWorkoutClick.bind(this)
    );
    this._getLocalStorage();
    sortRuns.addEventListener("click", this._sortRuns.bind(this));
    sortRides.addEventListener("click", this._sortRides.bind(this));
    console.log(this.#markers);
    sortDistanceUp.addEventListener("click", this._distanceSortUp.bind(this));
    sortDistanceDown.addEventListener(
      "click",
      this._distanceSortDown.bind(this)
    );
    sortDurationUp.addEventListener("click", this._durationSortUp.bind(this));
    sortDurationDown.addEventListener(
      "click",
      this._durationSortDown.bind(this)
    );
  }

  _distanceSortUp() {
    const by = "distance";
    const way = "up";
    this._workoutsSort(by, way);
  }

  _distanceSortDown() {
    const by = "distance";
    const way = "down";
    this._workoutsSort(by, way);
  }

  _durationSortUp() {
    const by = "duration";
    const way = "up";
    this._workoutsSort(by, way);
  }

  _durationSortDown() {
    const by = "duration";
    const way = "down";
    this._workoutsSort(by, way);
  }

  _workoutsSort(by, way) {
    const buffer = this.#workouts.slice(0);

    buffer.sort(function (a, b) {
      const itemA = a[by];
      const itemB = b[by];
      let returnValue = 0;
      if (way === "down") {
        itemA > itemB ? (returnValue = -1) : (returnValue = 1);
      }
      if (way === "up") {
        itemA > itemB ? (returnValue = 1) : (returnValue = -1);
      }

      return returnValue;
    });

    this._clearAllWorkouts(buffer);
    console.log(this.#workouts);
    this._restoreWorkouts(buffer);
  }

  _clearAllWorkouts(buffer) {
    buffer.forEach((work) => {
      console.log("clearAllWorkouts, ID:", work.id);
      this._deleteWorkout(work.id);
    });
  }
  _showSort() {
    sortBar.classList.remove("hidden");
  }

  _hideSort() {
    sortBar.classList.add("hidden");
  }

  _sortRuns() {
    const selection = document.querySelectorAll(`.workout--running`);
    selection.forEach((item) => {
      item.parentNode.classList.toggle("hidden");
      if (item.parentNode.classList.contains("hidden"))
        this._deleteMarker(+item.dataset.id);
      if (!item.parentNode.classList.contains("hidden"))
        this._addMarker(+item.dataset.id);
      console.log(+item.dataset.id);
    });
    sortRuns.classList.toggle("sort-active");
  }

  _sortRides() {
    const selection = document.querySelectorAll(`.workout--cycling`);
    selection.forEach((item) => {
      item.parentNode.classList.toggle("hidden");
      if (item.parentNode.classList.contains("hidden"))
        this._deleteMarker(+item.dataset.id);
      if (!item.parentNode.classList.contains("hidden"))
        this._addMarker(+item.dataset.id);
      console.log(+item.dataset.id);
    });
    sortRides.classList.toggle("sort-active");
  }

  _restoreWorkouts(workArr) {
    // clear workouts from Arr first
    this.#workouts = [];
    // clear UI second

    workArr.forEach((item) => {
      this.#coords = item.coords;
      this.#workoutData.type = item.type;
      this.#workoutData.distance = item.distance;
      this.#workoutData.duration = item.duration;
      this.#workoutData.elevationGain = item.elevationGain;
      this.#workoutData.cadence = item.cadence;
      this.#workoutData.id = item.id;

      if (item.type === "running") this._createRunningWorkout();
      if (item.type === "cycling") this._createCyclingWorkout();

      this._addWorkoutToArr();
      this._addWorkoutToList();
      this._addWorkoutToUI();
    });

    if (this.#workouts.length > 2) {
      this._hideIntroMessage();
      this._showSort();
    }
  }

  _processWorkoutClick(e) {
    if (!e.target.closest(".workout")) return;

    const id = +e.target.closest(".workout").dataset.id;
    const coords = this.#workouts[
      this.#workouts.findIndex((obj) => obj.id === id)
    ].coords;

    if (e.target.classList.contains("close-button")) {
      this._deleteWorkout(id, coords);
    }

    if (!e.target.classList.contains("close-button")) {
      this._moveMap(coords);
    }
  }

  _deleteWorkout(id) {
    // Delete workout from workouts array
    //// Find Index of Workout using ID
    const workoutIndex = this.#workouts.findIndex((work) => work.id === id);
    console.log("index in array of id. Index:", workoutIndex, " ID:", id);
    //// Take that Index out of the array
    this.#workouts.splice(workoutIndex, 1);
    console.log("Took out that Index, this is what remains:", this.#workouts);

    // Delete workout from List
    const myWorkout = document.querySelector(`[data-id='${id}']`);
    myWorkout.parentNode.remove();
    // Delete marker from map
    this._deleteMarker(id);
    // Delete workout from localStorage
    //this._addWorkoutToLocalStorage();
    if (this.#workouts.length < 1) {
      this._showIntroMessage();
    }

    if (this.#workouts.length < 2) {
      this._hideSort();
    }
  }

  _deleteMarker(id) {
    this.#map.removeLayer(this.#markers[id]);
  }

  _addMarker(id) {
    this.#map.addLayer(this.#markers[id]);
    this.#markers[id].bindPopup().openPopup();
  }
  _moveMap(coords) {
    this.#map.panTo(new L.latLng(coords), { animate: true, duration: 0.5 });
  }

  _switchWork() {
    cadenceInput.classList.toggle("hidden");
    cadenceLabel.classList.toggle("hidden");
    elevGainInput.classList.toggle("hidden");
    elevGainLabel.classList.toggle("hidden");
  }

  _getPosition() {
    const myLocation = navigator.geolocation.getCurrentPosition(
      this._loadMap.bind(this),
      function () {
        alert(
          "You did not provide access to your location - nothing works now!"
        );
      }
    );
  }

  _loadMap(position) {
    const { latitude, longitude } = position.coords;
    const coords = [latitude, longitude];
    this.#map = L.map(mapContainer).setView(coords, 13);
    this.#map.on("load", function () {
      console.log("map loaded");
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on("click", this._processClickOnMap.bind(this));
    if (this.#localData.length) {
      this._hideIntroMessage();
      this._restoreWorkouts(this.#localData);
    }

    if (this.#workouts.length > 1) this._showSort();
  }

  _processClickOnMap(mapE) {
    this.#mapEvent = mapE;
    const { lat, lng } = this.#mapEvent.latlng;
    this.#coords = [lat, lng];
    this._hideIntroMessage();
    this._showForm();
  }

  _hideIntroMessage() {
    introMessage.classList.add("hidden");
  }
  _showIntroMessage() {
    introMessage.classList.remove("hidden");
  }
  _showForm() {
    form.classList.remove("form--hidden");
  }

  _processForm(e) {
    e.preventDefault();
    const dataCheck = this._getData();
    if (!dataCheck) return;
    //this._clearForm();
    //this._hideForm();

    if (this.#workoutData.type === "running") this._createRunningWorkout();
    if (this.#workoutData.type === "cycling") this._createCyclingWorkout();

    this._addWorkoutToArr();
    this._addWorkoutToList();
    this._addWorkoutToLocalStorage();
    this._hideForm();
    this._clearForm();
    this._addWorkoutToUI();
  }

  _getData() {
    let dataCheck;

    if (typeInput.value === "running") {
      dataCheck = this._validPositiveNumbers(
        +durationInput.value,
        +distanceInput.value,
        +cadenceInput.value
      );
    }

    if (typeInput.value === "cycling") {
      dataCheck =
        this._validPositiveNumbers(
          +durationInput.value,
          +distanceInput.value
        ) && this._validNumbers(+elevGainInput.value);
    }
    if (!dataCheck) {
      alert(
        "For elevation gain you can enter positive or negative numbers, for the rest positive numbers. You entered something wrong! Try again!"
      );
      return false;
    }
    this.#workoutData.type = typeInput.value;
    this.#workoutData.duration = +durationInput.value;
    this.#workoutData.distance = +distanceInput.value;
    this.#workoutData.cadence = +cadenceInput.value;
    this.#workoutData.elevationGain = +elevGainInput.value;
    return true;
  }

  _clearLocalStorage() {
    const key = "workouts";
    const value = "";
    localStorage.setItem(key, value);
    console.log("cleared Local Storage");
  }
  _addWorkoutToLocalStorage() {
    const key = "workouts";
    const value = JSON.stringify(this.#workouts);
    localStorage.setItem(key, value);
  }

  _getLocalStorage() {
    this.#localData = JSON.parse(localStorage.workouts);
  }

  _validPositiveNumbers(...arr) {
    return arr.every((item) => item > 0 && Number.isFinite(item));
  }

  _validNumbers(item) {
    return Number.isFinite(item);
  }

  _clearForm() {
    durationInput.value = "";
    distanceInput.value = "";
    cadenceInput.value = "";
    elevGainInput.value = "";
  }

  _hideForm() {
    form.style.display = "none";
    form.classList.add("form--hidden");
    setTimeout(function () {
      form.style.display = "grid";
    }, 1000);
  }

  _createRunningWorkout() {
    this.#currentWorkout = new Running(
      this.#coords,
      this.#workoutData.type,
      this.#workoutData.distance,
      this.#workoutData.duration,
      this.#workoutData.cadence
    );
  }

  _createCyclingWorkout() {
    this.#currentWorkout = new Cycling(
      this.#coords,
      this.#workoutData.type,
      this.#workoutData.distance,
      this.#workoutData.duration,
      this.#workoutData.elevationGain
    );
  }
  _addWorkoutToArr() {
    this.#workouts.push(this.#currentWorkout);
  }

  _addWorkoutToList() {
    const htmlMain = `
        <li>
            <div class="workout workout--${
              this.#currentWorkout.type
            }" data-id="${
      this.#currentWorkout.id
    }"><div class="close-button">X</div>
                <h2 class="workout__title">${
                  this.#currentWorkout.description
                }</h2>
                <div class="workout__details">
                    <p>🏳‍🌈 ${this.#currentWorkout.distance} <span>KM</span></p>
                    <p>🕐 ${this.#currentWorkout.duration} <span>MIN</span></p>
    `;

    const htmlRunning = `
    <p>⚡ ${this.#currentWorkout.cadence} <span>MIN/KM</span></p>
                    <p>🦶 ${this.#currentWorkout.pace} <span>SPM</span></p>
                </div>                           
            </div>
        </li>
    `;

    const htmlCycling = `
    <p>⚡ ${this.#currentWorkout.speed} <span>KM/H</span></p>
                    <p>⛰ ${
                      this.#currentWorkout.elevationGain
                    } <span>Elev</span></p>
                </div>                           
            </div>
        </li>
        `;

    if (this.#currentWorkout.type === "running") {
      workoutsList.insertAdjacentHTML(
        "afterbegin",
        `${htmlMain}${htmlRunning}`
      );
    }
    if (this.#currentWorkout.type === "cycling") {
      workoutsList.insertAdjacentHTML(
        "afterbegin",
        `${htmlMain}${htmlCycling}`
      );
    }

    if (this.#workouts.length > 1) {
      this._showSort();
    }
  }

  // _addWorkoutToUI() {
  //   L.marker(this.#currentWorkout.coords)
  //     .addTo(this.#map)
  //     .bindPopup(this.#currentWorkout.description)
  //     .openPopup();
  // }

  _addWorkoutToUI() {
    const marker = new L.marker(this.#currentWorkout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          autoClose: false,
          closeOnClick: false,
          className: `leaflet-${this.#currentWorkout.type}`,
        }).setContent(this.#currentWorkout.description)
      )
      .openPopup();

    this.#markers[this.#currentWorkout.id] = marker;
  }
}

class Workout {
  constructor(coords, type, distance, duration) {
    this.id = Date.now();
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
    this.type = type;

    this.date = new Date();
    this.description = `${
      this.type === "running" ? "🏃‍♀️ Running" : "🚴‍♀️ Cycling"
    } on ${this.date.getDate()} ${
      months[this.date.getMonth()]
    } ${this.date.getFullYear()}`;
  }
}

class Running extends Workout {
  constructor(coords, type, distance, duration, cadence) {
    super(coords, type, distance, duration);
    this.cadence = cadence;
    this.pace = Math.round(this.duration / this.distance);
    this.type = "running";
  }
}

class Cycling extends Workout {
  constructor(coords, type, distance, duration, elevationGain) {
    super(coords, type, distance, duration);
    this.speed = Math.round(this.distance / (this.duration / 60));
    this.type = "cycling";
    this.elevationGain = elevationGain;
  }
}

const app = new App();

/////////////////////////////////
/////// UNDE AM RAMAS:
/// Sortarea dupa Distanta
