const express= require('express');
const bodyParser = require('body-parser');
const {Pool} = require('pg');
const path = require('path');
const apiRoutes = require('./routes/api');

const app= express();
const port= process.env.PORT || 3000;

const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database:"ecommerce",
    password:"sql123",
    port:"5432",
});

app.use(bodyParser.json());
app.use('/api', apiRoutes(pool));
app.use(express.static(path.join(__dirname,'public')));

app.listen(port,()=>{
    console.log(`Server running at http://localhost:${port}`);
});
