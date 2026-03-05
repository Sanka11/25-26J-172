const { getLast10Weeks } = require("./gruReader");

async function test() {
  const data = await getLast10Weeks("0001");

  console.log("Weeks fetched:", data.length);
  console.log("First week:", data[0]);
  console.log("Last week:", data[data.length - 1]);
}

test();