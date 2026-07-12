const mongoose = require('mongoose');
const axios = require('axios');

async function run() {
    await mongoose.connect('mongodb://shanifshaz546_db_user:GWIBAvkwta1rF05c@ac-skixhdq-shard-00-00.eprmst2.mongodb.net:27017,ac-skixhdq-shard-00-01.eprmst2.mongodb.net:27017,ac-skixhdq-shard-00-02.eprmst2.mongodb.net:27017/praxis?ssl=true&replicaSet=atlas-12nasz-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0');
    
    // define schema
    const schema = new mongoose.Schema({}, { strict: false });
    const UpstoxAuth = mongoose.model('UpstoxAuth', schema, 'upstoxauths'); // usually pluralized
    
    const auth = await UpstoxAuth.findOne().sort({ createdAt: -1 });
    if (!auth) {
        console.log("No auth found");
        process.exit(1);
    }
    
    try {
        const r = await axios.get('https://api.upstox.com/v2/fundamentals/INE467B01029/key-ratios', {
            headers: {
                'Authorization': 'Bearer ' + auth.accessToken,
                'Accept': 'application/json'
            }
        });
        console.log(JSON.stringify(r.data, null, 2));
    } catch(e) {
        console.log(e.response ? e.response.data : e.message);
    }
    process.exit(0);
}

run();
