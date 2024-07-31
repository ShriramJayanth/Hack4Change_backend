import express from "express";
import { spawnCommand, submitAndGetResult} from "../controllers/code";

const router=express.Router();  

router.post('/python', submitAndGetResult);
router.post("/bash",spawnCommand);

export default router;