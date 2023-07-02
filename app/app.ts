// Import 3rd Party Libraries
import express from "express";
import { MongoClient, Db } from "mongodb";

const mongoSanitize = require('express-mongo-sanitize');
const cors = require('cors');
require('dotenv').config();

// Import General Functions, Enums, and Interfaces 
import { Collections } from './enums';

// Import Specific Functions, Enums, and Interfaces 
import { submitTicket, loadTickets, submitTicketResponse } from "./classes/ticket/ticket";


/**
 * Main entry point for our Server
 * Defines our API endpoints using Express
 */
class App {

	// MARK: GLOBALS

	/// Express instance 
	public express = express();


	// MARK: CLASS INITIALIZATION

	/**
	 * Initialize our Server
	 */
	constructor () {
		// Setup Express
		this.express.use(express.json());
		this.express.use(express.urlencoded({extended: false}));
		this.express.use(cors());

		// Strip Injection Keys from Requests
        this.express.use(mongoSanitize());

		// Mount API Routes
        this.mountRoutes();
	}


	// MARK: DATABASE INITIALIZATION

	/** 
     * Connect to our Mongo DB
     */
    public async connectToDB(): Promise<Db | null> {
		// Connect to our Database
		let client = await MongoClient.connect(process.env.MONGO_ACCESS_URL as any);
		if (!client) { return null; }

		// Set up our MongoDB Global
		let db = client.db("ZealthyHelpdesk");
		return db;
    }


	// MARK: SERVER INITIALIZATION

	/**
	 * Mount Routes for our Server
	 */
	private mountRoutes(): void {
        const router = express.Router();

        ////////////////////////////////////////////////////////////////////////////////////
        /// PUBLIC POSTS ///////////////////////////////////////////////////////////////////
        ////////////////////////////////////////////////////////////////////////////////////
        router.post('/:actionA?', async (req: any, res: any) => {
			// Connect to DB
			let db = await this.connectToDB();
			if (!db) {
				res.status(500).send({ error: 'DB not connected' });
				return;
			}

            // SWITCH BASED ON PARAMS
            switch (req.params.actionA) {

                // CREATING TICKETS

				// Attempt to Submit Ticket
                case "submitTicket": {
                    let submissionResponse = await submitTicket(db, req.body);
                    res.json({
						'result' : submissionResponse
					});
                    break;
                }

                // MANAGING TICKETS

				// Load Tickets
                case "loadTickets": {
                    let ticketResponse = await loadTickets(db, req.body);
                    res.json(ticketResponse);
                    break;
                }

				// Update Ticket
                case "submitTicketResponse": {
                    let submissionResponse = await submitTicketResponse(db, req.body);
                    res.json({
						'result' : submissionResponse
					});
                    break;
                }

                // Default Response if no Route Hits
                default: { 
					res.status(501).send({ error: 'Route does not exist' });
				}
            }
        });

        ///////////////////////////////////////////////////////////////////////////////////
        /// PUBLIC GETS ///////////////////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////////////////
        router.get('/:actionA?', async (req: any, res: any) => { 
			res.status(501).send({ error: 'Route does not exist' });
        });

        // Anchor all the Calls
        this.express.use('/', router);
    }
}
export default new App().express

