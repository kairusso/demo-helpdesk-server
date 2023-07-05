// Import 3rd Party Libraries
import mongoose from "mongoose";

// Import Specific Functions, Enums, and Interfaces 
import { TicketStatus } from "./ticketEnums";

// Export Ticket Schema
export { Ticket }

// Define Schema
const TicketSchema = new mongoose.Schema({
    // Client Submitted Parameters
    'name': {
        'type': String,
        'trim': true,
        'require': true,
        'match': [/^[a-zA-Z0-9_ '\-]+$/i, 'Please fill out a valid name'],
    },
    'email': {
        'type': String,
        'trim': true,
        'lowercase': true,
        'require': true,
        'validate': [validateEmail, 'Please fill a valid email address'],
    },
    'description': {
        'type': String,
        'require': true,
        'match': [/^[a-zA-Z0-9_ ':()#@!?.=|:;,\-]*$/, 'Please fill out valid text'],
    },

    // Server Initialized Parameters
    'createdAt': {
        'type': Date,
        'default': Date.now,

    },
    'updatedAt': {
        'type': Date,
        'default': Date.now,

    },
    'status': {
        'type': Number,
        'enum': TicketStatus,
        'default': TicketStatus.New,
    },
	'statusHistory': [{
        'timestamp': {
            'type': Date,
            'require': true,
        },
        'status': {
            'type': Number,
            'enum': TicketStatus,
            'require': true,
        },
        'detail': {
            'type': String,
            'require': true,
            'match': [/^[a-zA-Z0-9_ ':()[\\]\"#@$\\n^&%*!+?.;,{}=|<>\-]*$/, 'Please fill out a valid name'],
        },
    }],
});

/**
 * Validate Email
 * @param email Email as String
 * @returns Whether the Email is valid or not
 */
function validateEmail(email: string): boolean {
	let re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	return re.test(email.toLowerCase());
}


// Add to DB
const Ticket = mongoose.model('Ticket', TicketSchema);