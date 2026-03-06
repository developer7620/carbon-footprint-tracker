const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "🌱 Carbon Footprint Tracker API",
      version: "1.0.0",
      description: `
A production-ready REST API that helps small businesses track, analyze, 
and reduce their carbon emissions using real ESG industry standards.

## Features
- **Scope 1/2/3 Emission Classification** — Industry standard GHG Protocol
- **CO₂ Calculation Engine** — Using IPCC, EPA and GHG Protocol emission factors
- **Industry Benchmarking** — Compare against industry averages
- **Carbon Intensity Score** — 0-100 score based on benchmark performance
- **Reduction Goals** — Set and track emission reduction targets
- **Automated Email Reports** — Monthly reports via background job queue

## Authentication
All protected endpoints require a JWT token in the Authorization header:
\`Authorization: Bearer <token>\`

Get your token by registering at \`POST /api/auth/register\` 
or logging in at \`POST /api/auth/login\`
      `,
      contact: {
        name: "Aditya",
        url: "https://github.com/developer7620/carbon-footprint-tracker",
      },
      license: { name: "MIT" },
    },
    servers: [
      { url: "http://localhost:3000", description: "Development server" },
      {
        url: "https://carbon-footprint-tracker.railway.app",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT token from /api/auth/login",
        },
      },
      schemas: {
        // ─── Reusable Response Schemas ────────────────────────────
        SuccessResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Operation successful" },
            data: { type: "object" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Error description" },
          },
        },
        ValidationError: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Validation failed" },
            errors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field: { type: "string", example: "email" },
                  message: {
                    type: "string",
                    example: "Must be a valid email address",
                  },
                  value: { type: "string", example: "notanemail" },
                },
              },
            },
          },
        },
        // ─── Auth Schemas ─────────────────────────────────────────
        RegisterRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "owner@mybusiness.com",
            },
            password: { type: "string", minLength: 6, example: "password123" },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "owner@mybusiness.com",
            },
            password: { type: "string", example: "password123" },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            token: { type: "string", example: "eyJhbGciOiJIUzI1NiJ9..." },
            user: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                email: { type: "string", format: "email" },
                createdAt: { type: "string", format: "date-time" },
              },
            },
          },
        },
        // ─── Business Schemas ─────────────────────────────────────
        CreateBusinessRequest: {
          type: "object",
          required: ["name", "industry", "location", "employeeCount"],
          properties: {
            name: { type: "string", example: "Aditya Coffee Shop" },
            industry: { type: "string", example: "Restaurant" },
            location: { type: "string", example: "Mumbai, India" },
            employeeCount: { type: "integer", minimum: 1, example: 12 },
            annualRevenue: { type: "number", example: 2500000 },
          },
        },
        // ─── Log Schemas ──────────────────────────────────────────
        CreateLogRequest: {
          type: "object",
          required: ["categoryId", "quantity", "date"],
          properties: {
            categoryId: { type: "string", format: "uuid" },
            quantity: { type: "number", minimum: 0.01, example: 350 },
            date: { type: "string", format: "date", example: "2026-02-01" },
            notes: {
              type: "string",
              maxLength: 500,
              example: "February electricity bill",
            },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);
module.exports = swaggerSpec;
