// This is only the matching and database connection part of the dating app

var http = require("http");
var qString = require("querystring");
//this calls the let db={}; and instantiates the db for us
let dbManager = require('./dbManager');
let express = require("express");
let app = express();

// Search page
async function searchResp(result, response){
    let page = '<html><head><title>Dating App</title></head>'+
    '<body> <form method="post">'+
    '<h1>What are you looking for in a match?</h1>'+
    'Property <select name="prop">'+
    '<option>gender</option>' +
    '<option>race</option>' +
    '<option>age</option>' +
    '<option>height</option>' +
    '<option>religion</option>' +
    '<option>income</option>' +
    '<option>hobbies</option>' +
    '<option>job</option>' +
    '</select>'+
    '<input name="value">'+
    '<input type="submit" value="Match!">' +
    '<input type="reset" value="Clear">'+
    '</form>';

    
    if (result){

        page+=`<h2>Matches for ${result.prop}: ${result[result.prop]}</h2>`
        let count = 0;
        //the await must be wrapped in a try/catch in case the promise rejects
        try{
        await result.data.forEach((item) =>{
            page+=`Match ${++count} ${item.name} <br>`;
            });
        } catch (e){
            page+=e.message;
            throw e;
        }
    }
      
    return page;
}

var postParams;
function moveOn(postData){
    let proceed = true;
    postParams = qString.parse(postData);
    //handle empty data
    for (property in postParams){
	if (postParams[property].toString().trim() == ''){
	    proceed = false;
	}
    }

    return proceed;
}

// landing page for the website
app.get('/', function (req, res){
    res.end('<a href="/search">Search Page</a></body></html>');
});

// calls searchResp which displays the search page
app.get('/search', function(req, res, next){
    searchResp(null, res).then(
	page=> {    res.send(page); }
    ).catch(next);
});

var postData;
app.post('/search', function(req, res){
    postData = '';
    req.on('data', (data) =>{
	postData+=data;
    });
    req.on('end', async ()=>{
        //Break into functions
        console.log(postData);
        if (moveOn(postData)){
            let col = dbManager.get().collection("profiles");
            var prop= postParams.prop;
            var val = postParams.value;
            if (prop == "age" || prop == "height"){
                val = Number(postParams.value);
            }
            //simple equality search. using [] allows a variable
            //in the property name
            let searchDoc = { [prop] : val };
            try{
            let cursor = col.find(searchDoc);
            let resultOBJ={data: cursor, [prop]  : val, prop: prop};
    
            searchResp(resultOBJ, res).then( page =>
                              {res.send(page)
                              });//call the searchPage
            } catch (e){
            console.log(e.message);
            res.writeHead(404);
            res.write("<html><body><h1> ERROR 404. Page NOT FOUND</h1>");
            res.end("<br>" + e.message + "<br></body></html>");
            }
        } else{ // can't move on
            searchResp(null, res).then(
            page => {res.send(page)}
        );
        }
        });
});

// catch for bad routes
app.use('*', function(req, res){
    res.writeHead(404);
    res.end(`ERROR 404. ${req.url} NOT FOUND`);
});

// http server and open database connection
app.listen(6900, async ()=> {
    //start and wait for the DB connection
    try{
        await dbManager.get("datingApp");
    } catch (e){
        console.log(e.message);
    }

    console.log("Server is running...");
});