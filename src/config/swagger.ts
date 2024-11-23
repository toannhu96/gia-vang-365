import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Vietnamese Gold Price API",
      version: "1.0.0",
      description: "API for fetching Vietnamese gold prices from DOJI",
      contact: {
        name: "Toan Nhu",
        email: "toanbk21096@gmail.com",
        url: "https://linkedin.com/in/toannhu/",
      },
      license: {
        name: "Apache 2.0",
        url: "http://www.apache.org/licenses/LICENSE-2.0.html",
      },
    },
    servers: [
      {
        url: "https://giavang365.io.vn",
        description: "Server production",
      },
    ],
  },
  apis: ["./src/routes/*.ts"],
};

export const specs = swaggerJsdoc(options);
