const host = process.env.SWAGGER_DOMAIN || "localhost:5000";
export default {
  swagger: "2.0",
  info: {
    description: "this is  add one machine  api",
    version: "1.0.0",
    title: "Swagger",
  },
  host: `${host}`,
  basePath: "",
  tags: [
    {
      name: "Auth",
      description: "Everything about machine login",
    },
    {
      name: "Activity",
      description: "Everything about activity",
    },
  ],
  schemes: ["http"],
  paths: {
    "/machineApi/login": {
      post: {
        tags: ["Auth"],
        summary: "machine login",
        description: "",
        operationId: "login",
        consumes: ["application/json"],
        produces: ["application/json"],
        parameters: [
          {
            in: "body",
            name: "body",
            description: "Pet object that needs to be added to the store",
            required: true,
            schema: {
              $ref: "#/definitions/loginRequest",
            },
          },
        ],
        responses: {
          "200": {
            description: "successful operation",
            schema: {
              $ref: "#/definitions/loginResponse",
            },
          },
        },
      },
    },
    "/machineApi/activitys": {
      get: {
        tags: ["Activty"],
        summary: "Find Activitys",
        description: "",
        operationId: "getActivitys",
        produces: ["application/json"],
        parameters: [
          {
            name: "authorization",
            in: "header",
            description: "token",
            required: true,
            type: "string",
            default:
              "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MTIzNTQ3MDMsImRhdGEiOnsidXNlcklkIjoxLCJtYWNoaW5lSWQiOjF9LCJpYXQiOjE2MTIzNTExMDN9.l6ErBZMXQFjEvB3B1OtlA1j4C0CKnv0tXPwL9-hHPw0",
          },
        ],
        responses: {
          "200": {
            description: "successful operation",
            schema: {
              $ref: "#/definitions/activitysResponse",
            },
          },
        },
      },
    },
  },
  definitions: {
    loginRequest: {
      type: "object",
      properties: {
        username: {
          type: "string",
          default: "123",
        },
        password: {
          type: "string",
          default: "123",
        },
        code: {
          type: "string",
          default: "111",
        },
      },
      complete: {
        type: "boolean",
        default: false,
      },
    },
    loginResponse: {
      type: "object",
      properties: {
        token: {
          type: "string",
          default:
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MTIzNTEwNTgsImRhdGEiOnsidXNlcklkIjoxLCJtYWNoaW5lSWQiOjF9LCJpYXQiOjE2MTIzNDc0NTh9.4h6cgrPRRWBvea-KwMfGc3Yx1a412u0mib1nv8WSHAw",
        },
      },
    },
    activitysResponse: {
      type: "array",
      items: {
        $ref: "#/definitions/activity",
      },
    },
    activity: {
      type: "object",
      properties: {
        id: {
          type: "number",
          default: 1,
        },
        code: {
          type: "string",
          default: "111",
          description: "????????????",
        },
        name: {
          type: "string",
          default: "dogs",
          description: "????????????",
        },
        images: {
          type: "array",
          items: {
            type: "string",
            default: "http://207.148.113.123/images/ZG9n-1611576458452.jpeg",
          },
          description: "?????????",
        },
        videos: {
          type: "array",
          items: {
            type: "string",
            default: "http://207.148.113.123/images/ZG9n-1611576458452.jpeg",
          },
          description: "????????????",
        },
        description: {
          type: "string",
          default: "dogs",
          description: "????????????",
        },
        start_at: {
          type: "integer",
          default: 1611576721,
          description: "????????????",
        },
        end_at: {
          type: "integer",
          default: 1611576721,
          description: "????????????",
        },
        price: {
          type: "integer",
          default: 1000,
          description: "??????",
        },
        discounts: {
          type: "array",
          items: {
            $ref: "#/definitions/discount",
          },
          description: "????????????",
        },
        discountPrice: {
          type: "integer",
          default: 1000,
          description: "?????????",
        },
        linkCount: {
          type: "integer",
          default: 1000,
          description: "????????????",
        },
        registeredCount: {
          type: "integer",
          default: 1000,
          description: "????????????",
        },
        link: {
          type: "string",
          default: "http://207.148.113.123/publish/1",
          description: "",
        },
      },
    },
    discount: {
      type: "object",
      properties: {
        id: {
          type: "integer",
          default: 1,
        },
        level: {
          type: "integer",
          default: 1,
          description: "?????????",
        },
        peopleCount: {
          type: "integer",
          default: 1,
          description: "??????",
        },
        percent: {
          type: "integer",
          default: 1,
          description: "?????????",
        },
        activityId: {
          type: "integer",
          default: 1,
        },
        createdAt: {
          type: "string",
          default: "2021-01-25T12:09:54.962Z",
        },
        updateAt: {
          type: "string",
          default: "2021-01-25T12:09:54.962Z",
        },
      },
    },
  },
};
