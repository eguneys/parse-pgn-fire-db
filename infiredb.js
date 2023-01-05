const stream = require('stream')
const fs = require('fs')
const readline = require('readline')
const { initializeApp, cert } = require('firebase-admin/app')
const { getFirestore, CollectionReference } = require('firebase-admin/firestore')

const serviceAccount = require('./secrets/aidpgn.json')

const app = initializeApp({
  credential: cert(serviceAccount)
})
const db = getFirestore()

const gen_id = (game_id, nb_moves) => {
  return `g-${game_id}-${nb_moves}`
}

class Poss {


  static make_line = (line) => {

    let [game_id, _eval, nb_moves, fen] = line.split(',')

    return {
      id: gen_id(game_id, nb_moves),
      game_id,
      _eval,
      nb_moves,
      fen
    }
  }

}

let total = 0
let queue = []
async function flush() {

  let batch = db.batch()

  let ref = db.collection('poss')
  queue.forEach(_ => {
    batch.set(ref.doc(_.id), _)
  })

  console.log('committing', queue.length)
  await batch.commit()
  console.log('done commit')
  console.log(queue)
  queue = []
}

async function parse_write(line) {
  total += line.length

  console.log('progress %', Math.floor((total / size * 100) * 100) / 100)

  queue.push(Poss.make_line(line))

  if (queue.length > 400) {
    await flush()
  }
}


class PushToFire extends stream.Transform {

  constructor(options = {}) {
    super({ ...options, objectMode: true })
  }

  async _transform(chunk, encoding, done) {
    try {
      let line = chunk.toString()
      await parse_write(line)
      done()
    } catch (error) {
      done(error)
    }
  }
}


let in_file = process.argv[2] || 'out.eval.fen'

let { size } = fs.statSync(in_file)
let in_stream = fs.createReadStream(in_file, 'utf-8')

const rl = readline.createInterface({ input: in_stream })

stream.pipeline(
  rl,
  new PushToFire(),
  (err) => {

    if (err) {
      console.error('failed', err)
    } else {
      console.log('done')
    }
  }
)
