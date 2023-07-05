import { ObjectId } from "mongodb";
import { TicketStatus } from "./ticketEnums"

// MARK: CLIENT INTERFACES 

// New Ticket Submission From Client
export interface TicketSubmission {
    name:           string,
    email:          string,
    description:    string,
}

/// Ticket Loading Response
export interface TicketLoadingResponse {
    newTickets:             Ticket[],
    inProgressTickets:      Ticket[],
    resolvedTickets:        Ticket[],
}

/// Ticket Update
export interface TicketUpdate {
    ticketID:               ObjectId,
    newStatus:              TicketStatus,
    response:               string,
}


// MARK: DATABASE INTERFACES 

// Full Ticket for DB
export interface Ticket extends TicketSubmission {
    _id:            ObjectId,

    createdAt:		Date,
    updatedAt:		Date,

	status:			TicketStatus,	
	statusHistory:	StatusUpdate[],
}

/**
 * Status Update
 * Functions as a snapshot in the Status History
 */
export interface StatusUpdate {
    timestamp:      Date,
    status:         TicketStatus,
    detail:    		string,
}



