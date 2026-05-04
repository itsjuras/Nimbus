import express from 'express'
import { authRouter } from './routes/auth.js'
import { errorHandler } from './middleware/errorHandler.js'

const app = express()
const port = process.env['PORT'] ?? 3000

app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/v1', authRouter)

app.use(errorHandler)

app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`)
})
