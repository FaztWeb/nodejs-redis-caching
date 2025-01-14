import express from 'express'
import axios from 'axios'
import { createClient } from 'redis'
import responseTime from 'response-time'

const app = express()

// Connecting to redis
const client = createClient({
  host: "127.0.0.1",
  port: 6379,
})

app.use(responseTime())

// Get all characters
app.get("/character", async (req, res, next) => {
  try {
    const reply = await client.get("character")

    if (reply) return res.send(JSON.parse(reply))

    const { data } = await axios.get(
      "https://rickandmortyapi.com/api/character"
    )

    const saveResult = await client.set(
      "character",
      JSON.stringify(data),
      {
        EX: 10,
      }
    )
    console.log(saveResult)

    res.send(data)
  } catch (error) {
    res.send(error.message)
  }
})

// Get a single character
app.get("/character/:id", async (req, res, next) => {
  try {
    const { id } = req.params
    const reply = await client.get(id)

    if (reply) {
      console.log("using cached data")
      return res.send(JSON.parse(reply))
    }

    const { data } = await axios.get(
      `https://rickandmortyapi.com/api/character/${id}`
    )
    
    const saveResult = await client.set(
      id,
      JSON.stringify(data),
      {
        EX: 15,
      }
    )

    console.log("saved data:", saveResult)

    res.send(data)
  } catch (error) {
    console.log(error)
    res.send(error.message)
  }
})

const main = async () => {
  await client.connect()
  app.listen(3000)
  console.log("server listen on port 3000")
}

main()
