import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';
import qs from 'querystring';
import fs from 'fs';
import { config } from 'dotenv';
import express, { json, urlencoded } from 'express';
import { connect, connection } from 'mongoose';

import router from './routes/index';

const app = express();
var db_error;

try {
    /**
     * check if '.env' file exist in config folder through checking if `app` object is not null' && open .env file
     */
    fs.statSync(path.join(__dirname, '/config/.env'));
    config({ path: path.join(__dirname, '/config/.env') })

    app.use(cors());
    app.use(json({ limit: '10mb' }));
    app.use(urlencoded({ extended: false }));
    app.use(cookieParser());

    app.use('/', router);

    /**
    * DataBase Connect Using SSL Verification && Reconnect when DataBase had been disconnected.
    */

    function db_connect() {
        const mongouri = `mongodb://${process.env.DB_USER}:${qs.escape(process.env.DB_PASSWORD)}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}?authSource=admin`
        connect(mongouri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            tls: true,
            tlsCertificateKeyFile: process.env.DB_SSL_KEY,
            tlsCAFile: process.env.DB_SSL_CERT
        }, function (err) {
            db_error = err;
            if (err) throw err;
            else console.log(`[DB] Database connected via TCP/IP on port ${process.env.DB_PORT} with TLS encryption`);
        });
    }

    db_connect();
    connection.on('disconnected',() => {
        console.log('[DB] Database disconnect. Trying to reconnect...')
        db_error = 'disconnected';
        db_connect();
    });
}
catch (err) {
    if (err.code === 'ENOENT') throw new Error ('missing \'.env\' file in \'config\' folder. please modify \'.env.sample\' file.');
}

export {app , db_error};
