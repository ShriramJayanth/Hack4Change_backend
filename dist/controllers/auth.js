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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.user = exports.login = exports.register = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const unique_username_generator_1 = require("unique-username-generator");
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const prisma = new client_1.PrismaClient();
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        const username = (0, unique_username_generator_1.generateFromEmail)(email, 4);
        const salt = yield bcrypt_1.default.genSalt();
        const passwordHash = yield bcrypt_1.default.hash(password, salt);
        yield prisma.user.create({
            data: {
                email,
                username,
                password: passwordHash,
            },
        });
        res.status(201).json({ message: 'User added successfully' });
    }
    catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.register = register;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        const user = yield prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            res.status(404).json({ message: 'User does not exist' });
            return;
        }
        const isMatch = yield bcrypt_1.default.compare(password, user.password);
        if (!isMatch) {
            res.status(401).json({ message: 'Invalid password' });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '2h' });
        res.cookie('jwt', token, { httpOnly: true });
        res.status(200).json({ message: 'Login successful' });
    }
    catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.login = login;
const user = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.cookies['jwt'];
        if (!token) {
            res.status(401).json({ message: 'Unauthenticated' });
            return;
        }
        const claims = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        if (!claims.id) {
            res.status(401).json({ message: 'Unauthenticated' });
            return;
        }
        const user = yield prisma.user.findUnique({
            where: { id: claims.id },
        });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        const { password } = user, data = __rest(user, ["password"]);
        res.status(200).json(data);
    }
    catch (e) {
        console.error('Error fetching user:', e);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.user = user;
const logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        res.cookie("jwt", "", { maxAge: 900000 });
        res.status(200).json({ message: "logout successful" });
    }
    catch (err) {
        res.status(500).json(err);
    }
});
exports.logout = logout;
