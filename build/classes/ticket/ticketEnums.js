"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketStatus = exports.TicketSubmitResult = void 0;
/// Ticket Submission Result
var TicketSubmitResult;
(function (TicketSubmitResult) {
    TicketSubmitResult[TicketSubmitResult["UnknownError"] = 0] = "UnknownError";
    TicketSubmitResult[TicketSubmitResult["Success"] = 1] = "Success";
    TicketSubmitResult[TicketSubmitResult["InvaildData"] = 100] = "InvaildData";
})(TicketSubmitResult = exports.TicketSubmitResult || (exports.TicketSubmitResult = {}));
/// Ticket Status
var TicketStatus;
(function (TicketStatus) {
    TicketStatus[TicketStatus["New"] = 1] = "New";
    TicketStatus[TicketStatus["InProgress"] = 2] = "InProgress";
    TicketStatus[TicketStatus["Resolved"] = 3] = "Resolved";
})(TicketStatus = exports.TicketStatus || (exports.TicketStatus = {}));
