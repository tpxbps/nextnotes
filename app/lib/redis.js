import Redis from 'ioredis'

const redis = new Redis()

export async function getAllNotes() {
  const data = await redis.hgetall("notes")
  if (Object.keys(data).length == 0) return {}
  return await redis.hgetall("notes")
}

export async function addNote(data) {
  const uuid = Date.now().toString()
  await redis.hset("notes", [uuid], data)
  return uuid
}

export async function updateNote(uuid, data) {
  await redis.hset("notes", [uuid], data)
}

export async function getNote(uuid) {
  return await redis.hget("notes", uuid)
}

export async function delNote(uuid) {
  return redis.hdel("notes", uuid)
}

export default redis
