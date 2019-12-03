const express = require("express");
const mysql   = require("mysql");
const app = express();
app.set("view engine", "ejs");
app.use(express.static("public")); //folder for images, css, js
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
var session = require('express-session');
app.use(session({
  secret: 'keyboard cat'
}));

//routes
app.get("/", async function(req, res){

  let categories = await getCategories();
  //console.log(categories);
  res.render("index", {"categories":categories});

});//root

app.get("/quotes", async function(req, res){

  let rows = await getQuotes(req.query);
  res.render("quotes", {"records":rows});

});//quotes


app.get("/add", async function(req, res){

  res.render("add");

});//adding

app.post("/add", async function(req,res){
   let rows = await insertAuthor(req.body);
  console.log(rows);
  //res.send("First name: " + req.body.firstName); //When using the POST method, the form info is stored in req.body
  let message = "Author WAS NOT added to the database!";
  if (rows.affectedRows > 0) {
      message= "Author successfully added!";
  }
  res.render("add", {"message":message}); 
});

app.get("/edit", async function(req, res){
  console.log(req.query.authorId);
  let authorInfo = await getSAuthorInfo(req.query.authorId);    
  console.log(authorInfo);
  res.render("edit", {"authorInfo":authorInfo});
});


app.get("/logout", async function(req,res){
   let categories = await getCategories();
   if(req.session && req.session.username && req.session.username.length) {
                delete req.session.username;
                res.render("index", {"categories":categories});
    }
});


app.get("/deleteAuthor", async function(req, res){
 let arows = await deleteAuthor(req.query.authorId);
 console.log(arows);
  //res.send("First name: " + req.body.firstName); //When using the POST method, the form info is stored in req.body
  let message = "Author WAS NOT deleted!";
  if (arows.affectedRows > 0) {
      message= "Author successfully deleted!";
  }    
    
   let rows = await getAuthorInfo(req.query.authorId);
   res.render("admin", {"records":rows});
});


app.post("/edit", async function(req, res){
  let rows = await updateAuthor(req.body);
  
  let authorInfo = req.body;
  console.log(rows);
  //res.send("First name: " + req.body.firstName); //When using the POST method, the form info is stored in req.body
  let message = "Author WAS NOT updated!";
  if (rows.affectedRows > 0) {
      message= "Author successfully updated!";
  }
  res.render("edit", {"message":message, "authorInfo":authorInfo});
    
});

app.get("/admin", async function(req,res) {
   if(req.session && req.session.username && req.session.username.length) {
                let rows = await getAuthorInfo(req.query.authorId);
                res.render("admin", {"records":rows});
        } else {
            delete req.session.username;
            res.redirect('/login');
        }
        
});

app.get("/login", async function(req,res){
   res.render("login"); 
});

app.get("/authorInfo", async function(req, res){
    
   let rows = await getAuthorInfo(req.query.authorId);
  //res.render("quotes", {"records":rows});
    res.send(rows);
});//quotes


app.post('/login', function(req, res, next) {
        
        console.log("inside login post");
        //do something to login...
        let successful = false;
        let message = '';
        console.log(req.body);
        if(req.body.username === "hello" && req.body.password === "world") {
            successful = true;
            req.session.username = req.body.username;
        } else {
            // deleting user 
            delete req.session.username;
            message = "Incorrect Username or Password";
        }
        
        //Return success or failure
        res.json({
            successful : successful,
            original : req.body,
            error: message
        });
    
});

function getAuthorInfo(authorId){
    let conn = dbConnection();
    
    
    return new Promise(function(resolve, reject){
        conn.connect(function(err) {
           if (err) throw err;
           console.log("Connected!");
        
           let sql = `SELECT * 
                      FROM l9_author
                      `;
            console.log(sql);        
           conn.query(sql, function (err, rows, fields) {
              if (err) throw err;
              //res.send(rows);
              conn.end();
              resolve(rows);
           });
        
        });//connect
    });//promise
}

function getSAuthorInfo(authorId){
   
   let conn = dbConnection();
    
    return new Promise(function(resolve, reject){
        conn.connect(function(err) {
           if (err) throw err;
           console.log("Connected!");
        
           let sql = `SELECT *
                      FROM l9_author
                      WHERE authorId = ?`;
        
           conn.query(sql, [authorId], function (err, rows, fields) {
              if (err) throw err;
              //res.send(rows);
              conn.end();
              resolve(rows[0]); //Query returns only ONE record
           });
        
        });//connect
    });//promise 
}

function getQuotes(query){
    
    let keyword = query.keyword;
    
    let conn = dbConnection();
    
    return new Promise(function(resolve, reject){
        conn.connect(function(err) {
           if (err) throw err;
           console.log("Connected!");
        
           let params = [];
        
           let sql = `SELECT quote, firstName, lastName, category, authorId FROM l9_quotes
                      NATURAL JOIN l9_author
                      WHERE 
                      quote LIKE '%${keyword}%' OR firstName LIKE '%${keyword}%' OR lastName LIKE '%${keyword}%' OR CONCAT(firstName, ' ', lastName) LIKE '%${keyword}%' `;
        
           if (query.category) { //user selected a category
              sql += " AND category = ?"; //To prevent SQL injection, SQL statement shouldn't have any quotes.
           }
           
           params.push(query.category);    
        
           console.log("SQL:", sql);
           conn.query(sql, params, function (err, rows, fields) {
              if (err) throw err;
              //res.send(rows);
              conn.end();
              resolve(rows);
           });
        
        });//connect
    });//promise
    
}//getQuotes

function deleteAuthor(authorId){
   
   let conn = dbConnection();
    
    return new Promise(function(resolve, reject){
        conn.connect(function(err) {
           if (err) throw err;
           console.log("Connected!");
        
           let sql = `DELETE FROM l9_author
                      WHERE authorId = ?`;
        
           conn.query(sql, [authorId], function (err, rows, fields) {
              if (err) throw err;
              //res.send(rows);
              conn.end();
              resolve(rows);
           });
        
        });//connect
    });//promise 
}


function insertAuthor(body){
   
   let conn = dbConnection();
    
    return new Promise(function(resolve, reject){
        conn.connect(function(err) {
           if (err) throw err;
           console.log("Connected!");
        
           let sql = `INSERT INTO l9_author
                        (firstName, lastName, sex)
                         VALUES (?,?,?)`;
        
           let params = [body.firstName, body.lastName, body.gender];
        
           conn.query(sql, params, function (err, rows, fields) {
              if (err) throw err;
              //res.send(rows);
              conn.end();
              resolve(rows);
           });
        
        });//connect
    });//promise 
}


function updateAuthor(body){
   
   let conn = dbConnection();
    
    return new Promise(function(resolve, reject){
        conn.connect(function(err) {
           if (err) throw err;
           console.log("Connected!");
        
           let sql = `UPDATE l9_author
                      SET firstName = ?, 
                          lastName  = ?, 
                                sex = ?
                     WHERE authorId = ?`;
        
           let params = [body.firstName, body.lastName, body.gender, body.authorId];
        
           console.log(sql);
           
           conn.query(sql, params, function (err, rows, fields) {
              if (err) throw err;
              //res.send(rows);
              conn.end();
              resolve(rows);
           });
        
        });//connect
    });//promise 
}

function getCategories(){
    
    let conn = dbConnection();
    
    return new Promise(function(resolve, reject){
        conn.connect(function(err) {
           if (err) throw err;
           console.log("Connected!");
        
           let sql = `SELECT DISTINCT category 
                      FROM l9_quotes
                      ORDER BY category`;
        
           conn.query(sql, function (err, rows, fields) {
              if (err) throw err;
              //res.send(rows);
              conn.end();
              resolve(rows);
           });
        
        });//connect
    });//promise
    
}//getCategories

// app.get("/dbTest", function(req, res){

//     let conn = dbConnection();
    
//     conn.connect(function(err) {
//       if (err) throw err;
//       console.log("Connected!");
    
//       let sql = "SELECT * FROM l9_author WHERE sex = 'F'";
    
//       conn.query(sql, function (err, rows, fields) {
//           if (err) throw err;
//           conn.end();
//           res.send(rows);
//       });
    
//     });

// });//dbTest

//values in red must be updated
function dbConnection(){

   let conn = mysql.createConnection({
                 host: "thzz882efnak0xod.cbetxkdyhwsb.us-east-1.rds.amazonaws.com",
                 user: "afpyfp5fd1jlmcej",
             password: "knlashfisxz2s5sr",
             database: "e5pm882qlvrya6un"
       }); //createConnection

return conn;

}




//starting server
app.listen(process.env.PORT, process.env.IP, function(){
console.log("Express server is running...");
});