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
// Import Specific Functions, Enums, and Interfaces 
const ticketSchema_1 = require("./ticketSchema");
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
function loadTickets() {
    return __awaiter(this, void 0, void 0, function* () {
        return {
            'newTickets': yield ticketSchema_1.Ticket.find({ 'status': ticketEnums_1.TicketStatus.New }),
            'inProgressTickets': yield ticketSchema_1.Ticket.find({ 'status': ticketEnums_1.TicketStatus.InProgress }),
            'resolvedTickets': yield ticketSchema_1.Ticket.find({ 'status': ticketEnums_1.TicketStatus.Resolved }),
        };
    });
}
exports.loadTickets = loadTickets;
// MARK: EDITING / MANAGING TICKETS
/**
 * Attempt to update Ticket on DB
 *
 * @param db MongoDB Database
 * @param ticketUpdate Ticket Data sent up from Server
 *
 * @returns Whether the Ticket Submission was successfull or not
 */
function submitTicketResponse(ticketUpdate) {
    return __awaiter(this, void 0, void 0, function* () {
        // Track Result
        let result = ticketEnums_1.TicketSubmitResult.Success;
        // Attempt to add to DB
        let now = new Date();
        yield ticketSchema_1.Ticket.findOneAndUpdate({ '_id': ticketUpdate.ticketID }, {
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
        }).
            // Handle Errors
            catch((err) => {
            console.log(err);
            if (err && err.name === 'ValidationError') {
                result = ticketEnums_1.TicketSubmitResult.InvaildData;
            }
            else {
                result = ticketEnums_1.TicketSubmitResult.UnknownError;
            }
        });
        // Email User the Response and Status Update if the update was successful
        if (result === ticketEnums_1.TicketSubmitResult.Success) {
            console.log('Your ticket has been updated to a new status: ' + ticketEnums_1.TicketStatus[ticketUpdate.newStatus] + ', with the following explanation:');
            console.log(ticketUpdate.response);
        }
        // Return Result
        return result;
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
function submitTicket(newTicket) {
    return __awaiter(this, void 0, void 0, function* () {
        // Track Result
        let result = ticketEnums_1.TicketSubmitResult.Success;
        // Create Ticket Object for DB
        let now = new Date();
        yield ticketSchema_1.Ticket.create({
            'name': newTicket.name,
            'email': newTicket.email,
            'description': newTicket.description,
            'createdAt': now,
            'updatedAt': now,
            'status': ticketEnums_1.TicketStatus.New,
            'statusHistory': [],
        }).
            // Handle Errors
            catch((err) => {
            console.log(err);
            if (err && err.name === 'ValidationError') {
                result = ticketEnums_1.TicketSubmitResult.InvaildData;
            }
            else {
                result = ticketEnums_1.TicketSubmitResult.UnknownError;
            }
        });
        // Return Result
        return result;
    });
}
exports.submitTicket = submitTicket;
