const { initializeApp, cert } = require('firebase-admin/app')
const { getFirestore, CollectionReference } = require('firebase-admin/firestore')

const serviceAccount = require('../secrets/aidpgn.json')

const app = initializeApp({
  credential: cert(serviceAccount)
})
const db = getFirestore()

class Poss {

  static make = (id) => ({
    game_id: id
  })

}

async function write_batch() {

  let batch = db.batch()

  let ref = db.collection('poss').doc('john')
  batch.set(ref, Poss.make(12345))

  await batch.commit()
}


write_batch()
