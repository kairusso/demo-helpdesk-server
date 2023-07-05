// Import Specific Functions, Enums, and Interfaces 
import { Ticket } from "./ticketSchema";
import { TicketSubmitResult, TicketStatus } from "./ticketEnums";
import { TicketSubmission, TicketLoadingResponse, TicketUpdate } from "./ticketInterfaces";

// Export Functions for Server APIs to Call
export { submitTicket, loadTickets, submitTicketResponse };


// MARK: LOADING TICKETS

/**
 * Load Tickets from DB
 * 
 * @param db MongoDB Database
 * @param filter Ticket Loading Filter
 * 
 * @returns Whether the Ticket Submission was successfull or not
 */
async function loadTickets(): Promise<TicketLoadingResponse> {
    return {
        'newTickets':             await Ticket.find({ 'status' : TicketStatus.New }),
        'inProgressTickets':      await Ticket.find({ 'status' : TicketStatus.InProgress }),
        'resolvedTickets':        await Ticket.find({ 'status' : TicketStatus.Resolved }),
    }
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
async function submitTicketResponse(ticketUpdate: TicketUpdate): Promise<TicketSubmitResult> {
    // Track Result
    let result = TicketSubmitResult.Success;

    // Attempt to add to DB
    let now = new Date();
    await Ticket.findOneAndUpdate({ '_id' : ticketUpdate.ticketID },
    {
        $set: { 
            'updatedAt':            now,
            'status':               ticketUpdate.newStatus,
        }, 
        $push: {
            'statusHistory' : {
                'timestamp':        now,
                'status':           ticketUpdate.newStatus,
                'detail':    	    ticketUpdate.response,
            } as any
        }
    }).
    // Handle Errors
    catch((err: any) => { 
        console.log(err)
        if (err && err.name === 'ValidationError') { result = TicketSubmitResult.InvaildData; }
        else { result = TicketSubmitResult.UnknownError; }
    });

    // Email User the Response and Status Update if the update was successful
    if (result === TicketSubmitResult.Success) {
        console.log('Your ticket has been updated to a new status: ' + TicketStatus[ticketUpdate.newStatus] + ', with the following explanation:');
        console.log(ticketUpdate.response);
    }

    // Return Result
    return result;
}


// MARK: ADDING TICKETS

/**
 * Attempt to submit Ticket to DB
 * 
 * @param db MongoDB Database
 * @param newTicket Ticket Data sent up from Server
 * 
 * @returns Whether the Ticket Submission was successfull or not
 */
async function submitTicket(newTicket: TicketSubmission): Promise<TicketSubmitResult> {
    // Track Result
    let result = TicketSubmitResult.Success;

	// Create Ticket Object for DB
    let now = new Date();
	await Ticket.create({
        'name':             newTicket.name,
        'email':            newTicket.email,
        'description':      newTicket.description,

        'createdAt':		now,
        'updatedAt':		now,

        'status':			TicketStatus.New,	
        'statusHistory':	[],
    }).
    // Handle Errors
    catch((err: any) => { 
        console.log(err)
        if (err && err.name === 'ValidationError') { result = TicketSubmitResult.InvaildData; }
        else { result = TicketSubmitResult.UnknownError; }
    });

    // Return Result
    return result;
}