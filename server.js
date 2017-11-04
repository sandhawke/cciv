'use strict'

const webgram = require('webgram')
const fetchIndicators = require('./fetch-data')

const s = new webgram.Server({port: 5505})
s.app.get('/raw', async (req, res) => {
  res.send(await fetchIndicators())
})
s.app.get('/', async (req, res) => {
  // interpolate into HTML
  const data = await fetchIndicators()
  res.send('<html><p>Hello!</p></html>')
})
s.start()
