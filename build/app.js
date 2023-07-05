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
const mongoose_1 = __importDefault(require("mongoose"));
const mongoSanitize = require('express-mongo-sanitize');
const cors = require('cors');
require('dotenv').config();
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
        // Setup Express
        this.express.use(express_1.default.json());
        this.express.use(express_1.default.urlencoded({ extended: false }));
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
    connectToDB() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Connecting to DB');
            // Connect to our Database
            let success = true;
            yield mongoose_1.default.connect(process.env.MONGO_ACCESS_URL + '/ZealthyHelpdesk')
                .then(() => console.log('Connected!'))
                .catch((err) => { success = false; console.log(err); });
            return success;
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
            // Connect to DB
            let connectedToDB = yield this.connectToDB();
            if (!connectedToDB) {
                res.status(500).send({ error: 'DB not connected' });
                return;
            }
            // SWITCH BASED ON PARAMS
            switch (req.params.actionA) {
                // CREATING TICKETS
                // Attempt to Submit Ticket
                case "submitTicket": {
                    let submissionResponse = yield (0, ticket_1.submitTicket)(req.body);
                    res.json({
                        'result': submissionResponse
                    });
                    break;
                }
                // MANAGING TICKETS
                // Update Ticket
                case "submitTicketResponse": {
                    let submissionResponse = yield (0, ticket_1.submitTicketResponse)(req.body);
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
            // Close DB Connection
            mongoose_1.default.connection.close();
        }));
        ///////////////////////////////////////////////////////////////////////////////////
        /// PUBLIC GETS ///////////////////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////////////////
        router.get('/:actionA?', (req, res) => __awaiter(this, void 0, void 0, function* () {
            // Connect to DB
            let connectedToDB = yield this.connectToDB();
            if (!connectedToDB) {
                res.status(500).send({ error: 'DB not connected' });
                return;
            }
            // SWITCH BASED ON PARAMS
            switch (req.params.actionA) {
                // MANAGING TICKETS
                // Load Tickets
                case "getTickets": {
                    let ticketResponse = yield (0, ticket_1.loadTickets)();
                    res.json(ticketResponse);
                    break;
                }
                // Default Response if no Route Hits
                default: {
                    res.status(501).send({ error: 'Route does not exist' });
                }
            }
            // Close DB Connection
            mongoose_1.default.connection.close();
        }));
        // Anchor all the Calls
        this.express.use('/', router);
    }
}
exports.default = new App().express;
