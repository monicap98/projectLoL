// Code by Leviner222

var firebaseConfig = {
    apiKey: "AIzaSyDkXkwWi5i7er839MKPwo-3PjsF2CgJBuw",
    authDomain: "lolprojectdef.firebaseapp.com",
    databaseURL: "https://lolprojectdef.firebaseio.com",
    projectId: "lolprojectdef",
    storageBucket: "lolprojectdef.appspot.com",
    messagingSenderId: "891739885124",
    appId: "1:891739885124:web:6c419821637114f5c97611",
    measurementId: "G-WV4ZNG37E5"
  };

var championImageUrl = 'https://ddragon.leagueoflegends.com/cdn/10.16.1/img/champion/';

var user;

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
var db = firebase.firestore();

// Cookie functions
function setCookie(cname, cvalue, exdays) {
  var d = new Date();
  d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
  var expires = "expires=" + d.toGMTString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
  var name = cname + "=";
  var decodedCookie = decodeURIComponent(document.cookie);
  var ca = decodedCookie.split(";");
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == " ") {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

function checkCookie() {
  user = getCookie("username");
  if(user) {
	alert('Bentornato ' + user)
  } else {
	while (user == "") {
		user = prompt("Inserire nome utente:", "");
		if (user != "" && user != null) {
		  setCookie("username", user, 30);
		}
	}
  }
}

//pagine campioni
function openChampionPage(champName) {
	var urlChampion = 'https://ddragon.leagueoflegends.com/cdn/10.16.1/data/it_IT/champion/' + champName + '.json';
	var router = this.$router;
	$.get(urlChampion, function(data) {
  		var champData = data.data[champName];
		champData['imageFullPath'] = championImageUrl + champData.image.full;
		var rating = 0;
		var votiCollection = db.collection("voti");
		var query = votiCollection
			.where("user", "==", user)
			.where("champion", "==", champName);
		  query
			.get()
			.then(function(result) {
			  if (result.size >= 1) {
				result.forEach(function(documento) {
				  rating = documento.data().voto;
				});
			  }
			  router.push({ name: 'champion', params: { champData: champData, champName: champName, rating: rating} })
			})
			.catch(function(error) {
			  console.log("Errore: ", error);
			});
	});
}

//filtro pagine
function filterChampionsList(tag, originalList) {
	if(tag) {
		var tagLookup = {
			'tiratore': 'Marksman',
			'mago': 'Mage',
			'assassino': 'Assassin',
			'tank': 'Tank',
			'combattente': 'Fighter',
			'supporto' : 'Support'
		}
		var tmpList = [];
		for (index in originalList) {
			if(originalList[index].tags.includes(tagLookup[tag])) {
				tmpList.push(originalList[index]);
			}
		}
		return tmpList;
	} else {
		return originalList;
	}
}

function getChampionsNameList(list) {
	var nameList = [];
	for (i in list) {
		nameList.push(list[i].name);
	}
	return nameList;
}

//cerca
function searchChampion(champName) {
	if(champName) {
		this.$data.championsList = new Array(this.$data.championsList.find((element) => element.name == champName));
	}
}

function resetSearchChampion(champName) {
	if(!champName) {
		this.$data.championsList = filterChampionsList(this.$data.tag, this.$data.allChampionsList);
	}
}

//salvataggio voto
function saveVoto(voto) {
	$("#champion-voto-text").text("Acquisizione voto...");
	
	var champName = this.$data.champName;
	var votiCollection = db.collection("voti");
	var query = votiCollection
		.where("user", "==", user)
		.where("champion", "==", champName);
	query.get()
		.then(function(result) {
		  if (result.size > 0) {
			result.forEach(function(documento) {
				documento.ref.set({
					voto: voto
				}, { merge: true })
				.then(function() {
				  $("#champion-voto-text").text("Voto aggiornato correttamente");
				  $("#champion-voto-text").addClass("text-success");
				})
				.catch(function(error) {
				  $("#champion-voto-text").text("Errore nell'aggiornamento del voto");
				  $("#champion-voto-text").addClass("text-danger");
				});
			});
		  } else {
			votiCollection.doc()
				.set({
				  champion: champName,
				  voto: voto,
				  user: user
				})
				.then(function() {
				  $("#champion-voto-text").text("Voto inserito correttamente");
				  $("#champion-voto-text").addClass("text-success");
				})
				.catch(function(error) {
				  $("#champion-voto-text").text("Errore nell'inserimento del voto");
				  $("#champion-voto-text").addClass("text-danger");
				});
		  }
		})
		.catch(function(error) {
		  console.log("Errore: ", error);
		});
}

//più votati
function getMaxRatedChampions() {
	var championsStatList = [];
	var championsStatMap = new Map();
	var votiCollection = db.collection("voti").get()
		.then(function(result) {
			if (result.size > 0) {
				result.forEach(function(documento) {
					if(championsStatMap.has(documento.data().champion)) {
						actualChamp = championsStatMap.get(documento.data().champion);
						actualChamp['numVoti'] =  actualChamp['numVoti']+1;
						actualChamp['media'] =  actualChamp['media'] + documento.data().voto;
						actualChamp['minVoto'] =  documento.data().voto < actualChamp['minVoto'] ? documento.data().voto : actualChamp['minVoto'];
						actualChamp['maxVoto'] =  documento.data().voto > actualChamp['maxVoto'] ? documento.data().voto : actualChamp['maxVoto'];
					} else {
						var actualChamp = {};
						actualChamp['name'] =  documento.data().champion;
						actualChamp['numVoti'] =  1;
						actualChamp['media'] =  documento.data().voto;
						actualChamp['minVoto'] =  documento.data().voto;
						actualChamp['maxVoto'] =  documento.data().voto;
						
						championsStatMap.set(documento.data().champion, actualChamp);
					}
				});
				var mapKey = championsStatMap.keys();
				for(key of mapKey) {
					var actualValue = championsStatMap.get(key);
					actualValue['media'] = actualValue['media'] / actualValue['numVoti'];
					championsStatList.push(actualValue);
				}
				championsStatList.sort((a, b) => (a.media > b.media) ? -1 : 1);
			}
		});
		  
	return championsStatList;

}