import { request } from 'express';
import Database from './Database.mjs';


let sessionExpiration = 5; 

function addMonths(date, months) {
  let result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function formatDateToDDMMYYHHMM(date = new Date()) {
  // Extract date components
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');  // Months are 0-based
  const year = String(date.getFullYear()).slice(2);  // Last two digits of the year

  // Extract time components
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  // Combine into the desired format
  return `${day}.${month}.${year} ${hours}:${minutes}`;
}


class RequestRepository {
    constructor(database) {
        this.db = database;
    }
    
    async getAllRequests(limit) {
      let query = 'SELECT * FROM requests';
      const params = [];

      
  
      if (limit) {
        query += ' LIMIT ?';
        params.push(limit);
      }
  
      return this.db.all(query, params);
  }

  async getUserByUsernameWithPass (username) {
    let user = this.db.all (`
      SELECT * FROM users WHERE username = ?
    `, username)
    console.log (user)
    return user;
  }

  async createSession (username, role) {
    let currentDate = new Date();
    let result = await this.db.run (`
      INSERT INTO sessions (username, role, validtill) 
      VALUES (?, ?, ?)
    `, [
      username, 
      role, 
      addMonths(currentDate, sessionExpiration),
    ]);

    return result.lastID;
  }

  
    
  async createRequest (reqArray) {
    let fullAr = [
      ...Object.values(reqArray),
      'pending',
      formatDateToDDMMYYHHMM(),
    ]
    console.log (fullAr)
    const res = await this.db.run (`
      INSERT INTO requests (
        title, 
        type,
        location, 
        description, 
        contact,
        status,
        time
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, fullAr);

    return res.lastID;
  }

  async deleteRequest (delID) {
    await this.db.run(`
      DELETE FROM requests WHERE id = ?  
    `, [delID],
    (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: 'Job deleted successfully' });
    })
  }

  async findSessionByID (sessionID) {
    let res = await this.db.get (`
      SELECT * FROM sessions WHERE id = ?  
    `, [sessionID])
    return res
  }

  async findRequestByID (reqID) {
    let res = await this.db.get(`
      SELECT * FROM requests WHERE id = ?
    `, [reqID])
    // console.log(res)
    return res
  }

  async updateRequest(id, reqUpdated) {
    await this.db.run(
      `
      UPDATE requests
      SET
        status = ?,
        title = ?,
        type = ?,
        description = ?,
        location = ?,
        contact = ?
      WHERE id = ?
      `,
      [
        ...Object.values(reqUpdated),
        id
      ]
    );
  }

  async updateRequestStatus (id, newStatus) {
    await this.db.run (
      `
        UPDATE requests
        SET status = ?
        WHERE id = ?
      `, [newStatus, id ]
    )
  }

  async getCommentsByID (id) {

    const res = await this.db.all (
      `
        SELECT * 
        FROM comments
        WHERE torequestid = ?
      `, [id]
    )
    return res
  }

  async addCommentByUsualUser (id, username, commentText){
    await this.db.run (
      `
        UPDATE requests
        SET latestcomment = ?, latestcommentby = ?
        WHERE id = ?
      `, [commentText, username, id ]
    )
    let result = await this.db.run (`
      INSERT INTO comments (torequestid, username, created, maintext) 
      VALUES (?, ?, ?, ?)
    `, [
      id, 
      username, 
      formatDateToDDMMYYHHMM(),
      commentText
    ]);

    return result.lastID;
  }

  async addCommentBySupport (id, username, commentText){
    await this.db.run (
      `
        UPDATE requests
        SET latestcomment = ?, latestcommentby = ?
        WHERE id = ?
      `, [commentText, username, id ]
    )
    let result = await this.db.run (`
      INSERT INTO comments (torequestid, username, created, maintext, fromsupport) 
      VALUES (?, ?, ?, ?, ?)
    `, [
      id, 
      username, 
      formatDateToDDMMYYHHMM(),
      commentText,
      1
    ]);

    return result.lastID;
  }
    
}

export default RequestRepository;