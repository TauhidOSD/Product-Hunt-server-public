const express =require('express');
const app =express();
const cors = require('cors');
const jwt =require('jsonwebtoken');
require('dotenv').config()
const port =process.env.PORT || 5000;



//middleware
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:5174','https://radiant-vacherin-b7cfe0.netlify.app'],
  credentials: true,
  optionSuccessStatus: 200,
}
app.use(cors(corsOptions))
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.moefco9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)

    const ProductCollection = client.db("ProductHuntDb").collection("products");
    const ReviewCollection = client.db("ProductHuntDb").collection("review");
    const userCollection = client.db("ProductHuntDb").collection("users");

// jwt related Api
    app.post('/jwt',async(req,res)=>{
      const user =req.body;
      const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn:'1h'});
      res.send({token});
    })

// verify token middleware
 
const verifyToken =(req,res,next) =>{
  console.log('inside verify token',req.headers.authorization);

  if(!req.headers.authorization){
    return res.status(401).send({message: 'forbidden access'});
  }
  const token =req.headers.authorization.split(' ')[1];
  jwt.verify(token,process.env.ACCESS_TOKEN_SECRET, (err,decoded)=>{
     
    if(err){
      return res.status(401).send({message: 'forbidden access'})

    }

    req.decoded= decoded;
    next();
  })
}


    //user related Api

    app.get('/users', verifyToken, async(req,res)=>{
      const result =await userCollection.find().toArray();
      res.send(result);
    })

    app.post('/users',async(req,res)=>{
      const user =req.body;
      //checking email 
      const query ={email: user.email}
      const existingUser =await userCollection.findOne(query);
      if(existingUser){
        return res.send({message: 'user already exist',insertedId:null})
      }

      const result = await userCollection.insertOne(user);
      res.send(result);
    })



    app.patch('/users/admin/:id',async(req,res)=>{
      const id =req.params.id;
      const filter ={_id: new ObjectId(id)};
      const updatedDoc ={
        $set: {
          role: 'admin'
        }
      }
      const result =await userCollection.updateOne(filter,updatedDoc)
      res.send(result);
    })
    
    app.patch('/users/moderator/:id',async(req,res)=>{
      const id =req.params.id;
      const filter ={_id: new ObjectId(id)};
      const updatedDoc ={
        $set: {
          role: 'moderator'
        }
      }
      const result =await userCollection.updateOne(filter,updatedDoc)
      res.send(result);
    })



    app.post('/products',async(req,res)=>{

        const newProduct =req.body;
        console.log(newProduct);
        const result =await ProductCollection.insertOne(newProduct);
        res.send(result);
    })
//post review data
    app.post('/review',async(req,res)=>{
      const newReview =req.body;
      console.log(newReview);
      const result =await ReviewCollection.insertOne(newReview);
      res.send(result);
    })

    app.get('/products',async(req,res)=>{
        const cursor = ProductCollection.find();
        const result =await cursor.toArray();
        res.send(result);
    })

    app.get('/products/:id',async(req,res)=>{
      const id =req.params.id;
      console.log(id)
      const query = {_id: new ObjectId(id)}
      const result = await ProductCollection.findOne(query);
      
       
      res.send(result);
  })
    //get review data

    app.get('/review',async(req,res)=>{
      const cursor = ReviewCollection.find();
      const result =await cursor.toArray();
      res.send(result);
    })

//delete method
    app.delete('/products/:id',async(req,res)=>{
      const id =req.params.id;
      const query = {_id: new ObjectId(id)}
      const result =await ProductCollection.deleteOne(query);
      res.send(result);
    })

    //user email
    app.get('/productsbyemail/:OwnerEmail',async(req,res)=>{
      console.log(req.params.OwnerEmail);
      const result = await ProductCollection.find({OwnerEmail:req.params.OwnerEmail}).toArray();
      res.send(result)
    })

    //
  
  //Update
  app.put('/products/:id',async(req,res)=>{
    const id = req.params.id;
    const filter={_id: new ObjectId(id)};
    const options={upsert: true};
    const updatedProduct=req.body;
    const Product = {
      $set: {
        P_name:updatedProduct.P_name,
        Description:updatedProduct.Description,
        P_URL:updatedProduct.P_URL,
        ProductLink:updatedProduct.ProductLink
      }
    }
    const result =await ProductCollection.updateOne(filter,Product,options);
    res.send(result);

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


app.get('/',(req,res)=>{
   res.send('product is setting')
})

app.listen(port, ()=>{
    console.log(`product is sitting on port ${port}`);
})