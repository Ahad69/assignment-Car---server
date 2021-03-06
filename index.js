const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;
const ObjectId = require("mongodb").ObjectId;
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();



// middleware
app.use(cors());
app.use(express.json());

function verifyToken(req , res , next){
  const authHeader = req.headers.authorization;
  if(!authHeader){
    return res.status(401).send({message : 'unauthorised'})
  }
  const token = authHeader.split(' ')[1]
  jwt.verify(token , process.env.TOKEN , (err , decoded)=>{
    if(err){
      return res.status(403).send({message : 'Forbidden'})
    }
    req.decoded = decoded;
  })
  next()
}



// database
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mxcn0.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  
  try {
    await client.connect();
    const itemsCollections = client.db("Inventory").collection("Items");

    app.post('/signup' , async(req , res)=>{
        
        const user = req.body;
        
        const accessToken = jwt.sign(user , process.env.TOKEN , {
          expiresIn: '1d'
        });
        res.send({accessToken})
    })

    // get all items
    app.get("/inventories", async (req, res) => {
      const query = {};
      const result = await itemsCollections.find(query).toArray();
      res.send(result);
    });

    // get item by email 
    app.get('/my-items', verifyToken ,  async(req , res)=>{
      const decodedEmail = req.decoded.email
      const email = req.query.email;
      console.log(email , decodedEmail)
      // console.log(email)
      // const query = {email}
      // const result = await itemsCollections.find(query).toArray()
      // res.send(result)
      if(email === decodedEmail){
        const query = {email}
        const result = await itemsCollections.find(query).toArray()
        res.send(result)
      }
      
    })


    // query by id 
    app.get("/inventory/:id", async (req, res) => {
      const id = req.params.id;
      const query = {_id:ObjectId(id)};
      const result = await itemsCollections.findOne(query);
      res.send(result);
    });

    
    // delete item
    app.delete('/inventory/:id' , async(req , res)=>{
      const id = req.params.id;
      const query = {_id:ObjectId(id)}
      const result = await itemsCollections.deleteOne(query)
      res.send(result)
    });

    // add items 
    app.post('/add-items' , async(req , res)=>{
        const query = req.body;
        const result = await itemsCollections.insertOne(query);
        res.send(result)
    })


    // Update 
    app.put('/inventory/:id', async(req , res)=>{
      const id = req.params.id ;
      const query = {_id:ObjectId(id)}
      const itemsBody = req.body.quantity;
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          quantity : itemsBody
        },
      };
      const result = await itemsCollections.updateMany(query, updateDoc, options);
      res.send(result)
    });



  } finally {
    //   await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Assignment Server is running");
});

app.listen(port, () => {
  console.log("port also running", port);
});
