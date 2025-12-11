import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import userRoutes from './user/index.js'
import rolesRoutes from './roles/index.js'

const app = new Hono()


app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.route('/api/users', userRoutes);
app.route('/api/roles', rolesRoutes);

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
