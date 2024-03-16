# Setup Guide

> This guide will help you setup TubeCafe Backend on your local machine.
>
> I have used MacOS for the development, so the commands may differ for other operating systems.

<details>
<summary> Docker 🐳 </summary>

## Prerequisites

### Docker

- [ ] Docker
  - [Download from here](https://www.docker.com/products/docker-desktop)

### Cloudinary Account

- [ ] Create a Cloudinary Account
  - [Create an account](https://cloudinary.com/)
- [ ] Get the Cloudinary API Key, API Secret and Cloud Name (used in the `.env` file)

---

## Installation

1. Clone the repository

> You can also download the repository as a zip file and extract it

```bash
git clone https://github.com/McTechie/tubecafe-backend
```

2. Copy the contents of the `.env.example` file into a new `.env` file in the root directory and add the required values.

3. Start the server (Docker Compose)

> If the containers start successfully, the server will start at `http://localhost:8000` by default.
>
> If not, make sure the `.env` file is correctly configured.

```bash
docker-compose up -f docker-compose.yml -d
```

4. Stop the server

```bash
docker-compose down
```

</details>

<details>
<summary> Bare Metal 🔧 </summary>

## Prerequisites

### Node.js

> I've also mentioned the Exact version used in development

- [ ] Node.js (v16 or later)
  - [Download from here](https://nodejs.org/en/download/)

### MongoDB Atlas Account

- [ ] MongoDB Atlas Account
  - [Create an account](https://www.mongodb.com/cloud/atlas)
- [ ] Create a new Database Cluster
- [ ] Configure the IP Whitelist
- [ ] Create a new Database User
- [ ] Get the DB Connection String (used later)

### Cloudinary Account

- [ ] Create a Cloudinary Account
  - [Create an account](https://cloudinary.com/)
- [ ] Get the Cloudinary API Key, API Secret and Cloud Name (used in the `.env` file)

---

## Installation

1. Clone the repository

> You can also download the repository as a zip file and extract it

```bash
git clone https://github.com/McTechie/tubecafe-backend
```

2. Install dependencies

> **Note**: This project uses `pnpm` as the package manager. You can install it using the following command: `npm install -g pnpm`

```bash
cd tubecafe-backend
pnpm install # or npm install
```

3. Copy the contents of the `.env.example` file into a new `.env` file in the root directory and add the required values.

4. Start the server

> The server will start at `http://localhost:8000` by default, if you haven't changed the PORT in the `.env` file.
>
> To close the server, press `Ctrl + C` in the terminal.

```bash
pnpm start # or npm start
```

</details>

## API Documentation

The API documentation is auto-generated using Swagger. You can access the documentation at `http://localhost:{PORT}/docs`.

## Database Schema

The database schema is documented in the [SCHEMA.md](./docs/SCHEMA.md) file.
