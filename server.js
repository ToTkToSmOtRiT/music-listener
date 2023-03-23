const express = require('express')
const app = express()
const port = process.env.PORT || 4000
const cors = require('cors')
const bodyParser = require("body-parser");
const loader = require('./src/api/songs')

app.use(cors())
app.use(express.json())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.get('/load', (req, res) => {
    loader.loadAll().then((songs)=>{
      res.status(200).json(songs)
    })
})

app.delete('/auth/logout', (req, res) =>{
    console.log('User logout')
    res.status(200)
})

app.post('/auth/sign_in', (req, res) => {
    console.log(req.body)
    res.status(201).json(req.body)
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})