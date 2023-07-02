// Import 3rd Party Libraries
import { Db, ObjectId } from "mongodb";

// Import General Functions, Enums, and Interfaces 
import { Collections } from "../../enums";

// Import Specific Functions, Enums, and Interfaces 
import { TicketSubmitResult, TicketStatus } from "./ticketEnums";
import { 
    TicketSubmission,  
    ClientTicket, TicketLoadingFilter, TicketLoadingResponse, TicketUpdate,
    Ticket,
} from "./ticketInterfaces";

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
async function loadTickets(db: Db, filter: TicketLoadingFilter): Promise<TicketLoadingResponse> {
    // Prep Response
    let response: TicketLoadingResponse = {
        'newTickets':             [],
        'inProgressTickets':      [],
        'resolvedTickets':        [],
    }

    // Start loading from DB
    let sortingParams: any = { 'createdAt' : -1 };

    // Load New Tickets (if needed)
    if (filter.loadNew) {
        let newSearchParams = { 'status' : TicketStatus.New };
        let dbTickets = await db.collection(Collections.Tickets).find(newSearchParams).sort(sortingParams).toArray() as any;
        response.newTickets = convertDBTicketsToClientFormat(dbTickets);
    }

    // Load In Progress Tickets (if needed)
    if (filter.loadInProgress) {
        let inProgressSearchParams = { 'status' : TicketStatus.InProgress };
        let dbTickets = await db.collection(Collections.Tickets).find(inProgressSearchParams).sort(sortingParams).toArray() as any;
        response.inProgressTickets = convertDBTicketsToClientFormat(dbTickets);
    }

    // Load Resolved Tickets (if needed)
    if (filter.loadResolved) {
        let resolvedSearchParams = { 'status' : TicketStatus.Resolved };
        let limit = filter.loadResolvedLimit && !isNaN(+filter.loadResolvedLimit) ? filter.loadResolvedLimit : 0; // Setting limit to 0 is equivalent to no limit
        let dbTickets = await db.collection(Collections.Tickets).find(resolvedSearchParams).sort(sortingParams).limit(limit).toArray() as any;
        response.resolvedTickets = convertDBTicketsToClientFormat(dbTickets);
    }

    // Return Results 
    return response;
}

/**
 * Convert DB Format Tickets to Client Format Tickets
 * @param dbTickets DB Formatted Tickets
 * @returns Client Format Tickets
 */
function convertDBTicketsToClientFormat(dbTickets: Ticket[]): ClientTicket[] {
    let clientTickets: ClientTicket[] = [];
    for (let dbTicket of dbTickets) {
        clientTickets.push({
            '_id':              dbTicket._id,

            'name':             dbTicket.name,
            'email':            dbTicket.email,
            'description':      dbTicket.description,

            'createdAt':	    dbTicket.createdAt,
	        'status':			dbTicket.status,
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
async function submitTicketResponse(db: Db, ticketUpdate: TicketUpdate): Promise<TicketSubmitResult> {
	// Complete Server Validation
    if (!formatAndValidateTicketUpdate(ticketUpdate)) { return TicketSubmitResult.InvaildData; } 

    // Email User the Response and Status Update
    console.log('Your ticket has been updated to a new status: ' + TicketStatus[ticketUpdate.newStatus] + ', with the following explanation:');
    console.log(ticketUpdate.response);

    // Attempt to add to DB
    let success = true;
    let now = new Date();
    await db.collection(Collections.Tickets).findOneAndUpdate({ '_id' : ticketUpdate.ticketID },
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
    }).catch((err: any) => { success = false; })

    // Return Result
    return success ? TicketSubmitResult.Success : TicketSubmitResult.UnknownError;
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
async function submitTicket(db: Db, newTicket: TicketSubmission): Promise<TicketSubmitResult> {
	// Complete Server Validation
    if (!validateTicketSubmission(newTicket)) { return TicketSubmitResult.InvaildData; } 

	// Create Ticket Object for DB
    let now = new Date();
	let ticket: Ticket = {
        '_id':              new ObjectId(),

        'name':             newTicket.name,
        'email':            newTicket.email,
        'description':      newTicket.description,

        'createdAt':		now,
        'updatedAt':		now,

        'status':			TicketStatus.New,	
        'statusHistory':	[],
    }

    // Attempt to add to DB
    let success = true;
    await db.collection(Collections.Tickets).insertOne(ticket).catch((err: any) => { success = false; })

    // Return Result
    return success ? TicketSubmitResult.Success : TicketSubmitResult.UnknownError;
}


// MARK: VALIDATING TICKETS

/**
 * Validate Ticket Submission
 * @param newTicket New Ticket Data sent up from Client
 * @returns Whether the Ticket Submission was valid or not
 */
function validateTicketSubmission(newTicket: TicketSubmission): boolean {
	// Validate the Name Passed up
	if (!newTicket.name || !newTicket.name.match(nameRegex) || (newTicket.name.length > 200)) { return false; }

	// Validate the Email Passed up
    if (!newTicket.email || !validateEmail(newTicket.email)) { return false; }

	// Validate the Text Passed up
	if (!newTicket.description || !newTicket.description.match(textRegex) || (newTicket.description.length > 1000)) { return false; }

    // If we made it here, we're good!
    return true;
}

/**
 * Format and Validate Ticket Update
 * @param ticketUpdate Ticket Update Data sent up from Client
 * @returns Whether the Ticket Update was valid or not
 */
function formatAndValidateTicketUpdate(ticketUpdate: TicketUpdate): boolean {
    // Format & Validate the Ticket ID
    let validatedID = formatObjectIdFromClient(ticketUpdate.ticketID as any);
    if (!validatedID) { return false; }
    ticketUpdate.ticketID = validatedID;

	// Format & Validate the Status Passed up
    ticketUpdate.newStatus = +ticketUpdate.newStatus;
    if (!TicketStatus[ticketUpdate.newStatus]) { return false; }

	// Validate the Text Passed up
	if (!ticketUpdate.response || !ticketUpdate.response.match(textRegex) || (ticketUpdate.response.length > 1000)) { return false; }

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
function validateEmail(email: string): boolean {
	let re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	return re.test(email.toLowerCase());
}

/**
 * Attempt to Format Mongo ID from a String
 * @param stringID String representing ID
 * @returns ObjectID if format is correct, null if not
 */
function formatObjectIdFromClient(stringID: string): ObjectId | null {
    // Sanity Check
    if (!stringID) { return null; } 

    // Attempt to Format String to ID
    try {
        let objectId = new ObjectId(stringID);

        // Sometimes when dirt is passed up the init doesn't throw error, but the Id is still invalid (this will catch that error)
        objectId.toString();

        // If no error was thrown, return ID
        return objectId;
    }
    catch {
        return null;
    }
}