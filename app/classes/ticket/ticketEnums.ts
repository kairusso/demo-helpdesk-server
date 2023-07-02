/// Ticket Submission Result
export enum TicketSubmitResult {
    UnknownError = 0,
    Success = 1,

    InvaildData = 100,
}

/// Ticket Status
export enum TicketStatus {
    New = 1,
	InProgress = 2,
	Resolved = 3,
}