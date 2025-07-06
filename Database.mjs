import sqlite3 from 'sqlite3';
import { promisify } from 'util';

class Database {
  constructor(dbName) {
    this.db = new sqlite3.Database(dbName);
    this.run = promisify(this.db.run.bind(this.db));
    this.get = promisify(this.db.get.bind(this.db));
    this.all = promisify(this.db.all.bind(this.db));


    this.run = (sql, params = []) => {
      return new Promise((resolve, reject) => {
        this.db.run(sql, params, function (err) {
          if (err) {
            reject(err);
          } else {
            resolve({ lastID: this.lastID, changes: this.changes });  // Return `lastID` and `changes`
          }
        });
      });
    };
  }

  async initialize() {
    await this.run(`
      CREATE TABLE IF NOT EXISTS requests (
        id INTEGER PRIMARY KEY,
        status TEXT,
        time TEXT,
        title TEXT,
        type TEXT,
        description TEXT,
        location TEXT,
        contact TEXT,
        latestcomment TEXT,
        updateseenby TEXT,
        archived INTEGER DEFAULT 0,
        deleted INTEGER DEFAULT 0
      )
    `);

    await this.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY,
          username TEXT,
          name TEXT,
          password TEXT,
          role TEXT
        ) 
    `)

    await this.run(`
        CREATE TABLE IF NOT EXISTS sessions (
          id INTEGER PRIMARY KEY,
          username TEXT,
          created TEXT,
          lifespan TEXT
        ) 
    `)

    await this.run(`
      CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY,
        torequestid INTEGER NOT NUll, 
        fromsupport INTEGER DEFAULT 0,
        username TEXT,
        created TEXT
      ) 
  `)
  //   await this.run(`
  //   INSERT INTO requests (status, time, title, type, description, location, contact) VALUES
  //   ('Pending', '2023-09-01 12:00', 'Issue with lights1111', 'Maintenance', 'The lights in the hallway are flickering.', 'Building A, 2nd Floor', 'John Doe, 555-1234'),
  //   ('Completed', '2023-09-02 15:00', 'Broken window', 'Repair', 'The window in room 204 is broken.', 'Building B, Room 204', 'Jane Smith, 555-5678')
    
  // `);
  // ('In Progress', '2023-09-03 09:30', 'Leaky faucet', 'Maintenance', 'The faucet in the kitchen is leaking.', 'Building C, Kitchen', 'Alice Johnson, 555-8765')
  }

  async close() {
    await promisify(this.db.close.bind(this.db))();
  }
}

export default Database;
