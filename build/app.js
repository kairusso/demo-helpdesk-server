"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Import 3rd Party Libraries
const express_1 = __importDefault(require("express"));
const mongodb_1 = require("mongodb");
const mongoSanitize = require('express-mongo-sanitize');
const cors = require('cors');
require('dotenv').config();
// Import General Functions, Enums, and Interfaces 
const enums_1 = require("./enums");
// Import Specific Functions, Enums, and Interfaces 
const ticket_1 = require("./classes/ticket/ticket");
/**
 * Main entry point for our Server
 * Defines our API endpoints using Express
 */
class App {
    // MARK: CLASS INITIALIZATION
    /**
     * Initialize our Server
     */
    constructor() {
        // MARK: GLOBALS
        /// Express instance 
        this.express = (0, express_1.default)();
        /// Mongo DB Instance
        this.db = null;
        // Setup Express
        this.express.use(express_1.default.json());
        this.express.use(express_1.default.urlencoded({ extended: false }));
        this.express.use(cors());
        // Attempt at getting around CORS issues
        // this.express.use(express.static(path.resolve('client')));
        // this.express.get("*", (req, res) => {
        // 	res.sendFile(path.resolve('client', 'index.html'),function (err) {
        // 		if(err) {
        // 			res.status(500).send(err)
        // 		}
        // 	});
        // })
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
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            // Connect to our Database
            let client = yield mongodb_1.MongoClient.connect(process.env.MONGO_ACCESS_URL);
            if (!client) {
                throw Error("Error | Setup | Could not connect to our Database");
            }
            // Set up our MongoDB Global
            this.db = client.db("ZealthyHelpdesk");
            // Index DB
            this.indexCollections();
            // Log Connection Success
            console.log("Collection Driver Connected to db");
        });
    }
    /**
     * Ensure Indexes on our MongoDB
     */
    indexCollections() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.db) {
                return;
            }
            // Ensure Call Log Indexes
            yield this.db.collection(enums_1.Collections.Tickets).createIndex({ 'status': 1, 'createdAt': 1 });
        });
    }
    // MARK: SERVER INITIALIZATION
    /**
     * Mount Routes for our Server
     */
    mountRoutes() {
        const router = express_1.default.Router();
        ////////////////////////////////////////////////////////////////////////////////////
        /// PUBLIC POSTS ///////////////////////////////////////////////////////////////////
        ////////////////////////////////////////////////////////////////////////////////////
        router.post('/:actionA?', (req, res) => __awaiter(this, void 0, void 0, function* () {
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
                    let submissionResponse = yield (0, ticket_1.submitTicket)(this.db, req.body);
                    res.json({
                        'result': submissionResponse
                    });
                    break;
                }
                // MANAGING TICKETS
                // Load Tickets
                case "loadTickets": {
                    let ticketResponse = yield (0, ticket_1.loadTickets)(this.db, req.body);
                    res.json(ticketResponse);
                    break;
                }
                // Update Ticket
                case "submitTicketResponse": {
                    let submissionResponse = yield (0, ticket_1.submitTicketResponse)(this.db, req.body);
                    res.json({
                        'result': submissionResponse
                    });
                    break;
                }
                // Default Response if no Route Hits
                default: {
                    res.status(501).send({ error: 'Route does not exist' });
                }
            }
        }));
        ///////////////////////////////////////////////////////////////////////////////////
        /// PUBLIC GETS ///////////////////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////////////////
        router.get('/:actionA?', (req, res) => __awaiter(this, void 0, void 0, function* () {
            //res.status(501).send({ error: 'Route does not exist' });
            res.send('<html><body><h1>Hello World</h1></body></html>');
        }));
        // Anchor all the Calls
        this.express.use('/', router);
    }
}
exports.default = new App().express;
