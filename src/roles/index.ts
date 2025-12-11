import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import db from '../db/index.js'
import * as z from 'zod'

const rolesRoutes = new Hono()

const createRoleSchema = z.object({
    role_name : z.string("Plase add role name").min(3,"Atleast 3 chars to create role")
})

type Role = {
    role_id : number
    role_name : string
}

rolesRoutes.get('/', async (c) => {
  let sql = "SELECT * FROM roles"
  let stmt = db.prepare<[],Role>(sql)
  let roles = await stmt.all()

  return c.json({ message : "List of roles", data: roles})
})

rolesRoutes.get('/:id', async (c) => {
    const { id } = c.req.param()
  let sql = "SELECT * FROM roles WHERE role_id = @id"
  let stmt = db.prepare<{id:string},Role>(sql)
  let role = await stmt.get({id:id})

  if (!role) {
        return c.json({message : "Role not found"},404)
    }
    return c.json({
        message : `Role details for data id: ${id}`,
        data : role
    });
});

rolesRoutes.post('/createRole',
    zValidator('json', createRoleSchema,
        (result,c) => {
        if (!result.success){
            return c.json({
                message : "Validation Failed",
                errors : result.error.issues }, 400)
        }
    }) ,async (c) => {
        const body = await c.req.json<Role>();
        let sql = `INSERT INTO roles (role_name)
        VALUES (@role_name)`
        let stmt = db.prepare<Omit<Role,"role_id">>(sql);
        let result = stmt.run(body);
        return c.json({ message : "Create role completed", data : result})
})

rolesRoutes.put('/updateRole/:id',
    zValidator('json', createRoleSchema,
        (result,c) => {
        if (!result.success){
            return c.json({
                message : "Validation Failed",
                errors : result.error.issues }, 400)
        }
    }) ,
    async (c) => {
    const { id } = c.req.param()
    const body = c.req.json<Role>();

    let sql =  `UPDATE roles
                SET role_name = @role_name
                WHERE role_id = @role_id`;
    let stmt = db.prepare(sql)
    const result = await stmt.run({
      role_name: (await body).role_name,
      role_id: Number(id)
    });

    if (result.changes === 0) {
        return c.json({ message: "Role not found" }, 404);
    }

    return c.json({
      message: "Role updated",
      changes: result.changes
    });

});
rolesRoutes.delete('/deleteRole/:id', (c) => {
    const { id } = c.req.param();
    const roleId = Number(id);  

    let sql = `DELETE FROM roles WHERE role_id = @role_id`;
    const stmt = db.prepare<{ role_id: number }>(sql);

  const result = stmt.run({ role_id: roleId });
    
    if (result.changes === 0) {
        return c.json({ message: "Role not found" }, 404);
    }

    return c.json({ message: "Role deleted" });
})


export default rolesRoutes