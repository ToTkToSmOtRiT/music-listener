import axios from "axios";

const options = {
  method: 'GET',
  url: 'https://spotify23.p.rapidapi.com/tracks/',
  params: {ids: '4WNcduiCmDNfmTEz7JvmLv'},
  headers: {
    'X-RapidAPI-Key': '90894375c6mshd8c4de8ac82ee4fp1ac5bdjsnb5e826acf7e2',
    'X-RapidAPI-Host': 'spotify23.p.rapidapi.com'
  }
};

axios.request(options).then(function (response) {
	console.log(response.data);
}).catch(function (error) {
	console.error(error);
});