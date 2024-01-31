const express = require('express');
const cors = require('cors');
require('dotenv').config()
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;


// middleware
app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4lef0mm.mongodb.net/?retryWrites=true&w=majority`;
// console.log(uri)
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

// verifying JWT 
const verifyJWT = (req, res, next) =>{
    // console.log('hitting verify JWT')
    // console.log(req.headers.authorization)
    const authorization = req.headers.authorization;

    if(!authorization){
        return res.status(401).send({error: true, message: 'unauthorized access'})
    }
    const token = authorization.split(' ')[1]
    // console.log('token inside of verify JWT', token)

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
        if(error){
            return res.status(403).send({error: true, message: 'unauthorized access'})
        }
        req.decoded = decoded; // custom property 
        next()
    })
}



async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const eventCollections = client.db("volunteerEvents").collection("event")
        const registerEventCollections = client.db("volunteerEvents").collection("registerEvent")



        // jwt
        app.post('/jwt', (req, res) => {
            const user = req.body;
            console.log(user)
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '5h'
            })
            res.send({token})
        })




        // Event Routes 
        app.get('/events', async (req, res) => {
            const result = await eventCollections.find().toArray();
            res.send(result)
        })

        app.get('/events/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await eventCollections.findOne(query)
            res.send(result)
        })

        app.post('/events', async (req, res) => {
            const event = req.body
            console.log(event)
            const result = await eventCollections.insertOne(event)
            res.send(result)
        })

        

        // Register Event Routes 

        /* 
        --------for all data load-----------
        app.get('/registerevets', async (req, res) => {
            const result = await registerEventCollections.find().toArray()
            res.send(result)
        })
        */

        // user specific and all data load
        app.get('/registerevets', verifyJWT, async (req, res) => {
            // console.log(req.query.email)
            // console.log(req.headers)
            const decoded = req.decoded;
            console.log('came back after verify', decoded)

            if(decoded.email !== req.query?.email){
                return res.status(403).send({error: 1, message: 'forbidden access'})
            }

            let query = {};
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            const result = await registerEventCollections.find(query).toArray()
            res.send(result)
        })

        app.get('/registerevets', async (req, res) => {
            const decoded = req.decoded;
            console.log(decoded)
        })

        app.post('/registerevets', async (req, res) => {
            const registerEvent = req.body;
            console.log(registerEvent);
            const result = await registerEventCollections.insertOne(registerEvent)
            res.send(result)
        })

        app.patch('/registerevets/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const updateRegister = req.body;
            const updated = {
                $set: {
                    status: updateRegister.status
                }
            }
            const result = await registerEventCollections.updateOne(filter, updated)
            res.send(result)
        })

        // Register Events User Specific Filter
        app.patch('/registerevets', async (req, res) => {
            const id = req.params.id;
        })


        app.delete('/registerevets/:id', async (req, res) => {
            const id = req.params;
            const query = { _id: new ObjectId(id) }
            const result = await registerEventCollections.deleteOne(query);
            res.send(result)
        })





        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('welcome to volunteer network server')
})



app.listen(port, () => {
    console.log(`volunteer network is running on port: ${port}`)
})