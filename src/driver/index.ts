import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import db from '../db/index.js'
import * as z from 'zod'

const driverRoute = new Hono()

type Driver ={
    name: string
    phone: string
    address: string
    DOB: string
}

const createDriverSchema = z.object({
    name: z.string().min(5).max(50),
    phone: z.string().min(9).max(10),
    address: z.string().min(5).max(20),
    DOB: z.string().min(9).max(10)
})

driverRoute.get('/', async (c) => {
    let sql = "SELECT * FROM driver_table"
    let stmt = db.prepare<[],Driver>(sql)
    let vehicles = await stmt.all()

    return c.json({ message : "List of all driver", data: vehicles})
})

driverRoute.get('/:id', async (c) => {
    const { id } = c.req.param()
  let sql = "SELECT * FROM driver_table WHERE driver_id = @id"
  let stmt = db.prepare<{id:string},Driver>(sql)
  let driver = await stmt.get({id:id})

  if (!driver) {
        return c.json({message : "Driver not found"},404)
    }
    return c.json({
        message : `Driver details for data id: ${id}`,
        data : driver
    });
});

driverRoute.post(
  "/createDriver",
  zValidator("json", createDriverSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          message: "Validation error",
          error: result.error.issues
        },400)
    }
  }),
  async (c) => {
    const body = await c.req.json<Driver>()

    const sql = `
      INSERT INTO driver_table (name, phone, address, DOB)
      VALUES (@name, @phone, @address, @DOB)
    `

    const stmt = db.prepare<Omit<Driver, "driver_id">>(sql)
    const result = stmt.run(body)

    return c.json({
      message: "Create driver completed",
      changes: result.changes,
      driver_id: result.lastInsertRowid
    })
  }
)

driverRoute.put(
    "/updateDriver/:id",
    zValidator('json', createDriverSchema,
        (result,c) => {
            if (!result.success){
                return c.json({
                    message: "Validation error",
                    error : result.error.issues
                }, 400)
            }
        }),
        async(c) => {
            const {id} = c.req.param()
            const body = await c.req.json<Driver>();

            let sql = `
            UPDATE driver_table
            SET name = @name,
                phone = @phone,
                address = @address,
                DOB = @DOB
            WHERE driver_id = @driver_id
            `

            let stmt = db.prepare(sql)
            const result = await stmt.run({
                ...body,
                driver_id: Number(id)
            });
            if (result.changes === 0) {
                return c.json({ message: "Driver not found" }, 404);
            }
        
            return c.json({
              message: "Driver updated",
              changes: result.changes
            });
        }
)

driverRoute.delete('/deleteDriver/:id', (c) => {
    const { id } = c.req.param();
    const driver_id = Number(id);  

    let sql = `DELETE FROM driver_table WHERE driver_id = @driver_id`;
    const stmt = db.prepare<{ driver_id: number }>(sql);

  const result = stmt.run({ driver_id: driver_id });
    
    if (result.changes === 0) {
        return c.json({ message: "Driver not found" }, 404);
    }

    return c.json({ message: "Driver deleted" });
})

export default driverRoute