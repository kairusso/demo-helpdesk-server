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

	/// Mongo DB Instance
	private db: Db | null | void = null;


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

		// Connect to DB
        this.connect();
	}


	// MARK: DATABASE INITIALIZATION

	/** 
     * Connect to our Mongo DB
     */
    public async connect() {
		// Sanity Check
		if (this.db) { return; }

		// Connect to our Database
		let client = await MongoClient.connect(process.env.MONGO_ACCESS_URL as any);
		if (!client) { throw Error("Error | Setup | Could not connect to our Database"); }

		// Set up our MongoDB Global
		this.db = client.db("ZealthyHelpdesk");

        // Index DB
        this.indexCollections();

        // Log Connection Success
        console.log("Collection Driver Connected to db");
    }

	/**
	 * Ensure Indexes on our MongoDB
	 */
    private async indexCollections() {
        if (!this.db) { return; }

        // Ensure Call Log Indexes
        await this.db.collection(Collections.Tickets).createIndex({ 'status' : 1, 'createdAt' : 1 });
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
			// Needed to add this to make serverless on Vercel work
			await this.connect();

			// DB Sanity Check
			if (!this.db) {
				res.status(500).send({ error: 'DB not connected' });
				return;
			}

            // SWITCH BASED ON PARAMS
            switch (req.params.actionA) {

                // CREATING TICKETS

				// Attempt to Submit Ticket
                case "submitTicket": {
                    let submissionResponse = await submitTicket(this.db, req.body);
                    res.json({
						'result' : submissionResponse
					});
                    break;
                }

                // MANAGING TICKETS

				// Load Tickets
                case "loadTickets": {
                    let ticketResponse = await loadTickets(this.db, req.body);
                    res.json(ticketResponse);
                    break;
                }

				// Update Ticket
                case "submitTicketResponse": {
                    let submissionResponse = await submitTicketResponse(this.db, req.body);
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
			//res.status(501).send({ error: 'Route does not exist' });
			res.send('<html><body><h1>Hello World</h1></body></html>');
        });

        // Anchor all the Calls
        this.express.use('/', router);
    }
}
export default new App().express

