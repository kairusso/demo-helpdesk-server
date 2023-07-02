"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
// Use Port 3000 as default
const port = process.env.PORT || 3000;
// Get our server running! 
app_1.default.listen(port, () => {
    return console.log(`server is listening on ${port}`);
});
