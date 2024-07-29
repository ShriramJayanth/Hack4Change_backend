import express from "express";
import { submitAndGetResult} from "../controllers/code";

const router=express.Router();

router.post('/submit-code', submitAndGetResult);

export default router;