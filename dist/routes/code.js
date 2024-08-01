"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const code_1 = require("../controllers/code");
const router = express_1.default.Router();
router.post('/python', code_1.submitAndGetResult);
router.post("/bash", code_1.spawnCommand);
exports.default = router;
