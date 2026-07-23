const io = require("socket.io-client");

const socket = io("http://localhost:5000", {
  transports: ["websocket"]
});

socket.on("connect", () => {
  console.log("Connected to backend");
});

socket.on("market:smartlists", (data) => {
  console.log("Received smartlists!");
  const allItems = [...(data.options || []), ...(data.futures || [])];
  
  const map = {};
  allItems.forEach(item => {
      if (!map[item.category]) map[item.category] = [];
      map[item.category].push(item);
  });
  
  console.log("Categories found:", Object.keys(map));
  console.log("MOST_ACTIVE count:", map['MOST_ACTIVE']?.length || 0);
  process.exit(0);
});

setTimeout(() => {
  console.log("Timeout waiting for smartlists");
  process.exit(1);
}, 5000);
