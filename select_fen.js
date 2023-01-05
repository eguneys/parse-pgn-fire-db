const fs = require('fs')
const readline = require('readline')

let writeStream = fs.createWriteStream('pack1.fen')

writeStream.on('error', error => {
  console.error(`Error writing to file. ${error.message}`)
})


let queue = []

function flush() {
  console.log(current_set())
  console.log('progress %', Math.floor((total / size * 100) * 100) / 100)


  writeStream.write(queue.join('\n'))

  queue = []
}

let _starter_evals = []
let _starter_ids = []
let _check_sets = {
  starter: (id, eval, nb_moves) => {
    
    let id_n = `${id}${(parseInt(nb_moves) / 10) % 3}`
    let solid_eval = Math.abs(eval) > 0 && Math.abs(eval) < 5.0
    let unique = !_starter_ids.includes(id_n)
    _starter_ids.push(id_n)
    let even_eval = _starter_evals.length < 1 || (_starter_evals.filter(_ => Math.sign(_) === Math.sign(eval)).length / _starter_evals.length) <= 0.5
    let res = unique && solid_eval && even_eval

    if (res) {
      _starter_evals.push(eval)
    }
    return res
  },
  medium: (id, eval, nb_moves) => {
    
    let id_n = `${id}${(parseInt(nb_moves) / 10) % 3}`
    let solid_eval = Math.abs(eval) > 0 && Math.abs(eval) < 3.0
    let unique = !_starter_ids.includes(id_n)
    _starter_ids.push(id_n)
    let even_eval = _starter_evals.length < 1 || (_starter_evals.filter(_ => Math.sign(_) === Math.sign(eval)).length / _starter_evals.length) <= 0.5
    let res = unique && solid_eval && even_eval

    if (res) {
      _starter_evals.push(eval)
    }
    return res
  },
  opening: (id, eval, nb_moves) => {
    
    let id_n = `${id}${(parseInt(nb_moves) / 10) % 3}`
    let solid_eval = Math.abs(eval) > 0 && Math.abs(eval) < 5.0
    let unique = !_starter_ids.includes(id_n)
    _starter_ids.push(id_n)
    let even_eval = _starter_evals.length < 1 || (_starter_evals.filter(_ => Math.sign(_) === Math.sign(eval)).length / _starter_evals.length) <= 0.5
    let res = unique && solid_eval && even_eval && nb_moves < 20

    if (res) {
      _starter_evals.push(eval)
    }
    return res
  },

  end_games: (id, eval, nb_moves) => {
    
    let id_n = `${id}${(parseInt(nb_moves) / 10) % 3}`
    let solid_eval = Math.abs(eval) > 0 && Math.abs(eval) < 5.0
    let unique = !_starter_ids.includes(id_n)
    _starter_ids.push(id_n)
    let even_eval = _starter_evals.length < 1 || (_starter_evals.filter(_ => Math.sign(_) === Math.sign(eval)).length / _starter_evals.length) <= 0.5
    let res = unique && solid_eval && even_eval

    if (res) {
      _starter_evals.push(eval)
    }
    return res
  },


}

let _set_lengths = {
  starter: 10000,
  medium: 5000,
  opening: 3000,
  end_games: 3000
}

let sets = Object.keys(_check_sets)
let _current_set = 0
let current_set = () => sets[_current_set]

function check_set(id, eval, nb_moves) {
  return _check_sets[current_set()]?.(id, parseFloat(eval), nb_moves)
}

function set_length() {
  return _set_lengths[current_set()]
}

let total = 0
function parse_write(line) {
  total += line.length

  let _ = line.split(',')
  let [id, eval, nb_moves, fen] = _


  if (check_set(id, eval, nb_moves)) {
    queue.push([current_set(), _].join(','))
    if (queue.length > set_length()) {
      flush()
      _current_set++
    }
  }
}

let in_file = process.argv[2] || 'out.eval.fen'

let { size } = fs.statSync(in_file)

function read_stream() {
  total = 0
  return new Promise(resolve => {
    let stream = fs.createReadStream(in_file, 'utf-8')

    let rl = readline.createInterface({ input: stream })

    rl.on('line', (line) => {
      parse_write(line)
    })
    rl.on('close', () => {

      if (current_set()) {
        flush()
      }
      _current_set++
      console.log('done')
      writeStream.end()
      resolve()
    })
  })
}


async function main() {
  while(current_set()) {
    await read_stream()
  }
}
main()
