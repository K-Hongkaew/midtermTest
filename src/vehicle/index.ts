import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import db from '../db/index.js'
import * as z from 'zod'

const vehicleRoute = new Hono()
type Vehicle = {
    plate_number : string
    model : string
    year : string
    color : string
}
const createVehicleSchema = z.object({
    plate_number : z.string().min(4).max(6),
    model : z.string().min(1).max(4),
    year : z.string().min(1).max(4),
    color : z.string().min(1).max(50)
})

vehicleRoute.get('/', async (c) => {
    let sql = "SELECT * FROM vehicle_table"
    let stmt = db.prepare<[],Vehicle>(sql)
    let vehicles = await stmt.all()

    return c.json({ message : "List of all vehicles", data: vehicles})
})

vehicleRoute.get('/:id', async (c) => {
    const { id } = c.req.param()
  let sql = "SELECT * FROM vehicle_table WHERE vehicles_id = @id"
  let stmt = db.prepare<{id:string},Vehicle>(sql)
  let role = await stmt.get({id:id})

  if (!role) {
        return c.json({message : "Role not found"},404)
    }
    return c.json({
        message : `Role details for data id: ${id}`,
        data : role
    });
});

vehicleRoute.post('/createVehicle', 
    zValidator('json',createVehicleSchema,
        (result,c) => {
            if(!result.success){
                return c.json({
                    message: "Validation error",
                    error : result.error.issues
                }, 400)
            }
        }) , async (c) => {
            const body = await c.req.json<Vehicle>();
        let sql = `INSERT INTO vehicle_table (plate_number, model, year, color)
        VALUES (@plate_number, @model, @year, @color)`
        let stmt = db.prepare<Omit<Vehicle,"vehicles_id">>(sql);
        let result = stmt.run(body);
        return c.json({ message : "Create vehicle completed", data : result})
    }
)

vehicleRoute.put('/updateVehicle/:id',
    zValidator('json', createVehicleSchema,
        (result,c) => {
            if (!result.success){
                return c.json({
                    message: "Validation error",
                    error : result.error.issues
                }, 400)
            }
        }), async (c) => {
            const {id} = c.req.param()
            const body = await c.req.json<Vehicle>();
            
            let sql =   `UPDATE vehicle_table
                        SET plate_number = @plate_number,
                        model = @model,
                        year = @year,
                        color = @color
                        WHERE vehicles_id = @vehicles_id
                        `;
            let stmt = db.prepare(sql)
            const result = await stmt.run({
                plate_number: (await body).plate_number,
                model: (await body).model,
                year: (await body).year,
                color: (await body).color,
                vehicles_id: Number(id) 
            });
            if (result.changes === 0) {
                return c.json({ message: "Vehicle not found" }, 404);
            }
        
            return c.json({
              message: "Vehicle updated",
              changes: result.changes
            });
        }


)

vehicleRoute.delete('/deleteVehicle/:id', (c) => {
    const { id } = c.req.param();
    const vehicles_id = Number(id);  

    let sql = `DELETE FROM vehicle_table WHERE vehicles_id = @vehicles_id`;
    const stmt = db.prepare<{ vehicles_id: number }>(sql);

  const result = stmt.run({ vehicles_id: vehicles_id });
    
    if (result.changes === 0) {
        return c.json({ message: "Role not found" }, 404);
    }

    return c.json({ message: "Vehicle deleted" });
})
export default vehicleRoute