"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.spawnCommand = exports.submitAndGetResult = void 0;
const https = __importStar(require("https"));
const child_process_1 = require("child_process");
// Function to decode Base64 encoded strings
const decodeBase64 = (data) => {
    if (data) {
        return Buffer.from(data, 'base64').toString('utf8');
    }
    return null;
};
// Combined function to submit code and get the result
const submitAndGetResult = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { sourceCode, languageId, stdin } = req.body;
    if (!sourceCode || !languageId) {
        res.status(400).json({ error: 'Source code and language ID are required' });
        return;
    }
    // Prepare the POST request to submit the code
    const postData = JSON.stringify({
        language_id: languageId,
        source_code: Buffer.from(sourceCode).toString('base64'),
        stdin: stdin ? Buffer.from(stdin).toString('base64') : ''
    });
    const submissionOptions = {
        method: 'POST',
        hostname: 'judge0-ce.p.rapidapi.com',
        port: null,
        path: '/submissions?base64_encoded=true&wait=false&fields=*',
        headers: {
            'x-rapidapi-key': 'c246091d05msh325ef22e4b9e0a8p175969jsnd5d7b5c307b6',
            'x-rapidapi-host': 'judge0-ce.p.rapidapi.com',
            'Content-Type': 'application/json'
        }
    };
    // Function to handle getting the result
    const getResult = (token) => {
        const resultOptions = {
            method: 'GET',
            hostname: 'judge0-ce.p.rapidapi.com',
            port: null,
            path: `/submissions/${token}?base64_encoded=true&fields=*`,
            headers: {
                'x-rapidapi-key': 'c246091d05msh325ef22e4b9e0a8p175969jsnd5d7b5c307b6',
                'x-rapidapi-host': 'judge0-ce.p.rapidapi.com'
            }
        };
        const request = https.request(resultOptions, (response) => {
            const chunks = [];
            response.on('data', (chunk) => {
                chunks.push(chunk);
            });
            response.on('end', () => {
                const body = Buffer.concat(chunks).toString();
                try {
                    const resultJson = JSON.parse(body);
                    // Decode Base64 encoded fields
                    resultJson.stdout = decodeBase64(resultJson.stdout);
                    resultJson.stderr = decodeBase64(resultJson.stderr);
                    resultJson.source_code = decodeBase64(resultJson.source_code);
                    res.json(resultJson); // Send the final result to the client
                }
                catch (error) {
                    console.error('Error parsing result JSON:', error);
                    res.status(500).json({ error: 'Error parsing result response JSON' });
                }
            });
            response.on('error', (error) => {
                console.error('Result request error:', error);
                res.status(500).json({ error: `Result request error: ${error.message}` });
            });
        });
        request.end();
    };
    // Submit the code
    const submitRequest = https.request(submissionOptions, (response) => {
        const chunks = [];
        response.on('data', (chunk) => {
            chunks.push(chunk);
        });
        response.on('end', () => {
            const body = Buffer.concat(chunks).toString();
            try {
                const submissionJson = JSON.parse(body);
                if (submissionJson.token) {
                    // If token is received, get the result
                    getResult(submissionJson.token);
                }
                else {
                    res.status(500).json({ error: 'Token not received from submission' });
                }
            }
            catch (error) {
                console.error('Error parsing submission JSON:', error);
                res.status(500).json({ error: 'Error parsing submission response JSON' });
            }
        });
        response.on('error', (error) => {
            console.error('Submission request error:', error);
            res.status(500).json({ error: `Submission request error: ${error.message}` });
        });
    });
    submitRequest.write(postData);
    submitRequest.end();
});
exports.submitAndGetResult = submitAndGetResult;
const spawnCommand = (req, res) => {
    const command = req.body.command;
    const args = req.body.args || [];
    const child = (0, child_process_1.spawn)(command, args);
    let stdoutData = '';
    let stderrData = '';
    let isResponseSent = false; // Flag to track if response is sent
    child.stdout.on('data', (data) => {
        stdoutData += data;
    });
    child.stderr.on('data', (data) => {
        stderrData += data;
    });
    child.on('close', (code) => {
        if (!isResponseSent) {
            isResponseSent = true; // Mark response as sent
            if (code !== 0) {
                res.status(500).json({ error: stderrData });
            }
            else {
                res.status(200).json({ output: stdoutData });
            }
        }
    });
    child.on('error', (error) => {
        if (!isResponseSent) {
            isResponseSent = true; // Mark response as sent
            res.status(500).json({ error: error.message });
        }
    });
};
exports.spawnCommand = spawnCommand;
