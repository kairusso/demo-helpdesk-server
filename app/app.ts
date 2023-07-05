// Import 3rd Party Libraries
import express from "express";
import mongoose from "mongoose";

const mongoSanitize = require('express-mongo-sanitize');
const cors = require('cors');
require('dotenv').config();

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
    public async connectToDB(): Promise<boolean> {
		console.log('Connecting to DB')

		// Connect to our Database
		let success = true;
		await mongoose.connect(process.env.MONGO_ACCESS_URL as any + '/ZealthyHelpdesk')
			.then(() => console.log('Connected!'))
			.catch((err) => { success = false; console.log(err) });

		return success;
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
			let connectedToDB = await this.connectToDB();
			if (!connectedToDB) {
				res.status(500).send({ error: 'DB not connected' });
				return;
			}

            // SWITCH BASED ON PARAMS
            switch (req.params.actionA) {

                // CREATING TICKETS

				// Attempt to Submit Ticket
                case "submitTicket": {
                    let submissionResponse = await submitTicket(req.body);
                    res.json({
						'result' : submissionResponse
					});
                    break;
                }

                // MANAGING TICKETS

				// Update Ticket
                case "submitTicketResponse": {
                    let submissionResponse = await submitTicketResponse(req.body);
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

			// Close DB Connection
			mongoose.connection.close();
        });

        ///////////////////////////////////////////////////////////////////////////////////
        /// PUBLIC GETS ///////////////////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////////////////
        router.get('/:actionA?', async (req: any, res: any) => { 
			// Connect to DB
			let connectedToDB = await this.connectToDB();
			if (!connectedToDB) {
				res.status(500).send({ error: 'DB not connected' });
				return;
			}

			// SWITCH BASED ON PARAMS
            switch (req.params.actionA) {

                // MANAGING TICKETS

				// Load Tickets
                case "getTickets": {
                    let ticketResponse = await loadTickets();
                    res.json(ticketResponse);
                    break;
                }

                // Default Response if no Route Hits
                default: { 
					res.status(501).send({ error: 'Route does not exist' });
				}
            }

			// Close DB Connection
			mongoose.connection.close();
        });

        // Anchor all the Calls
        this.express.use('/', router);
    }
}
export default new App().express

