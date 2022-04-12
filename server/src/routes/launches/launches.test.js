const request = require("supertest");
const app = require("../../app");
const { loadPlanetsData } = require("../../models/planets.model");
const { mongoConnect, mongoDisconnect } = require("../../services/mongo");

describe("Launches API", () => {
  beforeAll(async () => {
    await mongoConnect();
    await loadPlanetsData();
  });

  afterAll(async () => {
    await mongoDisconnect();
  });

  describe("Test GET /launches", () => {
    test("It should respond with 200 success", async () => {
      const response = await request(app)
        .get("/v1/launches")
        .expect("Content-Type", /json/)
        .expect(200);
    });
  });

  describe("Test POST /launches", () => {
    const mock_launch_data = {
      mission: "US mission",
      rocket: "NCC 170",
      target: "Kepler-442 b",
      launchDate: "January 4, 2028",
    };

    const mock_launch_data_without_date = {
      mission: "US mission",
      rocket: "NCC 170",
      target: "Kepler-442 b",
    };

    const mock_launch_data_with_invalid_date = {
      mission: "US mission",
      rocket: "NCC 170",
      target: "Kepler-442 b",
      launchDate: "Manana",
    };

    test("It should respond with 201 created", async () => {
      const response = await request(app)
        .post("/v1/launches")
        .send(mock_launch_data)
        .expect("Content-Type", /json/)
        .expect(201);

      const request_date = new Date(mock_launch_data.launchDate).valueOf();
      const response_date = new Date(response.body.launchDate).valueOf();
      expect(request_date).toBe(response_date);

      expect(response.body).toMatchObject(mock_launch_data_without_date);
    });
    test("It should catch missing required properties", async () => {
      const response = await request(app)
        .post("/v1/launches")
        .send(mock_launch_data_without_date)
        .expect("Content-Type", /json/)
        .expect(400);

      expect(response.body).toStrictEqual({ error: "Missing launch property" });
    });
    test("It should catch invalid date", async () => {
      const response = await request(app)
        .post("/v1/launches")
        .send(mock_launch_data_with_invalid_date)
        .expect("Content-Type", /json/)
        .expect(400);

      expect(response.body).toStrictEqual({ error: "Invalid launch date" });
    });
  });
});
