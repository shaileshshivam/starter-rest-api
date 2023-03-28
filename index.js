const express = require('express')
const app = express()
const db = require('@cyclic.sh/dynamodb')
const crypto = require("crypto")

app.use(express.json({
  verify: (req, res, buf, encoding) => {
    req.rawBody = buf.toString(encoding || "utf-8")
  }
}))
app.use(express.urlencoded({ extended: true }))

// #############################################################################
// This configures static hosting for files in /public that have the extensions
// listed in the array.
// var options = {
//   dotfiles: 'ignore',
//   etag: false,
//   extensions: ['htm', 'html','css','js','ico','jpg','jpeg','png','svg'],
//   index: ['index.html'],
//   maxAge: '1m',
//   redirect: false
// }
// app.use(express.static('public', options))
// #############################################################################


function validateAlchemyRequest(req) {
  const rawBody = req.rawBody
  const alchemySignature = req.headers["x-alchemy-signature"]
  const signingKey = "whsec_ttNB9rUkYVggM7Zxn7W8O2El"

  const hmac = crypto.createHmac("sha256", signingKey);
  hmac.update(rawBody, "utf8");
  const digest = hmac.digest("hex");
  return alchemySignature === digest;

}


app.post("/alchemy-address-activity-webhook", (req, res) => {

  const isValidRequest = validateAlchemyRequest(req)

  const { event, id, webhookId, createdAt, type } = req.body || { }
  const { network, activity } = event

  console.log({
    id,
    webhookId,
    createdAt,
    type,
    network,
    activity,
    isValidRequest
  });

  for(const item of activity) {
    console.log(item)
  }

  console.log("-".repeat(100))

  return res.sendStatus(200);
})

// Create or Update an item
app.post('/:col/:key', async (req, res) => {
  console.log(req.body)

  const col = req.params.col
  const key = req.params.key
  console.log(`from collection: ${col} delete key: ${key} with params ${JSON.stringify(req.params)}`)
  const item = await db.collection(col).set(key, req.body)
  console.log(JSON.stringify(item, null, 2))
  res.json(item).end()
})

// Delete an item
app.delete('/:col/:key', async (req, res) => {
  const col = req.params.col
  const key = req.params.key
  console.log(`from collection: ${col} delete key: ${key} with params ${JSON.stringify(req.params)}`)
  const item = await db.collection(col).delete(key)
  console.log(JSON.stringify(item, null, 2))
  res.json(item).end()
})

// Get a single item
app.get('/:col/:key', async (req, res) => {
  const col = req.params.col
  const key = req.params.key
  console.log(`from collection: ${col} get key: ${key} with params ${JSON.stringify(req.params)}`)
  const item = await db.collection(col).get(key)
  console.log(JSON.stringify(item, null, 2))
  res.json(item).end()
})

// Get a full listing
app.get('/:col', async (req, res) => {
  const col = req.params.col
  console.log(`list collection: ${col} with params: ${JSON.stringify(req.params)}`)
  const items = await db.collection(col).list()
  console.log(JSON.stringify(items, null, 2))
  res.json(items).end()
})

// Catch all handler for all other request.
app.use('*', (req, res) => {
  res.json({ msg: 'no route handler found' }).end()
})

// Start the server
const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`index.js listening on ${port}`)
})
