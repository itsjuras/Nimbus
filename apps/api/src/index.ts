import express from 'express'
import { authRouter } from './routes/auth.js'
import { clientsRouter } from './routes/clients.js'
import { checklistsRouter } from './routes/checklists.js'
import { jobsRouter } from './routes/jobs.js'
import { errorHandler } from './middleware/errorHandler.js'

const app = express()
const port = process.env['PORT'] ?? 3000

app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/v1', authRouter)
app.use('/api/v1/clients', clientsRouter)
app.use('/api/v1/checklists', checklistsRouter)
app.use('/api/v1/jobs', jobsRouter)

app.use(errorHandler)

app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`)
})
