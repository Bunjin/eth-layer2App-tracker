var MongoClient = require('mongodb').MongoClient

const args = process.argv
console.log(args)
console.log('DB name is %s', args[2])

const DBADDRESS = 'mongodb://localhost:27017/'

function resetDB (dbName, cb) {
  MongoClient.connect(DBADDRESS, function (err, db) {
    if (!err) {
      dbo = db.db(args[2])
      console.log('Connected to db')
      console.log(dbo)
      dbo.dropDatabase(cb)
    }
    else{
      console.log(err)
      throw(err)
    }
  }
  )
}

resetDB(args[2], () => {
  return process.exit()
})
