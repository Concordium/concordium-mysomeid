
import { Pool } from 'pg';

type Result = {
  id: string;
  platform: string;
  userData: string;
  firstName: string;
  lastName: string;
};

const db = () => {
  let pool: Pool | null = null;
  // const connectionString = process.env.DB_CONN_STR ?? `postgresql://db:AVNS_ThIXIPdZyPbOSqSqsPN@app-186f60a2-b8d7-43c5-a5ef-2ba5d17e7a54-do-user-7831252-0.b.db.ondigitalocean.com:25060/db?sslmode=require`;

  const args = {
    user: process.env.DB_USERNAME,
    host: process.env.DB_HOSTNAME,
    database: process.env.DATABASE,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT),
    ssl: process.env.DB_HOSTNAME === 'localhost' ? undefined : {
       rejectUnauthorized: true,
       ca: process.env.CA_CERT,
    },      
  };

  console.log("database args ", args);

  const getPool = () => {
    pool = pool ?? new Pool(args);
    return pool;
  }

  const drop = async () => {
    const pool = getPool();
    const query = `DROP TABLE proofs;`;  
    const createdRes = await pool.query(query)
      .then(res => {
        console.log('Table successfully dropped.');
      })
      .catch(err => {
        console.error(err);
      });
    console.log("dropped ", createdRes );
  };

  const insertProof = async (proofId: string, platform: 'li',  userData: string, firstName: string, lastName: string, profilePictureUrl: string) => {
    const pool = getPool();

    const createTableQuery = `CREATE TABLE IF NOT EXISTS proofs (
      id VARCHAR(32) UNIQUE PRIMARY KEY,
      platform VARCHAR(2) NOT NULL,
      userData VARCHAR(255) NOT NULL,
      firstName VARCHAR(255) NOT NULL,
      lastName VARCHAR(255) NOT NULL,
      profileImageUrl VARCHAR(255) NOT NULL
    );`;

    await pool.query(createTableQuery)

    const insertQuery = `INSERT INTO proofs
      (id, platform, userData, firstName, lastName, profileImageUrl)
      VALUES
      ($1, $2, $3, $4, $5, $6)`;
    const values = [proofId, platform, userData, firstName, lastName, profilePictureUrl ?? ''];

    const result = await pool.query(insertQuery, values);
    if (result.rowCount <= 0) {
      throw new Error('Failed to insert');
    }
  };
  

  const getProof = async (id: string): Promise<Result> => {
    const pool = getPool();
    console.log('DB: Getting Proof : ' + id);

    const selectQuery = `SELECT * FROM proofs WHERE id = $1`;

    // Use the pool to execute the select query with the id as the parameter.
    const row = await pool.query(selectQuery, [id])
      .then(result => {
        const tmp = result?.rows[0] ?? undefined;
        return tmp;
      })
      .catch(err => {
        console.error(err);
      });

    return row;
  };

  return {
    drop,
    insertProof,
    getProof,
  };
};

let _db = db();

export default _db;
