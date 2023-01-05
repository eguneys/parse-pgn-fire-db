const fs = require('fs')
const readline = require('readline')
const { parse } = require('@mliebelt/pgn-parser')

let in_file = process.argv[2] || 'lichess_db_1000.pgn'
console.log(in_file)

let writeStream = fs.createWriteStream('out.eval')

writeStream.on('error', error => {
  console.error(`Error writing to file. ${error.message}`)
})

let { size } = fs.statSync(in_file)
let stream = fs.createReadStream(in_file, 'utf-8')

let total = 0

function parse_and_write(data) {
  total += data.length
  console.log('progress %', Math.floor((total / size * 100) * 100) / 100)
  let games = parse(data.toString())


  let res = []
  games.forEach(_ => {
    _.moves.forEach((move, i) => {

      if (move?.commentDiag?.eval) {
        let ns = _.moves.slice(0, i + 1).map(_ => _.notation.notation).join(' ')
        res.push([_.tags.Site.slice(-8), move.commentDiag.eval, ns].join(' '))
      }
    })
  })

  if (res.length > 0) {
    console.log(`Wrote ${res.length} positions.`)
    writeStream.write(res.join('\n'))
  }
}



let ns = ''

let rl = readline.createInterface({ input: stream })
rl.on('line', (line) => {
  if (ns.length < 100000000) {
    ns += line
  } else {
    if (line.match(/^\[Event/)) {
      parse_and_write(ns)
      ns = ''
    } else {
      ns += line
    }
  }
})
rl.on('close', () => {
  parse_and_write(ns)
  console.log('done')
  writeStream.end()
})
