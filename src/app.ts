import {Response} from 'express';
import express from "express";
import compression from "compression";  // compresses requests
import bodyParser from "body-parser";
import lusca from "lusca";

// Controllers (route handlers)
import GithubController from "./controllers/github";
import * as apiController from "./controllers/api";
import {requestUuid} from "./util/requests";

const port = process.env.PORT || 9716;

// Create server
const app = express();

// Express configuration
app.set("port", port);
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(lusca.xframe("SAMEORIGIN"));
app.use(requestUuid);

app.use("/github", GithubController);
// API Call Routes
// app.get("/api/v1/*", ApiController);


export default app;
