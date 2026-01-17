import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import vehicleRoute from './vehicle/index.js'
import driverRoute from './driver/index.js'
import licenseRoute from './license/index.js'
import trafficRoute from './traffic_ticket/index.js'
const app = new Hono()


app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.route('/api/vehicle', vehicleRoute);
app.route('/api/driver', driverRoute);
app.route('api/license', licenseRoute)
app.route('/api/traffic', trafficRoute);

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
