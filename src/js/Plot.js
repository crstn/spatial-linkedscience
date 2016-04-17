import $ from 'jquery'
import Leaflet from 'leaflet'
import 'leaflet.arc'

// Instantiates a map object
const center = window.innerWidth < 700 ? [40, -95] : [22, -7]
const map = Leaflet.map('map', {
  center: center,
  zoom: 2,
  scrollWheelZoom: true
})

// Icon class for rendering a marker
const pin = Leaflet.icon({
  iconUrl: 'icons/icon-place.svg',
  iconSize: [20, 20],
  iconAnchor: [10, 20],
  className: 'map-marker'
})

let markers = []

// Load and display tile layers on the map
Leaflet.tileLayer(
  'http://a.tiles.mapbox.com/v4/amaldare93.mbpl53l0/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiYW1hbGRhcmU5MyIsImEiOiJGdEFlcHpZIn0.0WX3tspKb0IXCJbdGMLmNQ', {
    attribution: 'Map tiles by <a href="https://www.mapbox.com/">Mapbox</a>'
  }).addTo(map)

// CREATE MAP PIN FOR AN AFFILIATION
function setAffiliation (data) {
  console.log('setAffiliation');
  console.log(data);
  // extract lat and long
  const latlong = data.latlong.value.split(' ').map(parseFloat)

  // create map marker
  const marker = Leaflet.marker(
    latlong, {
      icon: pin,
      title: data.name.value
    }).addTo(map)

  // selectAffiliation
  $(marker).on('click', function () {
    window.location.hash = data.link.value.slice(41)
  })

  // push marker into array (for later deletion)
  markers.push(marker)
}

// CREATE MAP PINS FOR AN AUTHOR
function setAuthorPins (data) {
  console.log('setAuthorPins')
  console.log(data)

  let coords = []

  // For Each affiliation
  data.forEach(function (item) {
    // extract lat and long
    const latlong = item.latlong.value.split(' ').map(val => parseFloat(val))
    console.log(latlong);
    // create map marker
    const marker = Leaflet.marker(latlong, {
        icon: pin,
        title: item.name.value
      }).addTo(map)

    // selectAffiliation
    marker.on('click', function () {
      window.location.hash = item.affiliation.value.slice(41)
    })

    markers.push(marker)
    coords.push(latlong)
  })

  // coords = [[51.96005, 7.60731],[51.96377, 7.61319]]

  // Create polyline between markers
  const polyline = Leaflet.polyline(coords, {
    color: '#FF0000',
    opacity: 1
  }).addTo(map)

  // Zoom into markers
  map.fitBounds(polyline.getBounds(), {
    padding: [50, 50]
  })

}

function zoomTo (latlong) {
  map.setView(
    latlong.split(' ').map(parseFloat), 10, {
      animate: true
    }
  )
}

function clearPins () {
  markers.forEach(function (marker) {
    map.removeLayer(marker)
  })
  markers.length = 0
}

function resetMap () {
  clearPins()
  map.setView(center, 2)
}

export { resetMap }
export default {
  setAffiliation,
  setAuthorPins,
  zoomTo,
  resetMap
}