mapboxgl.accessToken = 'pk.eyJ1IjoieXVuamllIiwiYSI6ImNpZnd0ZjZkczNjNHd0Mm0xcGRoc21nY28ifQ.8lFXo9aC9PfoKQF9ywWW-g';
// x makin besar makin ke kanan
// y makin besar makin ke atas
var sfmapbox = [110, -6.85];
// sfmapbox = [-122,37];
var mylocation = sfmapbox;
var taxon_active = 'Suku';
var markers = {};
var marker_me;

// Create a new dark theme map
var map = new mapboxgl.Map({
    container: 'map', // container id
    //light, outdoors, dark, bright
    style: 'mapbox://styles/mapbox/outdoors-v9',
    center: sfmapbox, // Center of USA
    zoom: 4, // starting zoom
    // minZoom: 11,
});

map.on('load', function() {
    // Disable scroll in posts
    if (window.location.search.indexOf('embed') !== -1) map.scrollZoom.disable();

    //Add controls for navigation, geocoding and geolocation
    var geocoder = new mapboxgl.Geocoder({
		placeholder: 'Cari lokasi', // Placeholder text for the search bar
        bbox: [105.00030, -9.04624, 114.76204, -5.47445], // Boundary for Java
	});
    map.addControl(geocoder);
    map.addControl ( new mapboxgl.Navigation({ position: 'top-left' }) );
    var geolocator = new mapboxgl.Geolocate({ position: 'top-left' });
    map.addControl(geolocator);

    //go to SF and retrieve data
    //mapMe(mylocation);
	map.flyTo({ 'center': mylocation, 'zoom': 6.5 });
    getObservation(mylocation, taxon_active);

    //Toggle icons in the event of zoom change
    map.on('zoom', function() {
        var zoom = map.getZoom();
        $('.marker').each(function() {
            checkZoom(this, zoom);
        });
    });

    //Interact with taxas buttons
    $('.button').on('click', function() {
        $('.button').removeClass('active');
        $(this).addClass('active');
        taxon_active = $(this).attr('id');
        getObservation(mylocation, taxon_active);
        $('.mapboxgl-popup') ? $('.mapboxgl-popup').remove() : null;
    });

    //Redo quest on location change
    geocoder.on('result', function(e) {
        // window.alert('new location: ' + e.result.center);
        mylocation = e.result.center;
        getObservation(mylocation, taxon_active);
        mapMe(mylocation);
        $('.mapboxgl-popup') ? $('.mapboxgl-popup').remove() : null;
    });

    //Redo quest on geolocation
    geolocator.on('geolocate', function(position) {
        mylocation = [position.coords.longitude, position.coords.latitude];
        map.zoomTo(12);
        mapMe(mylocation);
        getObservation(mylocation, taxon_active);
    });

    //Mobile friendly
    $('#info').on('click', function() {
        if ( $('#introduction').is(':visible') ) {
            $('#introduction').hide();
            $('#info').css('background-image', 'url(assets/img/arrow_down.svg)');
            $('#sidebar').css('height', '150px');
        } else {
            $('#introduction').show();
            $('#info').css("background-image", 'url(assets/img/arrow_up.svg)');
            $('#sidebar').css('height', '240px');
        }
    })
});

// Map the user location using a marker called me
function mapMe(location) {
    if (!document.getElementById('me')) {
        var me = document.createElement('div');
        me.id = "me";
        me.style.backgroundImage = 'url(assets/img/icon_me.png)';
        marker_me = new mapboxgl.Marker(me).setLngLat(location).addTo(map);
		map.flyTo({ 'center': location, 'zoom': 6.5 });
    } else {
        marker_me.setLngLat(location);
		map.flyTo({ 'center': location, 'zoom': 11 });
    }
}

// Retrieve from API, map the markers to the map, and save relevant data in html. Pop-ups for marker on click.
function getObservation(location, taxon) {

	//alert(taxon);

    $('.loading').show();

    // clean up previous markers
    for (marker in markers) {
        markers[marker].remove();
    }
    markers = {};

    //call the variable based on selected category
    var data = window[taxon];

	// Used for marker change on zoom level
	var zoom = map.getZoom();

	var counter = 0;
	
	// Iterate through all data
	data.forEach(function(marker) {
		// create an img element for the marker
		var el = document.createElement('div');
		el.className = 'marker';
		img_url = marker.image;

		// marker title
		text = marker.title + ' - ';

		// img_url = img_url.replace("http", "https");
		$(el).attr('data-img', img_url);
		$(el).attr('data-taxon', taxon);
		$(el).attr('data-text', text);
		$(el).attr('data-link', marker.url);
		$(el).attr('data-latlon', marker.coordinate);

		// Map to the map with markers for the current zoomlevel
		checkZoom(el, zoom);

		// add marker to map
		markers[counter] = new mapboxgl.Marker(el)
			.setLngLat(marker.coordinate)
			.addTo(map);
			
		counter++;
	});

	$('.loading').hide();

	// markers on click
	$('.marker').click(function(e) {

		e.stopPropagation();

		var latlon = $(this).attr('data-latlon').split(",");
		latlon = [Number(latlon[0]), Number(latlon[1])];

		var img_med = $(this).attr('data-img').replace('/icon/', '/main/');

		var html = document.createElement('div');
		var dataImg = document.createElement('div')
		dataImg.setAttribute('class', 'img-md')
		dataImg.setAttribute('style', 'background-image:url(' + img_med + ')');

		var mapData = document.createElement('p');
		var mapText = document.createTextNode($(this).attr('data-text'));
		var mapLink = document.createElement('a');
		mapLink.setAttribute('target', 'culrural_map')
		mapLink.setAttribute('href', 'article/'+$(this).attr('data-link'))
		var link = document.createTextNode('link');
		mapLink.appendChild(link);

		html.appendChild(dataImg);
		html.appendChild(mapData);
		mapData.appendChild(mapText);
		mapData.appendChild(mapLink);

		$('.mapboxgl-popup') ? $('.mapboxgl-popup').remove() : null;

		var popup = new mapboxgl.Popup()
			.setLngLat(latlon)
			.setHTML(html.outerHTML)
			.addTo(map);
	});
}

// Check what zoom level for what markers, then map to map
function checkZoom(marker, zoom) {
    var img;
    //if (zoom < 12) {
    //    $(marker).addClass('sm');
    //    img = 'url(img/marker_' + $(marker).attr('data-taxon').toLowerCase() + '.png)';
    //    $(marker).css("background-image", img);
    //} else {
        $(marker).removeClass('sm');
        img = 'url(' + $(marker).attr('data-img') + ')';
        $(marker).css("background-image", img);
    //};
}
