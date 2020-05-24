import request from "supertest";
import app from "../src/app";

describe("POST /github/", () => {
    it("should return 404", (done) => {
        request(app)
            .get("/reset")
            .expect(404, done);
    });
});
