const API_KEY = 'zB9GX67A68UUQCv1NBX8Rj5XOzCKOTQP';

const baseQueryURL = `https://api.giphy.com/v1/gifs/search?api_key=${API_KEY}&rating=G`;
const baseSearchByIdQueryURL = `https://api.giphy.com/v1/gifs/`;

const initialGifTopics = ['Jedi', 'Darth vader', 'Star destroyer', 'Yoda'];

let noMoreImages = true;
let allowAdditionalImages = false;

// Shape of local storage data
const storage = {
	gifIds: []
};

// Creates AJAX call for the specific search term
function getGifBySearchTerm(searchTerm, limit, callback) {
	const queryURL = baseQueryURL + '&q=' + searchTerm + '&limit=' + limit;
	$.ajax({
		method: 'GET',
		url: queryURL
	}).then(callback);
}

// Creates AJAX call for the specific gif id
function getGifById(gifId, callback) {
	const queryURL = baseSearchByIdQueryURL + gifId + '?' + `api_key=${API_KEY}`;
	$.ajax({
		method: 'GET',
		url: queryURL
	}).then(callback);
}

// Toggles gif display between static image and animated gif on gif view click
function toggleGifDisplay(event) {
	const target = $(event.target);
	if (target.is("img")) { // Toggle still and animated gif
		const dataState = $(this).attr("data-state");
		let updatedSrc;
		if (dataState === 'still') {
			updatedSrc = $(this).attr('data-animate');
			$(this).attr("data-state", 'animated');
		} else {
			updatedSrc = $(this).attr('data-still');
			$(this).attr("data-state", 'still');
		}
		$(this).children('.gif-image').attr('src', updatedSrc);
	} else if (target.is('button')) { // Add gif or remove gif from favorites

		const favoritesObj = JSON.parse(localStorage.getItem('storage')) || storage;

		if (target.hasClass('remove-from-favorites')) { // Remove from favorites
			// Remove from favorites in DOM 
			const parent = target.parent()
			const gifId = parent.attr('image-id')
			parent.remove();

			// Remove gif id from localStorage
			const favoritesArray = favoritesObj['gifIds']
			const filteredArray = favoritesArray.filter(function (ele) {
				return ele !== gifId;
			});;
			favoritesObj['gifIds'] = filteredArray
		} else { // Add to favorites
			// Make deep copy of selected gif and add it to favorites
			const parent = target.parent();
			const parentClone = parent.clone()
			// Modify gif button for favorites section
			configureButtonForFavoritesView(parentClone.find('button'))
			parentClone.appendTo('#favorites-view');

			// Add gif id to favorites object
			favoritesObj['gifIds'].push(parent.attr('image-id'));
		}
		// Update local storage with gif id favorites
		localStorage.setItem('storage', JSON.stringify(favoritesObj));
	}
}

function CreateGifElements(response, gifDestination) {
	let data = response.data
	if (!data.length) {
		data = [data] // Add single object to array
	}
	data.forEach(gif => {
		const stillImageURL = gif.images['fixed_height_still'].url;
		const animatedGifURL = gif.images['fixed_height'].url;
		const gifDiv = $('<div class="gif-div text-center">')
			.attr('data-still', stillImageURL)
			.attr('data-animate', animatedGifURL)
			.attr('data-state', 'still')
			.attr('image-id', gif.id);

		const gifImage = $('<img>').addClass('col-md-auto gif-image').attr('src', stillImageURL);
		const gifTitle = $('<p>').text(gif.title).addClass('gif-info');
		const rating = $("<p>").text('Rated: ' + gif.rating).addClass('gif-info');
		const gifButton = $('<button type="button" class="btn btn-primary">');

		// Configure gif button depending on whether it is a favorite or not
		if (gifDestination === '#gifs-view') {
			gifButton.text('Add gif to favorites');
		} else {
			configureButtonForFavoritesView(gifButton);
		}

		gifDiv.append(gifImage, gifTitle, rating, gifButton);
		$(gifDestination).prepend(gifDiv);
	});
}

function configureButtonForFavoritesView(buttonElement) {
	// Configure class and text attributes for gif elements for favorites destination
	buttonElement.addClass('remove-from-favorites').text('Remove gif from favorites');
}

function displayGifInfo() {
	// Display a number of gifs determined by button name clicked
	if (noMoreImages || allowAdditionalImages) {
		const searchTerm = $(this).attr("data-name");
		getGifBySearchTerm(searchTerm, 10, response => { CreateGifElements(response, '#gifs-view') });
	}
	$('#data-toggle').attr('disabled', false);
	noMoreImages = false;
}

// Creates a gif button if gifTitle is valid and adds the button to buttons-view
function makeGifButton(gifTitle) {
	const queryURL = baseQueryURL + '&q=' + gifTitle;
	getGifBySearchTerm(gifTitle, 1, function (response) {

		if (response.data.length) { // Confirm gif search term exists in Giphy
			const gifButton = $('<button>')
				.text(gifTitle)
				.addClass('btn btn-info gif-button')
				.attr('data-name', gifTitle);
			$('#buttons-view').append(gifButton);
		} else { // Invalid gif search term
			alert("The gif term " + gifTitle + " does not exist")
		}
	});
}

// Render buttons for initial gif topics
function renderButtons() {
	initialGifTopics.forEach(gif => {
		makeGifButton(gif);
	});
}

function handleAddGifButton() {
	event.preventDefault();
	const gifName = $('#gif-input').val();
	makeGifButton(gifName);
	$('#gif-input').val('');
}

function handleAdditionalImagesButton() {
	// Allows user to request additional images
	if ($(this).attr('data-toggle') === 'on') {
		$(this).attr('data-toggle', 'off');
		$(this).text('Click to allow additional images');
		allowAdditionalImages = false;
	} else {
		$(this).attr('data-toggle', 'on')
		allowAdditionalImages = true;
		$(this).text(' Click to prevent additional images');
	}
}

function showFavoritesFromStorage() {
	// Retrieves favorited images from localStorage and displays them in favorites section
	let gifIds = JSON.parse(localStorage.getItem('storage'))
	if (gifIds) {
		gifIds = gifIds['gifIds'];
		gifIds.forEach(gifId => {
			getGifById(gifId, response => { CreateGifElements(response, '#favorites-view') })
		});
	}
}

// Adding click event listeners to all elements with a class of "gif"
$(document).on("click", ".gif-button", displayGifInfo);
$(document).on("click", ".gif-div", toggleGifDisplay);

$(document).ready(function () {

	// Handle clicking add gif button
	$("#add-gif").on("click", handleAddGifButton);

	// Allows user to request a dditional images
	$('#data-toggle').click(handleAdditionalImagesButton);

	// Displays favorited gifs on page reload
	showFavoritesFromStorage();

	// Calling the renderButtons function to display the initial list of gifs
	renderButtons();

	$('#clear-images').click(function () {
		$('#gifs-view').empty();
	});

	$('#clear-favorites').click(function () {
		$('#favorites-view').empty();
		localStorage.removeItem('storage');
	});
});