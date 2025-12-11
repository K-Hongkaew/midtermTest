import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import db from '../db/index.js'
import * as z from 'zod'
import { omit } from 'zod/mini';

const userRoutes = new Hono();

const createUserSchema = z.object({
    username: z.string("Plase add username")
    .min(5, "Username must has atleast 5 chars"),
    password: z.string("User need password"),
    firstname: z.string("Plase add your firstname").optional(),
    lastname: z.string("Plase add your surname").optional(),
});

type User = {
  id:number
  username : string
  password : string
  firstname : string
  lastname : string
}

userRoutes.get('/', async (c) => {
    let sql = 'SELECT * FROM users';
    let stmt = db.prepare<[],User>(sql);
    let users = await stmt.all();

    return c.json({ message: 'list of users', data : users});
})

userRoutes.get('/:id' ,async (c) => {
    const { id } = c.req.param()
    let sql = 'SELECT * FROM users WHERE id = @id';
    let stmt = db.prepare<{id:string},User>(sql);
    let user = stmt.get({id:id})

    if (!user) {
        return c.json({message : "User not found"},404)
    }
    return c.json({
        message : `User details for data id: ${id}`,
        data : user
    })
})

userRoutes.post('/createUser',
    zValidator('json', createUserSchema, (result,c) => {
        if (!result.success){
            return c.json({
                message : "Validation Failed",
                errors : result.error.issues }, 400)
        }
    })
    , async (c) => {
    const body = await c.req.json<User>()
    let sql = `INSERT INTO users 
    (username, password, firstname, lastname)
     VALUES (@username, @password, @firstname, @lastname)`
    let stmt = db.prepare<Omit<User,"id">>(sql)
    let result = stmt.run(body)

    return c.json({ message : "Create user completed", data : result})
})

export default userRoutes