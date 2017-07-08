var fs = require('fs')
var path = require('path')

/**
 * General purpose data encoding
 *
 * (string): string
 */
function encode (data) {
  return (new Buffer(data)).toString('base64')
}

/**
 * Inverse of `encode`
 *
 * (string): string
 */
function decode (data) {
  return (new Buffer('' + data, 'base64')).toString()
}

/**
 * Encode a superhero name
 *
 * (string): string
*/
module.exports.encodeName = function (name) {
  return encode('@' + name)
}

/**
 * Load the database
 *
 * (string, (?Error, ?Object))
 */
module.exports.loadDb = function (dbFile, cb) {
  fs.readFile(dbFile, function (err, res) {
    if (err) { return cb(err) }

    var messages
    try {
      messages = JSON.parse(res)
    } catch (e) {
      return cb(err)
    }

    return cb(null, { file: dbFile, messages: messages })
  })
}

/**
 * Find the user's inbox, given their encoded username
 *
 * (Object, string): Object
 */
module.exports.findInbox = function (db, encodedName) {
  var messages = db.messages
  return {
    dir: path.dirname(db.file),
    messages: Object.keys(messages).reduce(function (acc, key) {
      if (messages[key].to === encodedName) {
        return acc.concat({
          hash: key,
          lastHash: messages[key].last,
          from: messages[key].from
        })
      } else { return acc }
    }, [])
  }
}

const readFileByHash = (dir, hash) => {
  return new Promise((resolve, reject) => {
    fs.readFile(path.join(dir, hash), 'utf8', (err, data) => {
      if(err) reject(err)
      resolve(data)
    })
  })
}

/**
 * Find the next message, given the hash of the previous message
 *
 * ({ messages: Array<Object> }, string): string
 */
module.exports.findNextMessage = async function (inbox, lastHash) {
  // find the message which comes after lastHash
  var found
  for (var i = 0; i < inbox.messages.length; i += 1) {
    if (inbox.messages[i].lastHash === lastHash) {
      found = i
      break
    }
  }
  // read and decode the message
  const message = await readFileByHash(inbox.dir, inbox.messages[found].hash)
  return 'from: ' + decode(inbox.messages[found].from) + '\n---\n' + decode(message)
}
