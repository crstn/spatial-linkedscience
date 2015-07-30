// Custom module for making SPARQL queries
var Sparql = (function(){

  var prefixes = 'prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> prefix geo: <http://www.w3.org/2003/01/geo/wgs84_pos#> prefix dc: <http://purl.org/dc/terms/> prefix bibo: <http://purl.org/ontology/bibo/> prefix foaf: <http://xmlns.com/foaf/0.1/> prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> prefix spatial: <http://spatial.linkedscience.org/context/> prefix key: <http://spatial.linkedscience.org/context/keyword/> prefix ADR: <http://www.w3.org/2001/vcard-rdf/3.0#> ';

  // search for authors & papers & affiliations
  function search(input, conference){

  	window.location.hash = lastHash = '';

  	var conference_seg = conference != 'null' ? 'spatial:' + conference :'?g';

    // this.prefixes?
  	var query = prefixes +
  	'SELECT DISTINCT ?type ?link ?name ?year ?latlong ' +
  	'{ ' +
  		'GRAPH ' + conference_seg +
  		'{ ' +
  			'{ ' +
  				'?link foaf:name ?name . ' +
  				'FILTER regex(?name, "' + input + '", "i") ' +
  				'?link foaf:familyName ?lastName . ' +
  				'?link rdf:type foaf:Person . ' +
  				'?link rdf:type ?type . ' +
  			'}' +
  			'UNION ' +
  			'{ ' +
  				'?link dc:title ?name . ' +
  				'FILTER regex(?name, "' + input + '", "i") ' +
  				'?link dc:date ?year . ' +
  				'?link rdf:type bibo:Chapter . ' +
  				'?link rdf:type ?type . ' +
  			'} ' +
  			'UNION ' +
  			'{ ' +
  				'?link dc:subject key:' + input.split(' ').join('_') + ' . ' +
  				// try to use regex for keywords
  				//'FILTER regex(?subject, "key:' + input + '", "i") ' +
  				'?link dc:title ?title . ' +
  				'?link dc:date ?year . ' +
  				'?link rdf:type bibo:Chapter . ' +
  				'?link rdf:type ?type . ' +
  			'} ' +
  			'UNION ' +
  			'{ ' +
  				'?link foaf:name ?name ; ' +
  				'FILTER regex(?name, "' + input + '", "i") ' +
  				'?link geo:lat_long ?latlong . ' +
  				'?link rdf:type foaf:Organization . ' +
  				'?link rdf:type ?type . ' +
  			'} ' +
  		'}' +
  	'}' +
  	'ORDER BY DESC(?year) ?title ?lastName';


  	$.getJSON('/sparql', {query: query, format: 'json'},
  		function(json){
  			// prepare page for data
        var results = json.results.bindings;
  			var conference_part = '';
  			if(conference != 'null'){
  				conference_part = ' >> ' + conference;
  			}

  			if(results.length === 0){
  				$('.title').html('There are no results for <b>' + input + conference_part + '</b>, try searching again.');
  			} else {
  				$('.title').html('Showing results for: <b>' + input + conference_part + '</b>');
  			}

  			$('.people-header').html('<span class="icon-user">Authors</span>');
  			$('.paper-header').html('Papers');

  			// fill page with data
  			$.each(results, function(i){
  				if( results[i].type.value == 'http://xmlns.com/foaf/0.1/Person' )
  				{
  			  		$(".people-list").append('<li class="author"><a href="javascript:setHash(\'<' + results[i].link.value + '>\')">' + results[i].name.value + '</a>&nbsp;<a class="rawdata" target="_blank" title="Raw data for this author" href="' + results[i].link.value + '">&rarr;</a></li>');
  			  	}
  			  	else if( results[i].type.value == 'http://purl.org/ontology/bibo/Chapter' )
  			  	{
  			  		$('.paper-list').append('<li class="paper">(' + results[i].year.value + ') <a href="javascript:setHash(\'<' + results[i].link.value + '>\')">' + results[i].name.value + '</a>&nbsp;<a class="rawdata" target="_blank" title="Raw data for this paper" href="' + results[i].link.value + '">&rarr;</a></li>');
  			  	}
  			  	else if( results[i].type.value == 'http://xmlns.com/foaf/0.1/Organization' )
  			  	{
  			  		setPin(results[i]);
  			  	}
  			});
  		}
  	);
  }

  // shows everything linked to author
  function selectAuthor(author){
  	$('.belt').css('left', '-100%');
  	var query = prefixes +
  	'SELECT DISTINCT ?name ?paper ?title ?year ?knows ?coname ?type ?affiliation ?latlong ' +
  	'{ ' +
  		'GRAPH ' + '?g ' +
  		'{ ' +
  			'{ ' +
  				author +
  					'foaf:name ?name ; ' +
  					'foaf:publications ?paper . ' +
  				'?paper dc:title ?title . ' +
  				'?paper dc:date ?year . ' +
  				'?paper rdf:type ?type . ' +
  			'} ' +
  			'UNION ' +
  			'{ ' +
  				author + 'foaf:knows ?knows . ' +
  				'?knows foaf:name ?coname . ' +
  				'?knows foaf:familyName ?lastName . ' +
  				'?knows rdf:type ?type . ' +
  			'} ' +
  			'UNION ' +
  			'{ ' +
  				'?affiliation foaf:member ' + author + ' ; ' +
  					'foaf:name ?name ; ' +
  					'geo:lat_long ?latlong ; ' +
  					'rdf:type ?type . ' +
  			'} ' +

  		'} ' +
  	'}' +
  	'ORDER BY DESC(?year) ?title ?lastName';

  	$.getJSON('/sparql', {query: query, format: 'json'},
  		function(json){
        var results = json.results.bindings;
  			console.log(results);
  			clear();
  			$('.title').html('<b>' + results[0].name.value + '</b>');
  			$('.paper-header').html('Papers');
  			$('.people-header').html('Co-authors/-editors');

  			$.each(results, function(i){
  				if( results[i].type.value == 'http://purl.org/ontology/bibo/Chapter')
  				{
  					$('.paper-list').append('<li class="paper">(' + results[i].year.value + ') <a href="javascript:setHash(\'<' + results[i].paper.value + '>\')">' + results[i].title.value + '</a>&nbsp;<a class="rawdata" target="_blank" title="Raw data for this paper" href="' + results[i].paper.value + '">&rarr;</a></li>');
  				}
  				else if ( results[i].type.value == 'http://xmlns.com/foaf/0.1/Person')
  				{
  					$('.people-list').append("<li class='author'><a href='javascript:setHash(\"<" + results[i].knows.value + ">\")'>" + results[i].coname.value + "</a>&nbsp;<a class='rawdata' target='_blank' title='Raw data for this author' href='" + results[i].knows.value + "'>&rarr;</a></li>");
  				}
  				else if ( results[i].type.value == 'http://xmlns.com/foaf/0.1/Organization')
  				{
  					setPin(results[i]);
  				}
  			});
  		}
  	);
  }

  // shows everything linked to paper
  function selectPaper(paper){
  	$('.belt').css('left', '-100%');
  	var query = prefixes +
  	'SELECT DISTINCT ?title ?authors ?name ?coauthor ?year ?homepage ?partOf ?subject ?g ' +
  	'{ ' +
  		'GRAPH ' + '?g ' +
  		'{ ' +
  			'{ ' +
  				paper +
  					'dc:title ?title ; ' +
  					'dc:date ?year ; ' +
  					'foaf:homepage ?homepage ; ' +
  					'dc:partOf ?partOf . ' +
  					// need to get list of subjects without returning the same paper n times for each subject
  					//'dc:subject ?subject ; ' +
  			'} ' +
  			'UNION ' +
  			'{ ' +
  				paper + 'bibo:authorList ?list . ' +
  				'?list rdf:rest*/rdf:first ?coauthor . ' +
  				'?coauthor foaf:name ?name . ' +
  			'} ' +
  		'} ' +
  	'}';

  	$.getJSON('/sparql', {query: query, format: 'json'},
  		function(json){
        var results = json.results.bindings;
  			clear();

  			$('.title').html('<b>' + results[0].title.value + '</b>');
  			$('.people-header').html('Authors/Co-authors');
  			$('.paper-header').html('Paper Info');


  			$('.paper-list').append('<li><b>Year</b>: ' + results[0].year.value + '</li>');
  			$('.paper-list').append('<li><b>Homepage</b>: <a href="' + results[0].homepage.value + '">here</a></li>');
  			$('.paper-list').append('<li><b>Part Of</b>: ' + results[0].partOf.value + '</li>');


  			$.each(results, function(i){
  				if(i !== 0){
  					$('.people-list').append("<li class='author'><a href='javascript:setHash(\"<" + results[i].coauthor.value + ">\")'>" + results[i].name.value + "</a>&nbsp;<a class='rawdata' target='_blank' title='Raw data for this author' href='" + results[i].coauthor.value + "'>&rarr;</a></li>");
  				}
  			});
  		}
  	);
  }

  function selectAffiliation(affiliation){
  	$('.belt').css('left', '-100%');
  	var query = prefixes +
  	'SELECT DISTINCT ?link ?name ?latlong ?location ' +
  	'{ ' +
  		'{ ' +
  			affiliation +
  				'foaf:name ?name ; ' +
  				'geo:lat_long ?latlong ; ' +
  				'ADR:ADR ?location . ' +
  		'} ' +
  		'UNION ' +
  		'{ ' +
  			affiliation + 'foaf:member ?members . ' +
  			'?members foaf:name ?name . ' +
  		'} ' +
  	'} ';

  	$.getJSON('/sparql', {query: query, format: 'json'},
  		function(json){
        var results = json.results.bindings;
  			clear();

  			var data = results;
  			console.log(data);
  			$('.title').html('<strong>' + data[0].name.value + '</strong>');
  			$('.people-header').html('Members');
  			$('.paper-header').html('Affiliation Info');

  			$('.paper-list').append();
  			$('.paper-list').append();
  			$('.paper-list').append();
  			$('.paper-list').append();
  		}
  	);
  }

  // API
  return {
    search: search,
    selectAuthor: selectAuthor,
    selectPaper: selectPaper,
    selectAffiliation: selectAffiliation
  };
})();
// end
