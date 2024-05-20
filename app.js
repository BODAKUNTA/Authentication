const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const bcrypt = require('bcrypt')
const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'userData.db')
let db = null
const initializingDbServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server is Running at http://localhost:3000')
    })
  } catch (e) {
    console.log('DB Error: ${e.message}')
  }
}
initializingDbServer()

const validationPassword = () => {
  return password.length > 4
}

//POST API

app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const hashPassword = await bcrypt.hash(password, 10)
  const getUserQuery = `SELECT * FROM user WHERE username = ${username}`
  const getuser = await db.get(getUserQuery)

  if (getuser === undefined) {
    const postUserQuery = `
        INSER INTO
        user (username, name, password, gender, location)
        VALUES (
          '${username}',
          '${name}',
          '${hashPassword}',
          '${gender}',
          '${location}'
        )`
    if (validationPassword(password)) {
      await db.run(postUserQuery)
      response.send('User created successfully')
    } else {
      response.status(400)
      response.send('Password is too short')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

//POST API

app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const postQuery = `SELECT * FROM user WHERE username = ${username}`
  const loginUser = await db.get(postQuery)

  if (loginUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordMatch = await bcrypt.compare(password, loginUser.password)
    if (isPasswordMatch === true) {
      response.status(200)
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

//PUT API

app.put('/change-password', async (request, response) => {
  const {newUsername, oldPassword, newPassword} = request.body
  const putQuery = `SELECT * FROM user WHERE username = ${newUsername}`
  const putUser = await db.get(putQuery)

  if (putUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordMatch = await bcrypt.compare(oldPassword, putUser.password)
    if (isPasswordMatch === true) {
      if (validationPassword(newPassword)) {
        const hashPassword = await bcrypt.hash(newPassword, 10)
        const updatePasswordQuery = `
          UPDATE
          user
          SET
          password = '${hashPassword}'
          WHERE
          username = ${username}
        `
        const user = await db.run(updatePasswordQuery)

        response.send('Password updated')
      } else {
        response.status(400)
        response.send('Password is too short')
      }
    } else {
      response.status(400)
      response.send('Invalid current password')
    }
  }
})

module.exports = app
