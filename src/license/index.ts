import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import db from '../db/index.js'
import * as z from 'zod'

const licenseRoute = new Hono()

type License ={
    license_number: string
    issue_date: string
    expiry_date: string
    type: string
    driver_id: number
}

const createLicenseSchema = z.object({
  license_number: z.string().min(5).max(50),
  issue_date: z.string().min(8).max(10),
  expiry_date: z.string().min(8).max(10),
  type: z.string().min(1).max(10),
  driver_id: z.number().int().positive()
})

licenseRoute.get('/', async (c) => {
    let sql = "SELECT * FROM license_table"
    let stmt = db.prepare<[],License>(sql)
    let license = await stmt.all()

    return c.json({ message : "List of all license", data: license})
})

licenseRoute.get('/:id', async (c) => {
    const { id } = c.req.param()
  let sql = "SELECT * FROM license_table WHERE license_id = @id"
  let stmt = db.prepare<{id:string},License>(sql)
  let license = await stmt.get({id:id})

  if (!license) {
        return c.json({message : "License not found"},404)
    }
    return c.json({
        message : `License details for data id: ${id}`,
        data : license
    });
});

licenseRoute.post('/createLicense',
    zValidator('json', createLicenseSchema,
    (result,c) => {
    if (!result.success) {
      return c.json(
        {
          message: "Validation error",
          error: result.error.issues
        },400)
    }
    }),
    async (c) => {
        const body = await c.req.json<License>()
        
        const sql = `
          INSERT INTO license_table
          (license_number, issue_date, expiry_date, type, driver_id)
          VALUES
          (@license_number, @issue_date, @expiry_date, @type, @driver_id)
        `
        const stmt = db.prepare(sql)
        const result = stmt.run(body)
        
        return c.json({
          message: "Create license completed",
          license_id: result.lastInsertRowid
        })
    
    }
)

licenseRoute.put(
    "/updateLicense/:id",
    zValidator('json', createLicenseSchema,
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
            const body = await c.req.json<License>();

            let sql = `
            UPDATE license_table
            SET license_number = @license_number,
                issue_date = @issue_date,
                expiry_date = @expiry_date,
                type = @type,
                driver_id = @driver_id
            WHERE license_id = @license_id
            `

            let stmt = db.prepare(sql)
            const result = await stmt.run({
                ...body,
                license_id: Number(id)
            });
            if (result.changes === 0) {
                return c.json({ message: "License not found" }, 404);
            }
        
            return c.json({
              message: "License updated",
              changes: result.changes
            });
        }
)


licenseRoute.delete('/deleteLicense/:id', (c) => {
    const { id } = c.req.param();
    const license_id = Number(id);  

    let sql = `DELETE FROM license_table WHERE license_id = @license_id`;
    const stmt = db.prepare<{ license_id: number }>(sql);

  const result = stmt.run({ license_id: license_id });
    
    if (result.changes === 0) {
        return c.json({ message: "License not found" }, 404);
    }

    return c.json({ message: "License deleted" });
})

export default licenseRoute