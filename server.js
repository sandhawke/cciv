'use strict'

const webgram = require('webgram')
const fs = require('fs')
const fetchIndicators = require('./fetch-data')
const setdefault = require('setdefault')
const debug = require('debug')('cciv')
const H = require('escape-html-template-tag')   // H.safe( ) if needed



const s = new webgram.Server({port: 5505})
s.app.get('/raw', async (req, res) => {
  res.send(await fetchIndicators())
})
s.app.get('/approved', async (req, res) => spec(req, res, true))
s.app.get('/', async (req, res) => spec(req, res, false))

async function spec (req, res, approvedOnly) {
  const data = await fetchIndicators()
  const byCat = new Map()
  const parts = []
  for (const row of data) {
    debug('row: %o', row)
    if (!row.Name) continue // ignore rows with blank name
    if (approvedOnly) {
      if (row['Approved for Preliminary Vocabulary'] !== true) continue
    }
    setdefault(byCat, row.Category, []).push(row)
  }
  const cats = Array.from(byCat.keys()).sort()
  debug('categories %O', cats)
  for (const cat of cats) {
    parts.push(H`<section>
  <h2>${cat}</h2>
`)
    const terms = Array.from(byCat.get(cat)).sort((a, b) => {
      if (a.Name < b.Name) return 1
      if (a.Name > b.Name) return -1
      return 0
    })
    for (const term of terms) {
      /*
        parts.push(`<section><h3>${term.Name}</h3><table>\n`)
      for (const prop of Object.keys(term)) {
        if (prop === 'Category') continue
        if (prop === 'Name') continue
        parts.push(`<tr><th>${prop}</th><td>${term[prop]}</td></tr>`)
      }
      parts.push('</table>\n')
      */
      parts.push(H`<section><h3>${term.Name}</h3><dl>\n`)
      for (const prop of Array.from(Object.keys(term).sort())) {
        if (prop === 'Category') continue
        if (prop === 'Name') continue
        parts.push(H`<dt>${prop}</dt><dd>${term[prop]}</dd>`)
      }
      parts.push('</dl>\n')


      parts.push('</section>\n')
    }
    parts.push('</section>\n')
  }
  const body = parts.join('')
  fs.readFile('index.html', 'utf8', (err, text) => {
    if (err) {
      console.error('error reading HTML source', err)
      res.error()
    }
    const t2 = text.replace('<div id="replace-this"></div>', body)
    res.send(t2)
  })
}
s.start()
