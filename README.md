A secure, RESTful backend API for a Dog Adoption Platform built with Node.js, Express, MongoDB, and JWT authentication.

This project demonstrates production-level backend architecture, authentication, business logic validation, pagination, filtering, and automated testing.

//    Features

// User Registration & Authentication (JWT-based)

// Register dogs for adoption

// Adopt dogs with thank-you message

// Business rule enforcement:

.Cannot adopt your own dog

.Cannot adopt an already adopted dog

.Cannot delete adopted dogs

.Cannot delete dogs you do not own

// Pagination & filtering

// CORS enabled

// Environment variable security

// Fully tested with Mocha + Chai

// Layered architecture (routes, controllers, models, middleware)

// Tech Stack

Node.js

Express.js

MongoDB (Atlas)

Mongoose

JWT (jsonwebtoken)

bcryptjs

Mocha + Chai

Supertest

mongodb-memory-server (for isolated tests)
