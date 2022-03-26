const {createClient}=require("redis");

const client=createClient({url:"redis://localhost:6379"})



client.on("error",function(err){
    console.log(err.message)
})


module.exports = client;