import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import db from '../db/index.js'
import * as z from 'zod'

const trafficRoute = new Hono()

type TrafficTicket = {
  date: string
  violation: string
  fine: number
  status: string
  driver_id: number
  vehicle_id: number
}

const createTrafficTicketSchema = z.object({
  date: z.string().min(8).max(10),
  violation: z.string().min(3).max(100),
  fine: z.number().int().positive(),
  status: z.string().min(1).max(20),
  driver_id: z.number().int().positive(),
  vehicle_id: z.number().int().positive()
})

trafficRoute.get('/', async (c) => {
    let sql = "SELECT * FROM traffic_ticket_table"
    let stmt = db.prepare<[],TrafficTicket>(sql)
    let traffic_ticket = await stmt.all()

    return c.json({ message : "List of all traffic tickets", data: traffic_ticket})
})

trafficRoute.get('/:id', async (c) => {
    const { id } = c.req.param()
  let sql = "SELECT * FROM traffic_ticket_table WHERE ticket_id = @id"
  let stmt = db.prepare<{id:string},TrafficTicket>(sql)
  let traffic_ticket = await stmt.get({id:id})

  if (!traffic_ticket) {
        return c.json({message : "Traffic ticket not found"},404)
    }
    return c.json({
        message : `Traffic ticket details for data id: ${id}`,
        data : traffic_ticket
    });
});

trafficRoute.post('/createTicket',
    zValidator('json', createTrafficTicketSchema,
        (result,c) => {
            if (!result.success){
                return c.json(
                    {
                        message: "Validation error",
                        error: result.error.issues
                    },400)
            }
        }),
        async (c) => {
            const body = await c.req.json<TrafficTicket>()

            const sql = 
            `
                INSERT INTO traffic_ticket_table
                (date, violation, fine, status, driver_id, vehicle_id)
                VALUES
                (@date, @violation, @fine, @status, @driver_id, @vehicle_id)
            `

            const stmt = db.prepare(sql)
            const result = stmt.run(body)

            return c.json({
                messsage: "Create Ticket Complete",
                traffic_ticket: result.lastInsertRowid 
            })
        }
)

trafficRoute.put(
    "/updateTicket/:id",
    zValidator('json', createTrafficTicketSchema,
        (result,c) => {
            if(!result.success){
                return c.json({
                    message: "Validation error",
                    error : result.error.issues
                }, 400)
            }
        }),
        async(c) => {
            const { id } = c.req.param()
            const body = await c.req.json<TrafficTicket>();

            let sql = 
            `
            UPDATE traffic_ticket_table
            SET
              date = @date,
              violation = @violation,
              fine = @fine,
              status = @status,
              driver_id = @driver_id,
              vehicle_id = @vehicle_id
            WHERE ticket_id = @ticket_id
            `

            let stmt = db.prepare(sql)
            const result = await stmt.run({
                ...body,
                ticket_id: Number(id)
            });
            if (result.changes === 0) {
                return c.json({ message: "Ticket not found" }, 404);
            }
        
            return c.json({
              message: "Ticket updated",
              changes: result.changes
            });
        }
)

trafficRoute.delete('/deleteTicket/:id', (c) => {
    const { id } = c.req.param();
    const ticket_id = Number(id);  

    let sql = `DELETE FROM traffic_ticket_table WHERE ticket_id = @ticket_id`;
    const stmt = db.prepare<{ ticket_id: number }>(sql);

  const result = stmt.run({ ticket_id: ticket_id });
    
    if (result.changes === 0) {
        return c.json({ message: "Ticket not found" }, 404);
    }

    return c.json({ message: "Ticket deleted" });
})

export default trafficRoute