const express=require("express");
const Product=require("../model/product.model")
const client=require("../configs/redis")
const router= express.Router();

router.get("",async(req,res)=>{
    try {
        const page=req.query.page||1;
        const pagesize=req.query.pagesize||2;
    
        const skip=(page-1)*pagesize
        
        const products=await Product.find().skip(skip).limit(pagesize).lean().exec();
    
        const totalpage=Math.ceil((await Product.find().countDocuments())/pagesize);



        client.get("products",async function(err,fetchedProd){
            if(fetchedProd){
                const products=JSON.parse(fetchedProd);
                return res.status(200).send({products,totalpage,redis:true})
            }else{
                try{
                    const products=await Product.find().lean().exec();
                    client.set("products",JSON.stringify(products))

                    return res.status(200).send({products,totalpage,redis:false})
                }catch(err){
                    return res.status(500).send(err.message)
                }
            }
        })
    } catch (error) {
        return res.status(500).send(error.message);
    }
})

router.post("",async(req,res)=>{
    try {
        const product=await Product.create(req.body);
      const products=await Product.find().lean().exec();

      client.set("products",JSON.stringify(products))
        return res.status(201).send(product)
    } catch (error) {
        return res.status(500).send(error.message);
    }
})

router.get("/:id",async(req,res)=>{
    try {
         client.get(`products${req.params.id}`,async(err,fetchedProd)=>{
             if(fetchedProd){
                 const product=JSON.parse(fetchedProd);
                 return res.status(200).send({product,redis:true})
             }else{
                 try{
                     const product=await Product.findById(req.params.id).lean().exec();
                     client.set(`products${req.params.id}`,JSON.stringify(product))
                     return res.status(200).send({product,redis:false})
                 }catch(err){
                     return res.status(500).send(err.message)
                 }
             }
         })
    } catch (error) {
        return res.status(500).send(error.message);
    }
})

router.patch("/:id",async(req,res)=>{
    try {
        const product=await Product.findByIdAndUpdate(req.params.id,req.body,{new:true}).lean().exec();

        const products=await Product.find().lean().exec();
client.set(`products${req.params.id}`,JSON.stringify(product))
client.set("products",JSON.stringify(products))

        return res.status(201).send(product)
    } catch (error) {
        return res.status(500).send(error.message);
    }
})

router.delete("/:id",async(req,res)=>{
    try {
        const product=await Product.findByIdAndDelete(req.params.id)
        const products=await Product.find().lean().exec();
        client.del(`products${req.params.id}`,JSON.stringify(product))
        client.set("products",JSON.stringify(products))
        
       
        return res.status(201).send(product)
    } catch (error) {
        return res.status(500).send(error.message);
    }
})
module.exports=router;