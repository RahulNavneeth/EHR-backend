import { Request, Response } from "express"
import { pool } from "../../db"
import { Auth } from "../queries"
import jwt from "jsonwebtoken"

export const getToken = async (req: Request, res: Response) => {
    const { type } = req.body
    if (type === undefined) return res.status(417).send("Unexpected params.")

    if (type === 'D') {
        let status = 417
        let msg = "Unexpected params."
        const { uid, pass } = req.body
        if (uid === undefined || pass === undefined) return res.status(status).send(msg)

        const client = await pool.connect()

        try {
            const { rows } = await client.query(Auth.getDoctor, [uid])
            if (rows.length === 0) return res.status(404).send("NO DOCTOR FOUND.")
            if (rows[0].pass !== pass) return res.status(401).send("Unauthorized")

            const token = jwt.sign({ type: 'P', uid }, process.env.PATIENT_SECRET || '', { expiresIn: '7d' });
            res.cookie("d_token", token, { httpOnly: true, maxAge: 86400000 })
            status = 200
            msg = "Doctor signed in successfully"
        } catch (err) {
            console.log(err)
            status = 400
            msg = "Internal Server Error."
        } finally {
            client.release()
            return res.status(status).send(msg)
        }
    } else if (type === 'H') {
        let status = 417
        let msg = "Unexpected params."
        const { uid, pass } = req.body
        if (uid === undefined || pass === undefined) return res.status(status).send(msg)

        const client = await pool.connect()

        try {
            const { rows } = await client.query(Auth.getAdmin, [uid])
            if (rows.length === 0) return res.status(404).send("NO DOCTOR FOUND.")
            if (rows[0].pass !== pass) return res.status(401).send("Unauthorized")

            console.log(rows)
            const token = jwt.sign({ type: 'H', uid, hospital_id: rows[0].hospital_id }, process.env.HOSPITAL_SECRET || '', { expiresIn: '7d' });
            res.cookie("h_token", token, { httpOnly: true, maxAge: 86400000 })
            status = 200
            msg = "Admin signed in successfully"
        } catch (err) {
            console.log(err)
            status = 400
            msg = "Internal Server Error."
        } finally {
            client.release()
            return res.status(status).send(msg)
        }
    } else if (type === 'P'){
        let status = 417
        let msg = "Unexpected params."
        const { uid, pass , email } = req.body
        if (uid === undefined && email === undefined) return res.status(status).send(msg)

        const client = await pool.connect()

        try {
            const { rows } = await client.query(Auth.getPatient, [uid, email])
            if (rows.length === 0) return res.status(404).send("NO PATIENT FOUND.")
            if (rows[0].pass !== pass) return res.status(401).send("Unauthorized")

            const token = jwt.sign({ type: 'P', email: rows[0].email }, process.env.PATIENT_SECRET || '', { expiresIn: '7d' });
            res.cookie("p_token", token, { httpOnly: true, maxAge: 86400000 })
            status = 200
            msg = "Patient signed in successfully"
        } catch (err) {
            console.log(err)
            status = 400
            msg = "Internal Server Error."
        } finally {
            client.release()
            return res.status(status).send(msg)
        }
    } 
    else return res.status(417).send("Unexpected type.")
}
