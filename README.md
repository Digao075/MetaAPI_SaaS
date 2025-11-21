# BullAPI - WhatsApp SaaS Engine

![Status](https://img.shields.io/badge/status-production--ready-green)
![Stack](https://img.shields.io/badge/stack-NestJS%20%7C%20Next.js-blue)
![License](https://img.shields.io/badge/license-MIT-grey)

A multi-tenant B2B SaaS platform for WhatsApp automation and CRM. Built to leverage the official Meta Cloud API (WABA), providing high-throughput messaging, real-time multi-agent chat, and external integration capabilities.

## 🏗 Architecture

The system follows an event-driven architecture to ensure scalability and decoupling:

1.  **Ingestion:** Meta Webhooks are received and immediately queued in **Redis** via **BullMQ**.
2.  **Processing:** Asynchronous workers consume the queue, persist data to **PostgreSQL** via **Prisma**, and trigger automation logic.
3.  **Real-time:** Backend events are broadcasted to the Frontend via **Socket.io** (WebSockets).
4.  **Egress:** Business logic triggers outbound webhooks to external IPaaS (n8n, Zapier) for complex workflows.

## 🛠 Tech Stack

### Backend
* **Runtime:** Node.js (v20+)
* **Framework:** NestJS (Modular architecture)
* **Database:** PostgreSQL (Hosted on Neon.tech)
* **ORM:** Prisma
* **Queue/Cache:** Redis (Hosted on Upstash) + BullMQ
* **Auth:** JWT + Passport.js (BCrypt)

### Frontend
* **Framework:** Next.js 16 (App Router)
* **Language:** TypeScript
* **Styling:** Tailwind CSS
* **Icons:** Lucide React
* **State/Fetching:** Axios + React Hooks
* **Drag & Drop:** @hello-pangea/dnd (Kanban)
* **PWA:** next-pwa

## ✨ Key Features

* **Official WABA Integration:** Direct connection to Meta Cloud API (No emulation/QR Code).
* **Multi-tenancy:** Logic isolation per workspace (Tenant ID enforcement).
* **Real-time Chat:** WebSocket gateway for instant message delivery to the UI.
* **Kanban CRM:** Pipeline management with optimistic UI updates.
* **Hybrid Automation:** Internal keyword bot + Outbound Webhooks.
* **Feature Gating:** Plan-based resource limitation (Free/Starter/Pro).

## 🚀 Local Development

### Prerequisites
* Node.js 20+
* PostgreSQL Database (Local or Cloud)
* Redis Instance (Local or Cloud)
* Meta Developer Account (App ID & Phone Number ID)

* 📦 Deployment
Frontend: Optimized for Vercel (Zero config).

Backend: Optimized for Render/Railway (Dockerfile or Node environment).

Database: Neon.tech (Serverless Postgres).

📄 License
This project is proprietary software. Unauthorized copying of this file, via any medium, is strictly prohibited.

