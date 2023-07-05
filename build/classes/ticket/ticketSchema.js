"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Ticket = void 0;
// Import 3rd Party Libraries
const mongoose_1 = __importDefault(require("mongoose"));
// Import Specific Functions, Enums, and Interfaces 
const ticketEnums_1 = require("./ticketEnums");
// Define Schema
const TicketSchema = new mongoose_1.default.Schema({
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
        'enum': ticketEnums_1.TicketStatus,
        'default': ticketEnums_1.TicketStatus.New,
    },
    'statusHistory': [{
            'timestamp': {
                'type': Date,
                'require': true,
            },
            'status': {
                'type': Number,
                'enum': ticketEnums_1.TicketStatus,
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
function validateEmail(email) {
    let re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email.toLowerCase());
}
// Add to DB
const Ticket = mongoose_1.default.model('Ticket', TicketSchema);
exports.Ticket = Ticket;
