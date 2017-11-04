'use strict'

/*
  Return a promise of the data in airtable, in a well-behaved way

  Doesn't fetch new data if old data is less than maxAge ms old

  Doesn't fetch in multiple times at once.  

  I'm sure the logic here is handy in some caching library, somewhere.
*/

module.exports = tableData

const base = require('airtable').base('appE3LJpbBq8MYHa0')

const maxAge = 500

// https://airtable.com/appE3LJpbBq8MYHa0/api/docs#nodejs/table:indicators:retrieve

process.on('unhandledRejection', (reason, p) => {
  console.error(process.argv[1], 'Unhandled Rejection at: Promise', p, 'reason:', reason)
  process.exit()
})

let kept
let last = 0
let waiting

function tableData () {
  return new Promise((resolve, reject) => {

    const now = Date.now()
    const ago = now - last
    if (ago < maxAge) {
      console.log('returning cached', last, now, now - last)
      resolve(kept)
      return
    }

    if (waiting) {
      console.log('too old for cache, but someone else already started')
      waiting.push(resolve)
      return
    }

    // okay time to fetch, and no one's started it yet, so it's us
    
    waiting = [resolve]
    const gathering =  []

    function rec (row) {
      // console.log('=============\n', row.fields)
      gathering.push(row.fields)
    }

    function page(records, fetchNextPage) {
      records.forEach(rec)
      fetchNextPage()
    }

    function done (err) {
      if (err) {
        reject(err)
        return
      }
      kept = gathering
      for (const r of waiting) {
        r(kept)
      }
      waiting = undefined
      last = Date.now()
    }

    console.log('starting fetch!')
    base('Indicators').select({
      // Selecting the first 3 records in Grid view:
      // maxRecords: 1,
      view: "Grid view"
    }).eachPage(page, done)

  })
}

/*
async function f () {
  console.log('calling f')
  console.log((await tableData()).length)
}

setInterval(f, 50)

*/

// f()


/*

  =============
  [ Class {
  _table: 
  Class {
  _base: [Object],
  id: null,
  name: 'Table 1',
  find: [Function],
  select: [Function: bound _selectRecords],
  create: [Function],
  update: [Function],
  destroy: [Function],
  replace: [Function],
  list: [Function],
  forEach: [Function] },
  id: 'recYfS4iRTH9Sx0go',
  _rawJson: 
  { id: 'recYfS4iRTH9Sx0go',
  fields: [Object],
  createdTime: '2017-10-17T18:42:36.071Z' },
  fields: 
  { Category: 'Article Structure',
  Name: 'Publication Outlet (site)' },
  save: [Function],
  patchUpdate: [Function],
  putUpdate: [Function],
  destroy: [Function],
  fetch: [Function],
  updateFields: [Function],
  replaceFields: [Function] } ]

*/
