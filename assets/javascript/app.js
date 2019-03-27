const API_KEY = 'zB9GX67A68UUQCv1NBX8Rj5XOzCKOTQP';

var queryURL = `https://api.giphy.com/v1/gifs/trending?api_key=${API_KEY}&limit=5`;

$.ajax({
  url: queryURL,
  method: "GET"
}).then(function(response) {
  console.log(response);
});