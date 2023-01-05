const fs = require('fs')
const readline = require('readline')
const { Chess } = require('chess.js')


let writeStream = fs.createWriteStream('out.eval.fen')

writeStream.on('error', error => {
  console.error(`Error writing to file. ${error.message}`)
})


let queue = []

function flush() {
  console.log('progress %', Math.floor((total / size * 100) * 100) / 100)


  writeStream.write(queue.join('\n'))

  queue = []
}

let total = 0
function parse_write(line) {
  total += line.length

  let _ = line.split(' ')
  let [id, eval, ...moves] = _

  if (moves.length % 10 === 0) {

  } else {
    return
  }

  const chess = new Chess()

  moves.forEach(_ => chess.move(_))
  queue.push([id, eval, moves.length, chess.fen()].join(','))

  if (queue.length > 1000) {
    flush()
  }
}

let in_file = process.argv[2] || 'out.eval'

let { size } = fs.statSync(in_file)
let stream = fs.createReadStream(in_file, 'utf-8')

let rl = readline.createInterface({ input: stream })

rl.on('line', (line) => {
  parse_write(line)
})
rl.on('close', () => {
  flush()
  console.log('done')
  writeStream.end()
})
