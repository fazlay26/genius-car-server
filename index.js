const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
var jwt = require('jsonwebtoken');//jwt  github theke
const app = express();
const port = process.env.PORT || 5000;
const cors = require('cors');
require('dotenv').config() //eta dotenv theke ante hobe

//for middleware
app.use(cors());
app.use(express.json())

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization
    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' })
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'forbidden' })
        }
        console.log('decoded', decoded);
        req.decoded = decoded;
        next();
    })


}

//server er sathe mongodb er connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.u02nz.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run() {
    try {
        await client.connect();
        const serviceCollection = client.db("geniusCar").collection("service")
        const orderCollection = client.db("geniusCar").collection("order")

        //auth
        app.post('/login', async (req, res) => {
            const user = req.body
            const accesToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1d' //token tar koidin expiry date thakbe
            })
            res.send({ accesToken })

        })


        app.get('/service', async (req, res) => {
            const query = {}
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services)
        })

        //single id user
        app.get('/service/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) };
            const service = await serviceCollection.findOne(query)
            res.send(service)
        })
        //post
        app.post('/service', async (req, res) => {
            const newService = req.body
            const result = await serviceCollection.insertOne(newService)
            res.send(result)
        })
        //delete
        app.delete('/service/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) };
            const result = await serviceCollection.deleteOne(query)
            res.send(result)
        })
        //order collection api
        app.get('/order', verifyJWT, async (req, res) => {
            const authHeader = req.headers.authorization
            console.log(authHeader);
            const decodedEmail = req.decoded.email
            const email = req.query.email //user je email diye login ase sheta
            if (email === decodedEmail) {
                const query = { email: email } //je user login kora ase tar order guli dekhabe
                const cursor = orderCollection.find(query)
                const orders = await cursor.toArray()
                res.send(orders)
            }
            else {
                res.status(403).send({ message: 'forbidden acces' })
            }

        })


        app.post('/order', async (req, res) => {
            const order = req.body
            const result = await orderCollection.insertOne(order)
            res.send(result)
        })


    }
    finally {

    }

}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('running genius server')
})

app.listen(port, () => {
    console.log("listening to port", port);
})

//user jodi login kora thake tahole taake ekta token dibo.ei token er ekta expiry time thake
//login korle 2ta token dey ekta acces token and arekta refresh token.acess token expiry hoye gele refresh token diye kaaj chalai