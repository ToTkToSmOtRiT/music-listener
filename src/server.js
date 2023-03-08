const express = require('express')
const app = express()
const port = process.env.PORT || 4000
const cors = require('cors')
const bodyParser = require("body-parser");

app.use(cors())
app.use(express.json())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/get', (req, res) => {
    res.json({
        message: 'Get'
    });
})

app.delete('/auth/logout', (req, res) =>{
    console.log('User logout')
    res.status(200).json({message: 'User logout'})
})

app.post('/auth/sign_in', (req, res) => {
    console.log(req.body)
    res.status(201).json(req.body)
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})