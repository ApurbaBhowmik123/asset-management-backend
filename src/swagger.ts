import swaggerJsdoc from "swagger-jsdoc";

const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "My Node.js TypeScript API",
      version: "1.0.0",
      description: "API documentation for my project",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
    ],
  },
  apis: ["./src/routes/**/*.ts", "./src/controller/**/*.ts","./src/api-docs/**/*.ts"], 
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

export default swaggerSpec;
