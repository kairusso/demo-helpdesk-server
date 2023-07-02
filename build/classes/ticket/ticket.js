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
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitTicketResponse = exports.loadTickets = exports.submitTicket = void 0;
// Import 3rd Party Libraries
const mongodb_1 = require("mongodb");
// Import General Functions, Enums, and Interfaces 
const enums_1 = require("../../enums");
// Import Specific Functions, Enums, and Interfaces 
const ticketEnums_1 = require("./ticketEnums");
// MARK: LOADING TICKETS
/**
 * Load Tickets from DB
 *
 * @param db MongoDB Database
 * @param filter Ticket Loading Filter
 *
 * @returns Whether the Ticket Submission was successfull or not
 */
function loadTickets(db, filter) {
    return __awaiter(this, void 0, void 0, function* () {
        // Prep Response
        let response = {
            'newTickets': [],
            'inProgressTickets': [],
            'resolvedTickets': [],
        };
        // Start loading from DB
        let sortingParams = { 'createdAt': -1 };
        // Load New Tickets (if needed)
        if (filter.loadNew) {
            let newSearchParams = { 'status': ticketEnums_1.TicketStatus.New };
            let dbTickets = yield db.collection(enums_1.Collections.Tickets).find(newSearchParams).sort(sortingParams).toArray();
            response.newTickets = convertDBTicketsToClientFormat(dbTickets);
        }
        // Load In Progress Tickets (if needed)
        if (filter.loadInProgress) {
            let inProgressSearchParams = { 'status': ticketEnums_1.TicketStatus.InProgress };
            let dbTickets = yield db.collection(enums_1.Collections.Tickets).find(inProgressSearchParams).sort(sortingParams).toArray();
            response.inProgressTickets = convertDBTicketsToClientFormat(dbTickets);
        }
        // Load Resolved Tickets (if needed)
        if (filter.loadResolved) {
            let resolvedSearchParams = { 'status': ticketEnums_1.TicketStatus.Resolved };
            let limit = filter.loadResolvedLimit && !isNaN(+filter.loadResolvedLimit) ? filter.loadResolvedLimit : 0; // Setting limit to 0 is equivalent to no limit
            let dbTickets = yield db.collection(enums_1.Collections.Tickets).find(resolvedSearchParams).sort(sortingParams).limit(limit).toArray();
            response.resolvedTickets = convertDBTicketsToClientFormat(dbTickets);
        }
        // Return Results 
        return response;
    });
}
exports.loadTickets = loadTickets;
/**
 * Convert DB Format Tickets to Client Format Tickets
 * @param dbTickets DB Formatted Tickets
 * @returns Client Format Tickets
 */
function convertDBTicketsToClientFormat(dbTickets) {
    let clientTickets = [];
    for (let dbTicket of dbTickets) {
        clientTickets.push({
            '_id': dbTicket._id,
            'name': dbTicket.name,
            'email': dbTicket.email,
            'description': dbTicket.description,
            'createdAt': dbTicket.createdAt,
            'status': dbTicket.status,
        });
    }
    return clientTickets;
}
// MARK: EDITING / MANAGING TICKETS
/**
 * Attempt to update Ticket on DB
 *
 * @param db MongoDB Database
 * @param ticketUpdate Ticket Data sent up from Server
 *
 * @returns Whether the Ticket Submission was successfull or not
 */
function submitTicketResponse(db, ticketUpdate) {
    return __awaiter(this, void 0, void 0, function* () {
        // Complete Server Validation
        if (!formatAndValidateTicketUpdate(ticketUpdate)) {
            return ticketEnums_1.TicketSubmitResult.InvaildData;
        }
        // Email User the Response and Status Update
        console.log('Your ticket has been updated to a new status: ' + ticketEnums_1.TicketStatus[ticketUpdate.newStatus] + ', with the following explanation:');
        console.log(ticketUpdate.response);
        // Attempt to add to DB
        let success = true;
        let now = new Date();
        yield db.collection(enums_1.Collections.Tickets).findOneAndUpdate({ '_id': ticketUpdate.ticketID }, {
            $set: {
                'updatedAt': now,
                'status': ticketUpdate.newStatus,
            },
            $push: {
                'statusHistory': {
                    'timestamp': now,
                    'status': ticketUpdate.newStatus,
                    'detail': ticketUpdate.response,
                }
            }
        }).catch((err) => { success = false; });
        // Return Result
        return success ? ticketEnums_1.TicketSubmitResult.Success : ticketEnums_1.TicketSubmitResult.UnknownError;
    });
}
exports.submitTicketResponse = submitTicketResponse;
// MARK: ADDING TICKETS
/**
 * Attempt to submit Ticket to DB
 *
 * @param db MongoDB Database
 * @param newTicket Ticket Data sent up from Server
 *
 * @returns Whether the Ticket Submission was successfull or not
 */
function submitTicket(db, newTicket) {
    return __awaiter(this, void 0, void 0, function* () {
        // Complete Server Validation
        if (!validateTicketSubmission(newTicket)) {
            return ticketEnums_1.TicketSubmitResult.InvaildData;
        }
        // Create Ticket Object for DB
        let now = new Date();
        let ticket = {
            '_id': new mongodb_1.ObjectId(),
            'name': newTicket.name,
            'email': newTicket.email,
            'description': newTicket.description,
            'createdAt': now,
            'updatedAt': now,
            'status': ticketEnums_1.TicketStatus.New,
            'statusHistory': [],
        };
        // Attempt to add to DB
        let success = true;
        yield db.collection(enums_1.Collections.Tickets).insertOne(ticket).catch((err) => { success = false; });
        // Return Result
        return success ? ticketEnums_1.TicketSubmitResult.Success : ticketEnums_1.TicketSubmitResult.UnknownError;
    });
}
exports.submitTicket = submitTicket;
// MARK: VALIDATING TICKETS
/**
 * Validate Ticket Submission
 * @param newTicket New Ticket Data sent up from Client
 * @returns Whether the Ticket Submission was valid or not
 */
function validateTicketSubmission(newTicket) {
    // Validate the Name Passed up
    if (!newTicket.name || !newTicket.name.match(nameRegex) || (newTicket.name.length > 200)) {
        return false;
    }
    // Validate the Email Passed up
    if (!newTicket.email || !validateEmail(newTicket.email)) {
        return false;
    }
    // Validate the Text Passed up
    if (!newTicket.description || !newTicket.description.match(textRegex) || (newTicket.description.length > 1000)) {
        return false;
    }
    // If we made it here, we're good!
    return true;
}
/**
 * Format and Validate Ticket Update
 * @param ticketUpdate Ticket Update Data sent up from Client
 * @returns Whether the Ticket Update was valid or not
 */
function formatAndValidateTicketUpdate(ticketUpdate) {
    // Format & Validate the Ticket ID
    let validatedID = formatObjectIdFromClient(ticketUpdate.ticketID);
    if (!validatedID) {
        return false;
    }
    ticketUpdate.ticketID = validatedID;
    // Format & Validate the Status Passed up
    ticketUpdate.newStatus = +ticketUpdate.newStatus;
    if (!ticketEnums_1.TicketStatus[ticketUpdate.newStatus]) {
        return false;
    }
    // Validate the Text Passed up
    if (!ticketUpdate.response || !ticketUpdate.response.match(textRegex) || (ticketUpdate.response.length > 1000)) {
        return false;
    }
    // If we made it here, we're good!
    return true;
}
/// Store of Name Validation Regex
let nameRegex = "^[a-zA-Z0-9_ ':()#@!?.=|<>\-]*$";
/// Store of Text Validation Regex
let textRegex = "^[a-zA-Z0-9_ ':()[\\]\"#@$\\n^&%*!/+?.;,{}=|<>\-]*$";
/**
 * Validate Email
 * @param email Email as String
 * @returns Whether the Email is valid or not
 */
function validateEmail(email) {
    let re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email.toLowerCase());
}
/**
 * Attempt to Format Mongo ID from a String
 * @param stringID String representing ID
 * @returns ObjectID if format is correct, null if not
 */
function formatObjectIdFromClient(stringID) {
    // Sanity Check
    if (!stringID) {
        return null;
    }
    // Attempt to Format String to ID
    try {
        let objectId = new mongodb_1.ObjectId(stringID);
        // Sometimes when dirt is passed up the init doesn't throw error, but the Id is still invalid (this will catch that error)
        objectId.toString();
        // If no error was thrown, return ID
        return objectId;
    }
    catch (_a) {
        return null;
    }
}
