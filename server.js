// server.js
// where your node app starts

// we've started you off with Express (https://expressjs.com/)
// but feel free to use whatever libraries or frameworks you'd like through `package.json`.
const http = require("http");
const fetch = require("node-fetch");
const express = require("express");
const bodyParser = require("body-parser");
const crypto = require("crypto");

var fs = require("fs").promises;
var parse = require("csv-parse/lib/sync");
var cors = require("cors");

const app = express();
app.use(express.json());

// create new router
const router = express.Router();

// // create a JSON data array
// let baseFormat = {
//   results: {
//     base: "",
//     date: "",
//     rates: {}
//   }
// };

// Api base endpoint
const apiBaseEndpoind = "/api";

// exchangeRateApi
const exchangeRateApi = "https://api.exchangeratesapi.io/latest";
// rates RestApi endPoint (/api/rates)
const ratesRestEndPoint = "/rates";

// create middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw());
app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500).send("Something broke!");
  next();
});

// getApi for exchangerates
async function getExchangeRates(url, method = "GET") {
  return fetch(url)
    .then(data => data.json())
    .catch(err => {
      throw new Error(err);
    });
}

// fieldSelector function to select the important fields
function fieldSelector(fields = "") {
  return fields.split(",");
}

// currency rate api
router.get(apiBaseEndpoind + ratesRestEndPoint, async (req, res) => {
  // express helps us take JS objects and send them as JSON
  // console.log(Object.keys(req.query));

  console.log(req.query)
  //  check for required fields
  if (!Object.keys(req.query).includes("base")) {
    return res.status(404).json({ error: "base field not found" });
  } else if (!Object.keys(req.query).includes("currency")) {
    return res.status(404).json({ error: "currency field not found" });
  }

  var jsonData = await getExchangeRates(
    (url = "https://api.exchangeratesapi.io/latest")
  );

  var dataRates = jsonData["rates"];
  let newRateData = new Object();

  // select data fields and process if necessary
  const processedFields = await fieldSelector((fields = req.query.currency));

  processedFields.map(key =>
    dataRates[key]
      ? (newRateData[key] = dataRates[key])
      : (newRateData[key] = "")
  );

  //   replace rate with new rates
  jsonData["rates"] = newRateData;
  jsonData["base"] = req.query["base"];

  // get current data
  var now = new Date();
  var formattedDate =
    now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate();
  jsonData["date"] = formattedDate;

  res.status(200).json({ results: jsonData });
});

// mount the router on the app
app.use("/", router);

const server = http.createServer(app);

// listen for requests :)
server.listen(process.env.PORT);
