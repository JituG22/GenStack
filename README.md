# GenStack - Drag & Drop Node-based Framework

![GenStack Logo](https://via.placeholder.com/200x100?text=GenStack)

GenStack is a visual low-code platform that allows users to drag-and-drop nodes to build applications, APIs, forms, web pages, and CI/CD pipelines. Each node contains templates, validations, inputs, and metadata that can be saved and reused across projects.

## 🚀 Features

- **Drag & Drop Canvas** - Visual interface built with React Flow
- **Node Property Panel** - Dynamic fields and validations for each node
- **Template System** - Save & reuse node templates across projects
- **Role-based Access Control** - Fine-grained permissions for teams
- **MongoDB Persistence** - Scalable data storage for nodes and templates
- **Real-time Testing** - Test nodes with built-in validation
- **Multi-Node Support** - React, Angular, Node.js, Python, DB queries, CI/CD steps

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, React Flow
- **Backend**: Node.js, Express, MongoDB, Mongoose
- **Authentication**: JWT + RBAC
- **Testing**: Jest, React Testing Library
- **DevOps**: GitHub Actions

## 🏗️ Architecture

```
Frontend (React)
├── Canvas View (React Flow)
├── Node Components
├── Config Modal (Properties, Code, Validation)
└── Preview & Run Test

Backend (Node.js)
├── Auth API
├── Node CRUD API
├── Template Save/Clone API
└── Role Management API

Database (MongoDB)
├── Nodes Collection
├── Templates
├── Users
└── Roles
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (v6 or higher)
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/genstack.git
   cd genstack
   ```

2. **Install dependencies**

   ```bash
   npm run install:all
   ```

3. **Set up environment variables**

   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your MongoDB connection and other configs
   ```

4. **Setup database**

   ```bash
   npm run setup
   npm run seed
   ```

5. **Start development servers**

   ```bash
   npm run dev
   ```

   This will start both frontend (http://localhost:3000) and backend (http://localhost:5000)

### Individual Commands

- **Frontend only**: `npm run dev:frontend`
- **Backend only**: `npm run dev:backend`
- **Build for production**: `npm run build`
- **Run tests**: `npm run test`

## 📁 Project Structure

```
genstack/
├── README.md
├── .gitignore
├── package.json
├── /docs                    # Documentation
│   ├── architecture.md
│   ├── user-guide.md
│   ├── api-spec.md
│   └── node-types.md
├── /frontend               # React frontend
│   ├── /src
│   │   ├── /components     # Reusable UI components
│   │   ├── /pages          # Page components
│   │   ├── /nodes          # Node type definitions
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── tailwind.config.js
├── /backend                # Node.js backend
│   ├── /controllers        # Route handlers
│   ├── /routes            # API routes
│   ├── /models            # Database models
│   ├── /middleware        # Custom middleware
│   └── server.ts
├── /scripts               # Setup and utility scripts
│   ├── seed.js           # Database seeding
│   └── setup.js          # Initial setup
└── /tests                # Test files
```

## 📖 Documentation

- [Architecture Overview](./docs/architecture.md)
- [User Guide](./docs/user-guide.md)
- [API Specification](./docs/api-spec.md)
- [Node Types](./docs/node-types.md)

## 🧪 Node Types

GenStack supports various node types out of the box:

- **UI Components**: React, Angular components
- **APIs**: Node.js, Python API endpoints
- **Database**: MongoDB, PostgreSQL queries
- **CI/CD**: Build steps, deployment actions
- **Forms**: Input fields, validation rules
- **Custom**: User-defined templates

## 🔐 Security

- JWT-based authentication
- Role-based access control (RBAC)
- Input validation and sanitization
- Template isolation
- Code injection protection

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./docs/contributing.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📧 Email: support@genstack.io
- 💬 Discord: [GenStack Community](https://discord.gg/genstack)
- 📖 Docs: [docs.genstack.io](https://docs.genstack.io)

## 🗺️ Roadmap

- [ ] Plugin system for custom nodes
- [ ] Marketplace for node templates
- [ ] LLM integration for auto-generation
- [ ] Advanced CI/CD integrations
- [ ] Export to code functionality

---

Made with ❤️ by the GenStack Team
